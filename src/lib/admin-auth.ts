// Server-only. Backs the /api/admin/* routes: checks the shared admin
// password and signs/verifies the session cookie. Uses Web Crypto
// (crypto.subtle) everywhere instead of Node's `crypto` module so this runs
// unmodified on both the Vercel (Node) and Cloudflare Workers (default)
// Nitro presets this app builds for.

const ALLOWED_PASSWORD_HASHES = new Set([
  "119bf5d0aa21a0c004a5d162c554b301d1f0ea9625ef76ef22c420e5af405f60", // shashwat
  "2ca879f11cb1220afd8b879c29f75dde93716e31d07adfab2437120ab01aff75", // erdem
]);

export const ADMIN_SESSION_COOKIE = "cm_admin";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function isValidAdminPassword(password: string): Promise<boolean> {
  if (!password) return false;
  return ALLOWED_PASSWORD_HASHES.has(await sha256Hex(password));
}

function sessionSecret(): string {
  // Falls back to a fixed value so the login works out of the box; set
  // ADMIN_SESSION_SECRET in the hosting env for a deployment-specific one.
  return process.env["ADMIN_SESSION_SECRET"] || "connectionminer-admin-default-secret";
}

// Stateless "session": every logged-in browser gets the same token, derived
// from a server-only secret. There's no per-user session store to run this
// on serverless/Workers, so a valid cookie just proves the holder once
// completed the password check -- it isn't tied to who they are.
export async function makeSessionToken(): Promise<string> {
  return sha256Hex(`cm-admin-session:${sessionSecret()}`);
}

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return null;
}

export async function isAdminRequest(request: Request): Promise<boolean> {
  const token = readCookie(request, ADMIN_SESSION_COOKIE);
  if (!token) return false;
  return token === (await makeSessionToken());
}

export function setSessionCookieHeader(token: string): string {
  const maxAge = 60 * 60 * 24 * 30; // 30 days
  return `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookieHeader(): string {
  return `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
