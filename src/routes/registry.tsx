import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { useExperiments } from "@/lib/experiments";

export const Route = createFileRoute("/registry")({
  head: () => ({
    meta: [
      { title: "Experiment Registry — ConnectionMiner Hub" },
      {
        name: "description",
        content:
          "Search and filter every self-contained ConnectionMiner experiment dashboard: confusion matrices, UMAP scatters, recovery batteries and full solver runs.",
      },
      { property: "og:title", content: "Experiment Registry — ConnectionMiner Hub" },
      {
        property: "og:description",
        content: "A configurable, menu-driven registry of independently deployable dashboards.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Registry,
});

function Registry() {
  const { experiments } = useExperiments();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const enabled = experiments.filter((e) => e.enabled);
  const categories = useMemo(
    () => Array.from(new Set(enabled.map((e) => e.category))),
    [enabled],
  );

  const visible = enabled.filter((e) => {
    const q = query.toLowerCase().trim();
    const matchesQuery =
      !q || e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q);
    return matchesQuery && (!category || e.category === category);
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary">
        Registry
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">All experiments</h1>
      <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
        Every tile is an independent, self-contained experiment page loaded into this shell as its
        own microfrontend. Register a new one — hosted anywhere — from the Manage panel and it
        appears in the menu without touching any existing page.
      </p>

      <div className="mt-7 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search experiments…"
          className="min-w-[200px] flex-1 rounded-lg border border-border bg-card/80 px-3 py-2 text-sm outline-none backdrop-blur-sm focus:border-primary"
        />
        <Chip active={category === null} onClick={() => setCategory(null)}>
          All
        </Chip>
        {categories.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
            {c}
          </Chip>
        ))}
        <Link
          to="/manage"
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm hover:border-primary"
        >
          Manage experiments
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {visible.map((e) => (
          <Link
            key={e.id}
            to="/experiments/$id"
            params={{ id: e.id }}
            className="group flex flex-col gap-2 rounded-xl border border-border bg-card/80 p-5 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary"
          >
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-primary">
              {e.category}
            </span>
            <h2 className="text-base font-semibold leading-snug">{e.title}</h2>
            <p className="flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-5">
              {e.description}
            </p>
            <span className="text-sm font-semibold text-primary">Open experiment →</span>
          </Link>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No experiments match — adjust the search or enable more in Manage experiments.
        </p>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
        active
          ? "border-primary bg-accent text-primary"
          : "border-transparent bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
