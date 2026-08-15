import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Intro } from "@/components/Intro";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Toaster } from "@/components/ui/sonner";
import { DEFAULT_LOCALE, I18nProvider, LOCALE_TAGS, dict, useI18n, type Locale } from "@/lib/i18n";
import { resolveLocale } from "@/lib/i18n/locale.functions";
import { OrderProvider } from "@/lib/order";
import { prefetchSiteData } from "@/lib/prefetch";

const OG_IMAGE =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80";

const OG_LOCALES: Record<Locale, string> = { uz: "uz_UZ", ru: "ru_RU", en: "en_US" };

function restaurantJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: "Gracia Family",
    description: dict(locale).meta.rootDescription,
    servesCuisine: "Italian",
    priceRange: "$$",
    telephone: "+998996099999",
    image: OG_IMAGE,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Andijan",
      addressCountry: "UZ",
    },
    openingHours: "Mo-Su 10:00-23:00",
    acceptsReservations: true,
    sameAs: ["https://instagram.com/gracia_restaurant"],
  };
}

/** Reads the locale that `beforeLoad` put on the root match. */
function useRouterLocale(): Locale {
  return useRouterState({
    select: (state) =>
      (state.matches[0]?.context as { locale?: Locale } | undefined)?.locale ?? DEFAULT_LOCALE,
  });
}

/**
 * The 404 and error screens read the dictionary straight from the router rather
 * than from context. They are the two components that can be asked to render
 * when the shell around them did not finish — an error thrown during the shell's
 * own render leaves `I18nProvider` unmounted, and a fallback screen that throws
 * `useI18n must be used inside <I18nProvider>` turns a handled error into a
 * blank page.
 */
function NotFoundComponent() {
  const t = dict(useRouterLocale());
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="eyebrow">{t.notFound.eyebrow}</p>
        <h1 className="font-display mt-5 text-5xl">{t.notFound.title}</h1>
        <p className="mt-4 text-sm text-muted-foreground">{t.notFound.body}</p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-block border border-gold/50 px-7 py-3.5 text-[0.65rem] tracking-[0.28em] text-gold uppercase transition-all duration-500 hover:bg-gold hover:text-primary-foreground"
          >
            {t.common.backHome}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const t = dict(useRouterLocale());
  const router = useRouter();

  // Production React does not rethrow boundary-caught errors to window.onerror,
  // so this is the only place they surface for an error-tracking service.
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl">{t.error.title}</h1>
        <p className="mt-4 text-sm text-muted-foreground">{t.error.body}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="border border-gold/50 px-7 py-3.5 text-[0.65rem] tracking-[0.28em] text-gold uppercase transition-all duration-500 hover:bg-gold hover:text-primary-foreground"
          >
            {t.common.tryAgain}
          </button>
          <a
            href="/"
            className="border border-border px-7 py-3.5 text-[0.65rem] tracking-[0.28em] text-muted-foreground uppercase transition-colors hover:text-foreground"
          >
            {t.common.goHome}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  // Runs before every match, on the server from headers and on the client from
  // the cookie, so `head()` and the shell both see the same language.
  beforeLoad: async () => ({ locale: await resolveLocale() }),
  // The header, footer and hero all read the same two tables, so warm them once
  // for every route rather than repeating a loader on each page.
  loader: ({ context }) => prefetchSiteData(context.queryClient),
  head: ({ match }) => {
    const locale = (match.context as { locale?: Locale }).locale ?? DEFAULT_LOCALE;
    const t = dict(locale);
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: t.meta.homeTitle },
        { name: "description", content: t.meta.rootDescription },
        { name: "theme-color", content: "#0b0b0d" },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "Gracia Family" },
        { property: "og:locale", content: OG_LOCALES[locale] },
        { property: "og:image", content: OG_IMAGE },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: OG_IMAGE },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        // The plate images are the hero's LCP and all come from this CDN.
        { rel: "preconnect", href: "https://images.unsplash.com" },
        // Fraunces for display: thick stems and soft terminals, warm rather than
        // the hairline glamour of a didone. DM Sans carries the body. Both are
        // variable, so weight and optical size cost nothing extra.
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,400..700,0..100,0..1&family=DM+Sans:opsz,wght@9..40,300..700&display=swap",
        },
        { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const locale = useRouterLocale();

  return (
    <html lang={LOCALE_TAGS[locale]}>
      <head>
        <HeadContent />
      </head>
      <body>
        {/* The provider lives here rather than in RootComponent so the 404 and
            error screens, which render instead of it, are translated too. */}
        <I18nProvider locale={locale}>{children}</I18nProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd(locale)) }}
        />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      <OrderProvider>
        {!isAdmin && <Intro />}
        {!isAdmin && (
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[110] focus:border focus:border-gold focus:bg-background focus:px-5 focus:py-3 focus:text-[0.65rem] focus:tracking-[0.28em] focus:text-gold focus:uppercase"
          >
            {t.nav.skip}
          </a>
        )}
        {!isAdmin && <SiteHeader />}
        {/* Keyed by pathname so React remounts it on navigation and the CSS
            enter animation replays. */}
        <main id="main" key={pathname} className="page-enter">
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </main>
        {!isAdmin && <SiteFooter />}
        <Toaster />
      </OrderProvider>
    </QueryClientProvider>
  );
}
