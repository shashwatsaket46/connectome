import { createFileRoute } from "@tanstack/react-router";

import { isAdminRequest } from "@/lib/admin-auth";
import { setExperimentFlagOnGitHub } from "@/lib/admin-github";

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

        // { id, enabled } shows/hides a tile for everyone; { id, isNew } sets its "new" pill.
        let body: { id?: string; enabled?: boolean; isNew?: boolean };
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ ok: false, error: "Bad request" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }
        const flag =
          typeof body.enabled === "boolean" ? "enabled" : typeof body.isNew === "boolean" ? "isNew" : null;
        if (!body.id || flag === null) {
          return new Response(JSON.stringify({ ok: false, error: "id and enabled or isNew are required" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const value = flag === "enabled" ? body.enabled : body.isNew;
        const result = await setExperimentFlagOnGitHub(body.id, flag, value as boolean);
        return new Response(JSON.stringify(result), {
          status: result.ok ? 200 : 502,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
