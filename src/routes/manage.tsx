import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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

  const toggleGlobal = async (id: string, nextEnabled: boolean) => {
    setGlobalBusy((b) => ({ ...b, [id]: true }));
    setGlobalMsg((m) => ({ ...m, [id]: "" }));
    try {
      const res = await fetch("/api/admin/toggle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, enabled: nextEnabled }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setGlobalMsg((m) => ({ ...m, [id]: data.error || "Failed to update." }));
        return;
      }
      setGlobalEnabled((g) => ({ ...g, [id]: nextEnabled }));
      setGlobalMsg((m) => ({ ...m, [id]: "" }));
    } catch {
      setGlobalMsg((m) => ({ ...m, [id]: "Network error." }));
    } finally {
      setGlobalBusy((b) => ({ ...b, [id]: false }));
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
        site redeploys; that one needs an admin login.
      </p>

      <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 text-xs">
        {adminAuthed === null && <span className="text-muted-foreground">Checking admin session…</span>}
        {adminAuthed === false && (
          <>
            <span className="text-muted-foreground">Not logged in as admin.</span>
            <Link to="/login" className={buttonVariants({ size: "sm", variant: "outline" }) + " ml-auto"}>
              Log in
            </Link>
          </>
        )}
        {adminAuthed === true && (
          <>
            <span className="font-medium text-foreground">Logged in as admin.</span>
            <Button size="sm" variant="outline" className="ml-auto" onClick={logout}>
              Log out
            </Button>
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
                <div className="mt-2 flex items-center gap-2">
                  <Switch
                    checked={globalEnabled[e.id]}
                    onCheckedChange={(checked) => toggleGlobal(e.id, checked)}
                    disabled={!adminAuthed || globalBusy[e.id]}
                    aria-label={`${e.title} visible for everyone`}
                    title={
                      adminAuthed
                        ? globalEnabled[e.id]
                          ? "Visible for everyone — click to hide"
                          : "Hidden for everyone — click to show"
                        : "Log in as admin to change this for everyone"
                    }
                  />
                  <span className="text-xs text-muted-foreground">
                    {globalBusy[e.id] ? "Saving…" : "Everyone"}
                  </span>
                  {globalMsg[e.id] && (
                    <span className="text-xs text-destructive">{globalMsg[e.id]}</span>
                  )}
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
