import { createFileRoute } from "@tanstack/react-router";

import { EXPERIMENT_BRIDGE_SCRIPT } from "@/lib/experiment-bridge";
import { EXPERIMENT_ENHANCE_SCRIPT, EXPERIMENT_PALETTE_CSS } from "@/lib/experiment-enhance";
import { EXPERIMENT_INPUTS_SCRIPT } from "@/lib/experiment-inputs";
import { SEED_EXPERIMENTS } from "@/lib/experiments";

export const Route = createFileRoute("/api/public/experiment/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const experiment = SEED_EXPERIMENTS.find((e) => e.id === params.id);
        if (!experiment) return new Response("Unknown experiment", { status: 404 });

        const origin = new URL(request.url).origin;
        // Bundles live on Lovable's asset CDN (/__l5e/...). That path only
        // exists on Lovable-hosted origins, so when the app runs elsewhere
        // (Vercel, Netlify, localhost build, custom host) fall back to an
        // absolute asset base. Override with ASSET_BASE_URL if needed.
        const assetBase =
          process.env["ASSET_BASE_URL"] ??
          "https://project--3b47e950-dbff-4681-a4b3-0e3c66cfc349.lovable.app";

        const candidates = experiment.url.startsWith("http")
          ? [experiment.url]
          : [`${origin}${experiment.url}`, `${assetBase}${experiment.url}`];

        let upstream: Response | undefined;
        for (const target of candidates) {
          try {
            const res = await fetch(target);
            if (res.ok && res.body && (res.headers.get("content-type") ?? "").includes("html")) {
              upstream = res;
              break;
            }
          } catch {
            /* try next candidate */
          }
        }
        if (!upstream?.body) {
          return new Response("Failed to load experiment bundle", { status: 502 });
        }

        // The CDN serves these bundles as downloadable attachments with a
        // script-blocking CSP. Re-serve them as a normal, interactive HTML
        // document so the dashboard runs inside the hub iframe.
        const body = upstream.body;
        const encoder = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            // Doctype must be the very first thing on the wire, otherwise the
            // browser falls back to quirks mode and the bundle's layout breaks.
            // Palette next so the bundle paints in hub colors immediately,
            // even before the (large) document finishes streaming.
            controller.enqueue(encoder.encode("<!doctype html>\n"));
            controller.enqueue(encoder.encode(EXPERIMENT_PALETTE_CSS));
            const reader = body.getReader();
            for (;;) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value) controller.enqueue(value);
            }
            controller.enqueue(encoder.encode(EXPERIMENT_ENHANCE_SCRIPT));
            controller.enqueue(encoder.encode(EXPERIMENT_INPUTS_SCRIPT));
            controller.enqueue(encoder.encode(EXPERIMENT_BRIDGE_SCRIPT));
            controller.close();
          },
        });

        return new Response(stream, {
          status: 200,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
