import { createFileRoute } from "@tanstack/react-router";

import { isAdminRequest } from "@/lib/admin-auth";
import { setExperimentEnabledOnGitHub } from "@/lib/admin-github";

export const Route = createFileRoute("/api/admin/toggle")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await isAdminRequest(request))) {
          return new Response(JSON.stringify({ ok: false, error: "Not logged in" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }

        let body: { id?: string; enabled?: boolean };
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ ok: false, error: "Bad request" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }
        if (!body.id || typeof body.enabled !== "boolean") {
          return new Response(JSON.stringify({ ok: false, error: "id and enabled are required" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const result = await setExperimentEnabledOnGitHub(body.id, body.enabled);
        return new Response(JSON.stringify(result), {
          status: result.ok ? 200 : 502,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
