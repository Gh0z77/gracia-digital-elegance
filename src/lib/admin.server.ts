import { getRequest, useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

type AdminSession = { unlocked?: boolean };

const SESSION_NAME = "gracia-admin";
const SESSION_MAX_AGE = 60 * 60 * 12;
const MIN_SECRET_LENGTH = 32;

export class ConfigError extends Error {}

function sessionSecret(): string {
  const secret = process.env["SESSION_SECRET"];
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new ConfigError(
      `SESSION_SECRET is missing or shorter than ${MIN_SECRET_LENGTH} characters. ` +
        "Add it to .env.local for local development, or to your host's secrets for production.",
    );
  }
  return secret;
}

function sessionConfig() {
  return {
    password: sessionSecret(),
    name: SESSION_NAME,
    maxAge: SESSION_MAX_AGE,
    cookie: {
      httpOnly: true,
      // Browsers drop `secure` cookies over plain http, which silently breaks
      // the passcode on http://localhost — so only require it in production.
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

export function getAdminSession() {
  return useSession<AdminSession>(sessionConfig());
}

export function passcodeMatches(input: string, expected: string): boolean {
  // Hash both sides first: timingSafeEqual throws on length mismatch, and the
  // length of the raw input would otherwise leak through that throw.
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session.data.unlocked) throw new Error("UNAUTHORIZED");
  return session;
}

/* -------------------------------------------------------------------------- */
/* Login throttling                                                            */
/* -------------------------------------------------------------------------- */

// A short passcode is brute-forceable in seconds without a limit. One process
// holds this map, which is enough for a single-restaurant deployment; a
// multi-instance host would need to move it to Supabase or KV.
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

const attempts = new Map<string, { count: number; firstAt: number }>();

export function clientKey(): string {
  const headers = getRequest()?.headers;
  const forwarded = headers?.get("x-forwarded-for")?.split(",")[0]?.trim();
  return headers?.get("cf-connecting-ip") ?? forwarded ?? "unknown";
}

function prune(now: number) {
  for (const [key, entry] of attempts) {
    if (now - entry.firstAt > ATTEMPT_WINDOW_MS) attempts.delete(key);
  }
}

export function isThrottled(key: string): boolean {
  const now = Date.now();
  prune(now);
  const entry = attempts.get(key);
  return Boolean(entry && entry.count >= MAX_ATTEMPTS);
}

export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.firstAt > ATTEMPT_WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: now });
    return;
  }
  entry.count += 1;
}

export function clearAttempts(key: string): void {
  attempts.delete(key);
}
