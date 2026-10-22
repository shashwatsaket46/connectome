import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { SEED_EXPERIMENTS, slugify, useExperiments, type Experiment } from "@/lib/experiments";

export const Route = createFileRoute("/manage")({
  head: () => ({
    meta: [
      { title: "Manage experiments — ConnectionMiner Experiment Hub" },
      {
        name: "description",
        content:
          "Register new experiment pages, edit metadata, toggle visibility and reset the ConnectionMiner experiment registry.",
      },
      { property: "og:title", content: "Manage experiments — ConnectionMiner" },
      {
        property: "og:description",
        content: "Configure which experiment microfrontends appear in the hub menu.",
      },
    ],
  }),
  component: ManagePage,
});

const empty = {
  title: "",
  description: "",
  url: "",
  category: "",
};

function ManagePage() {
  const { experiments, toggle, upsert, remove, reset } = useExperiments();
  const [draft, setDraft] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);

  const [adminAuthed, setAdminAuthed] = useState<boolean | null>(null);
  const [globalEnabled, setGlobalEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SEED_EXPERIMENTS.map((s) => [s.id, s.enabled])),
  );
  const [globalNew, setGlobalNew] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SEED_EXPERIMENTS.map((s) => [s.id, !!s.isNew])),
  );
  const [globalBusy, setGlobalBusy] = useState<Record<string, boolean>>({});
  const [globalMsg, setGlobalMsg] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/admin/session")
      .then((res) => res.json())
      .then((data: { authenticated: boolean }) => setAdminAuthed(data.authenticated))
      .catch(() => setAdminAuthed(false));
  }, []);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    setAdminAuthed(false);
  };

  // Commits one registry flag for everyone: `enabled` shows/hides the tile,
  // `isNew` sets the red "new" pill. Busy/error state is keyed by `${id}:${flag}`.
  const toggleGlobal = async (id: string, flag: "enabled" | "isNew", next: boolean) => {
    const key = `${id}:${flag}`;
    setGlobalBusy((b) => ({ ...b, [key]: true }));
    setGlobalMsg((m) => ({ ...m, [key]: "" }));
    try {
      const res = await fetch("/api/admin/toggle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, [flag]: next }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setGlobalMsg((m) => ({ ...m, [key]: data.error || "Failed to update." }));
        return;
      }
      (flag === "enabled" ? setGlobalEnabled : setGlobalNew)((g) => ({ ...g, [id]: next }));
      setGlobalMsg((m) => ({ ...m, [key]: "" }));
    } catch {
      setGlobalMsg((m) => ({ ...m, [key]: "Network error." }));
    } finally {
      setGlobalBusy((b) => ({ ...b, [key]: false }));
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim() || !draft.url.trim()) return;
    const exp: Experiment = {
      id: editing ?? (slugify(draft.title) || `experiment-${Date.now()}`),
      title: draft.title.trim(),
      description: draft.description.trim(),
      url: draft.url.trim(),
      category: draft.category.trim() || "Uncategorised",
      enabled: true,
      custom: true,
    };
    upsert(exp);
    setDraft(empty);
    setEditing(null);
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary">
        Configuration
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Manage experiments</h1>
      <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
        The registry drives the menu. The checkbox on the left of each row hides an experiment just
        for you — it's stored in this browser only. The "everyone" toggle on the right actually
        commits the change to the registry, so it hides or shows the tile for every visitor once the
        site redeploys. The "New" toggle does the same for the red "new" pill in the sidebar. Both
        need an admin login.
      </p>

      <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 text-xs">
        {adminAuthed === null && <span className="text-muted-foreground">Checking admin session…</span>}
        {adminAuthed === false && (
          <>
            <span className="text-muted-foreground">Not logged in as admin.</span>
            <Link to="/login" className="ml-auto font-semibold text-primary hover:underline">
              Log in
            </Link>
          </>
        )}
        {adminAuthed === true && (
          <>
            <span className="font-medium text-foreground">Logged in as admin.</span>
            <button
              onClick={logout}
              className="ml-auto rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary hover:text-foreground"
            >
              Log out
            </button>
          </>
        )}
      </div>

      <form
        onSubmit={submit}
        className="mt-8 grid gap-3 rounded-xl border border-border bg-card p-5 shadow-sm"
      >
        <h2 className="text-sm font-semibold">
          {editing ? `Editing “${editing}”` : "Register a new experiment"}
        </h2>
        <Field
          label="Title"
          value={draft.title}
          onChange={(v) => setDraft({ ...draft, title: v })}
          placeholder="Sparsity sweep — β regularisation"
        />
        <Field
          label="Page URL"
          value={draft.url}
          onChange={(v) => setDraft({ ...draft, url: v })}
          placeholder="https://…/experiments/my-slug/index.html"
        />
        <Field
          label="Category"
          value={draft.category}
          onChange={(v) => setDraft({ ...draft, category: v })}
          placeholder="Recovery Battery"
        />
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Description</span>
          <textarea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            rows={3}
            placeholder="What this experiment shows…"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            {editing ? "Save changes" : "Add experiment"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setDraft(empty);
              }}
              className="rounded-lg border border-border px-4 py-2 text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-8 flex items-center gap-3">
        <h2 className="text-sm font-semibold">Registered experiments</h2>
        <button
          onClick={reset}
          className="ml-auto rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-foreground"
        >
          Reset to defaults
        </button>
      </div>

      <ul className="mt-3 grid gap-3">
        {experiments.map((e) => (
          <li
            key={e.id}
            className="flex flex-wrap items-start gap-3 rounded-xl border border-border bg-card p-4"
          >
            <input
              type="checkbox"
              checked={e.enabled}
              onChange={() => toggle(e.id)}
              className="mt-1 h-4 w-4 accent-[var(--primary)]"
              aria-label={`Enable ${e.title} (this browser)`}
              title="This browser only"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-snug">{e.title}</p>
              <p className="text-xs text-muted-foreground">
                {e.category} · <code>{e.id}</code>
                {e.builtBy ? ` · ${e.builtBy}` : ""}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                {e.description}
              </p>
              {!e.custom && e.id in globalEnabled && (
                <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <AdminSwitch
                    label="Everyone"
                    ariaLabel={`${e.title} visible for everyone`}
                    on={!!globalEnabled[e.id]}
                    busy={!!globalBusy[`${e.id}:enabled`]}
                    msg={globalMsg[`${e.id}:enabled`]}
                    disabled={!adminAuthed}
                    titleOn="Visible for everyone — click to hide"
                    titleOff="Hidden for everyone — click to show"
                    onToggle={() => toggleGlobal(e.id, "enabled", !globalEnabled[e.id])}
                  />
                  <AdminSwitch
                    label="New"
                    ariaLabel={`${e.title} marked as new`}
                    on={!!globalNew[e.id]}
                    busy={!!globalBusy[`${e.id}:isNew`]}
                    msg={globalMsg[`${e.id}:isNew`]}
                    disabled={!adminAuthed}
                    titleOn="Shows the “new” pill — click to remove it"
                    titleOff="No “new” pill — click to add it"
                    onToggle={() => toggleGlobal(e.id, "isNew", !globalNew[e.id])}
                    accent="bg-red-500"
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/experiments/$id"
                params={{ id: e.id }}
                className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-primary"
              >
                Open
              </Link>
              <button
                onClick={() => {
                  setEditing(e.id);
                  setDraft({
                    title: e.title,
                    description: e.description,
                    url: e.url,
                    category: e.category,
                  });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-primary"
              >
                Edit
              </button>
              {e.custom && (
                <button
                  onClick={() => remove(e.id)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-destructive hover:border-destructive"
                >
                  Remove
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AdminSwitch({
  label,
  ariaLabel,
  on,
  busy,
  msg,
  disabled,
  titleOn,
  titleOff,
  onToggle,
  accent = "bg-primary",
}: {
  label: string;
  ariaLabel: string;
  on: boolean;
  busy: boolean;
  msg?: string | undefined;
  disabled: boolean;
  titleOn: string;
  titleOff: string;
  onToggle: () => void;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={ariaLabel}
        disabled={disabled || busy}
        onClick={onToggle}
        title={disabled ? "Log in as admin to change this for everyone" : on ? titleOn : titleOff}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
          on ? accent : "bg-border"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            on ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </button>
      <span className="text-xs text-muted-foreground">{busy ? "Saving…" : label}</span>
      {msg && <span className="text-xs text-destructive">{msg}</span>}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}
