// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Outside Lovable hosting the Nitro build defaults to the Cloudflare preset, which
// produces an output layout Vercel cannot serve — every URL then 404s. On Vercel we pin
// the `vercel` preset so Nitro emits `.vercel/output` (Build Output API), which Vercel
// serves directly, SSR handler included. `npm run build:vercel` sets NITRO_PRESET=vercel
// explicitly; the VERCEL env sniffing below is only a fallback.
const isVercel = process.env["VERCEL"] === "1" || Boolean(process.env["VERCEL_ENV"]);
const preset = process.env["NITRO_PRESET"] || (isVercel ? "vercel" : undefined);

if (preset) {
  // Nitro also reads these; keep them consistent so no other layer re-selects cloudflare.
  process.env["NITRO_PRESET"] = preset;
  process.env["SERVER_PRESET"] = preset;
  console.log(`[build] nitro preset: ${preset}`);
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Let the preset own the output layout (.vercel/output for Vercel) — do not force
  // dist/{client,server}, that layout is what Vercel 404s on.
  ...(preset ? { nitro: { preset } } : {}),
});
