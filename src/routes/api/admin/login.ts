import { createFileRoute } from "@tanstack/react-router";

import { isValidAdminPassword, makeSessionToken, setSessionCookieHeader } from "@/lib/admin-auth";

export const Route = createFileRoute("/api/admin/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { password?: string };
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ ok: false, error: "Bad request" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        if (!(await isValidAdminPassword(body.password ?? ""))) {
          return new Response(JSON.stringify({ ok: false, error: "Wrong password" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "content-type": "application/json",
            "set-cookie": setSessionCookieHeader(await makeSessionToken()),
          },
        });
      },
    },
  },
});
