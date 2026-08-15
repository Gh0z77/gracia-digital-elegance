import { fileURLToPath } from "node:url";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, loadEnv } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Vite only exposes VITE_* variables, and only through import.meta.env. The
  // SSR handler reads server-only secrets (SESSION_SECRET, ADMIN_PASSCODE,
  // SUPABASE_SERVICE_ROLE_KEY) from process.env, and during `vite dev` that is
  // this very Node process — so mirror the .env files into it. In production the
  // host supplies them, and a real environment variable always wins.
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }

  // The server bundle is built separately and does not get Vite's automatic
  // import.meta.env substitution, so inline the public values explicitly.
  const define = Object.fromEntries(
    Object.entries(env)
      .filter(([key]) => key.startsWith("VITE_"))
      .map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)]),
  );

  return {
    define,
    css: { transformer: "lightningcss" as const },
    // strictPort: fail loudly rather than silently sliding to 8081 when an old
    // dev server is still holding the port — otherwise you end up testing stale
    // code on the address you expected.
    server: { port: 8080, strictPort: true },
    preview: { port: 8080, strictPort: true },
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
      // Two copies of React or of the query cache break hooks and hydration.
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
    },
    // No manualChunks here on purpose: hand-grouping vendors fought the
    // bundler's own splitting and produced entangled chunks that all had to be
    // downloaded together. Its default output is both smaller and cleaner.
    plugins: [
      tailwindcss(),
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      tanstackStart({
        // Route the bundled server entry through src/server.ts, our SSR error wrapper.
        server: { entry: "server" },
        // Fail the build if server-only code is ever pulled into a client bundle.
        importProtection: {
          behavior: "error",
          client: { files: ["**/server/**"], specifiers: ["server-only"] },
        },
      }),
      // Nitro turns the SSR output into a deployable server. It auto-detects
      // Vercel/Netlify/Cloudflare from the CI environment and falls back to a
      // Cloudflare module worker. Build-only — it has no role in `vite dev`.
      //
      // The Vercel runtime is pinned rather than inferred. Left to itself Nitro
      // picks `bun1.x` whenever the build happens to run under Bun and a
      // `nodejs<local major>.x` otherwise — so the same commit could deploy onto
      // a different engine depending on which binary the CI ran the build with.
      // Node 22 is what this app is tested against.
      ...(command === "build"
        ? [
            nitro({
              defaultPreset: "cloudflare-module",
              vercel: { functions: { runtime: "nodejs22.x" } },
            }),
          ]
        : []),
      react(),
    ],
  };
});
