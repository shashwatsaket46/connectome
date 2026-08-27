import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { slugify, useExperiments, type Experiment } from "@/lib/experiments";

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
        The registry drives the menu. Toggle an experiment off to hide it, edit its metadata, or
        register a brand-new self-contained page by pointing at its URL. Changes are stored in this
        browser.
      </p>

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
              aria-label={`Enable ${e.title}`}
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
