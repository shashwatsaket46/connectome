import { createFileRoute } from "@tanstack/react-router";

import { isAdminRequest } from "@/lib/admin-auth";

export const Route = createFileRoute("/api/admin/session")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const authenticated = await isAdminRequest(request);
        return new Response(JSON.stringify({ authenticated }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
