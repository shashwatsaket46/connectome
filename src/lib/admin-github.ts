// Server-only. This app's registry (SEED_EXPERIMENTS in src/lib/experiments.ts)
// is the one source of truth every visitor's browser falls back to -- a plain
// per-browser toggle (see useExperiments in experiments.ts) only overrides it
// locally. To hide something for *everyone*, the seed itself has to change,
// which means a real commit to the repo. This commits that one `enabled`
// flip via the GitHub Contents API, using a token configured on the host
// (never exposed to the client), so a redeploy picks it up for all visitors.

const EXPERIMENTS_FILE_PATH = "src/lib/experiments.ts";

type GithubConfig = { token: string; repo: string; branch: string };

function githubConfig(): GithubConfig | null {
  const token = process.env["ADMIN_GITHUB_TOKEN"];
  if (!token) return null;
  const repo = process.env["ADMIN_GITHUB_REPO"] || "shashwatsaket46/connectome";
  const branch = process.env["ADMIN_GITHUB_BRANCH"] || "master";
  return { token, repo, branch };
}

export function githubAdminConfigured(): boolean {
  return githubConfig() !== null;
}

function base64ToUtf8(b64: string): string {
  const binary = atob(b64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

export type ToggleResult = { ok: true; commit: string } | { ok: false; error: string };

export async function setExperimentEnabledOnGitHub(
  id: string,
  enabled: boolean,
): Promise<ToggleResult> {
  const config = githubConfig();
  if (!config) {
    return { ok: false, error: "ADMIN_GITHUB_TOKEN is not configured on this deployment." };
  }
  const { token, repo, branch } = config;
  const apiBase = `https://api.github.com/repos/${repo}/contents/${EXPERIMENTS_FILE_PATH}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "connectionminer-admin",
  };

  const getRes = await fetch(`${apiBase}?ref=${encodeURIComponent(branch)}`, { headers });
  if (!getRes.ok) {
    return {
      ok: false,
      error: `Could not read ${EXPERIMENTS_FILE_PATH} from GitHub (${getRes.status}).`,
    };
  }
  const file = (await getRes.json()) as { content: string; sha: string };
  const current = base64ToUtf8(file.content);

  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(id:\\s*"${escapedId}"[\\s\\S]*?enabled:\\s*)(true|false)`);
  if (!pattern.test(current)) {
    return { ok: false, error: `Could not find experiment "${id}" in ${EXPERIMENTS_FILE_PATH}.` };
  }
  const updated = current.replace(pattern, `$1${enabled}`);
  if (updated === current) {
    return { ok: true, commit: file.sha }; // already in the desired state
  }

  const putRes = await fetch(apiBase, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `${enabled ? "Show" : "Hide"} "${id}" for everyone (admin toggle)`,
      content: utf8ToBase64(updated),
      sha: file.sha,
      branch,
    }),
  });
  if (!putRes.ok) {
    const text = await putRes.text().catch(() => "");
    return { ok: false, error: `GitHub commit failed (${putRes.status}): ${text.slice(0, 200)}` };
  }
  const putBody = (await putRes.json()) as { commit?: { sha?: string } };
  return { ok: true, commit: putBody.commit?.sha ?? "" };
}
