/**
 * Telegram notifications for the front of house.
 *
 * The restaurant reads bookings on a phone, not in a dashboard, so every
 * confirmed request is pushed to a Telegram chat. Two rules shape this file:
 *
 *   1. A notification must never cost a guest their table. Telegram being down,
 *      slow, or unconfigured is logged and swallowed — the booking is already
 *      in the database by the time we get here.
 *   2. The bot token is a credential. It is read from the environment inside the
 *      handler and never returned, logged, or sent to the browser. This module
 *      is `.server.ts` so it cannot be pulled into the client bundle.
 */

const API_ROOT = "https://api.telegram.org";

// Past this the guest is staring at a spinner for a message that is not theirs.
const SEND_TIMEOUT_MS = 4000;

export type TelegramConfig = { token: string; chatId: string };

export function readTelegramConfig(): TelegramConfig | null {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  const chatId = process.env["TELEGRAM_CHAT_ID"];
  return token && chatId ? { token, chatId } : null;
}

export function telegramConfigured(): boolean {
  return readTelegramConfig() !== null;
}

/** Telegram's HTML mode: these four are the only characters it needs escaped. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type SendResult = { ok: true } | { ok: false; reason: string };

/**
 * Fire one message at the chat. Resolves either way — callers are expected to
 * carry on regardless, so the result is for logging and the admin health check
 * rather than for control flow.
 */
export async function sendTelegramMessage(html: string): Promise<SendResult> {
  const config = readTelegramConfig();
  if (!config) return { ok: false, reason: "not-configured" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_ROOT}/bot${config.token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        chat_id: config.chatId,
        text: html,
        parse_mode: "HTML",
        // The booking body is the message; a link preview would only add noise.
        link_preview_options: { is_disabled: true },
      }),
    });

    if (!response.ok) {
      // Telegram explains itself in the body — the description is what tells an
      // operator whether the token or the chat id is the wrong one.
      const detail = await response.text().catch(() => "");
      const reason = `http-${response.status}`;
      console.error(`[telegram] send failed (${reason}): ${detail.slice(0, 300)}`);
      return { ok: false, reason };
    }

    return { ok: true };
  } catch (error) {
    const reason = error instanceof Error && error.name === "AbortError" ? "timeout" : "network";
    console.error(`[telegram] send failed (${reason})`);
    return { ok: false, reason };
  } finally {
    clearTimeout(timer);
  }
}

export type BookingNotice = {
  fullName: string;
  phone: string;
  guests: number;
  date: string;
  time: string;
  notes: string;
  tableCode: string | null;
  tableLabel: string | null;
  /** The language the guest was browsing in — useful when calling them back. */
  locale: string;
};

const LOCALE_LABEL: Record<string, string> = {
  uz: "O‘zbekcha",
  ru: "Ruscha",
  en: "Inglizcha",
};

/**
 * The message the restaurant actually reads, in Uzbek — it is for the staff,
 * not the guest. Every interpolated value is escaped: a guest controls their own
 * name and notes, and `<b>` in a notes field must not become markup.
 */
export function formatBookingNotice(booking: BookingNotice): string {
  const lines = [
    "🍽 <b>Yangi stol bandlovi</b>",
    "",
    `👤 <b>${escapeHtml(booking.fullName)}</b>`,
    `📞 ${escapeHtml(booking.phone)}`,
    `📅 ${escapeHtml(booking.date)}  🕗 ${escapeHtml(booking.time)}`,
    `👥 ${booking.guests} mehmon`,
  ];

  if (booking.tableCode) {
    const label = booking.tableLabel ? ` · ${escapeHtml(booking.tableLabel)}` : "";
    lines.push(`🪑 <b>${escapeHtml(booking.tableCode)}</b>${label}`);
  } else {
    lines.push("🪑 Stol tanlanmagan — joylashtirish kerak");
  }

  if (booking.notes.trim()) {
    lines.push("", `📝 ${escapeHtml(booking.notes.trim())}`);
  }

  lines.push("", `🌐 Til: ${LOCALE_LABEL[booking.locale] ?? booking.locale}`);
  lines.push("<i>Gracia Family · boshqaruv xonasida tasdiqlang</i>");

  return lines.join("\n");
}
