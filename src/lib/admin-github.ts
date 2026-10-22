// Server-only. This app's registry (SEED_EXPERIMENTS in src/lib/experiments.ts)
// is the one source of truth every visitor's browser falls back to -- a plain
// per-browser toggle (see useExperiments in experiments.ts) only overrides it
// locally. To hide something for *everyone*, the seed itself has to change,
// which means a real commit to the repo. This commits that one `enabled` (or
// `isNew`) flip via the GitHub Contents API, using a token configured on the host
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

// The registry flags an admin can flip for everyone: `enabled` (show/hide the
// tile) and `isNew` (the red "new" pill in the sidebar).
export type ExperimentFlag = "enabled" | "isNew";

// Rewrites one flag inside one SEED_EXPERIMENTS entry. `enabled` is always
// present; `isNew` is optional, so it is inserted after `enabled:` when absent.
function setFlagInSource(
  source: string,
  id: string,
  flag: ExperimentFlag,
  value: boolean,
): string | null {
  const start = source.indexOf(`id: "${id}"`);
  if (start === -1) return null;
  const end = source.indexOf("\n  },", start);
  if (end === -1) return null;
  const block = source.slice(start, end);
  let next: string;
  if (new RegExp(`\\b${flag}:\\s*(true|false)`).test(block)) {
    next = block.replace(new RegExp(`(\\b${flag}:\\s*)(true|false)`), `$1${value}`);
  } else if (flag === "isNew") {
    next = block.replace(/(\n(\s*)enabled:\s*(?:true|false),)/, `$1\n$2isNew: ${value},`);
    if (next === block) return null;
  } else {
    return null;
  }
  return source.slice(0, start) + next + source.slice(end);
}

export async function setExperimentEnabledOnGitHub(
  id: string,
  enabled: boolean,
): Promise<ToggleResult> {
  return setExperimentFlagOnGitHub(id, "enabled", enabled);
}

export async function setExperimentFlagOnGitHub(
  id: string,
  flag: ExperimentFlag,
  value: boolean,
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

  const updated = setFlagInSource(current, id, flag, value);
  if (updated === null) {
    return { ok: false, error: `Could not find experiment "${id}" in ${EXPERIMENTS_FILE_PATH}.` };
  }
  if (updated === current) {
    return { ok: true, commit: file.sha }; // already in the desired state
  }
  const message =
    flag === "enabled"
      ? `${value ? "Show" : "Hide"} "${id}" for everyone (admin toggle)`
      : `${value ? "Mark" : "Unmark"} "${id}" as new (admin toggle)`;

  const putRes = await fetch(apiBase, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
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
