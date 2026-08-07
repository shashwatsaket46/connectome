import { createFileRoute, Link } from "@tanstack/react-router";

import { ConnectomeMap } from "@/components/ConnectomeMap";
import { useExperiments } from "@/lib/experiments";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ConnectionMiner — Interactive Fly Connectome Explorer" },
      {
        name: "description",
        content:
          "Click straight into the Drosophila connectome: an interactive brain map wired to live machine-learning experiments — UMAP embeddings, confusion matrices and full solver runs.",
      },
      { property: "og:title", content: "ConnectionMiner — Fly Connectome Explorer" },
      {
        property: "og:description",
        content:
          "An interactive fly-brain map where every node opens a live neuro + machine-learning experiment dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Start,
});

function Start() {
  const { experiments } = useExperiments();
  const enabled = experiments.filter((e) => e.enabled);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary">
            ConnectionMiner · Drosophila connectomics
          </p>
          <h1 className="mt-2 max-w-[22ch] text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            Click the brain. <span className="bg-gradient-to-r from-violet-600 via-cyan-600 to-rose-500 bg-clip-text text-transparent">Open the experiment.</span>
          </h1>
          <p className="mt-4 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
            139,255 neurons, 50M+ synapses, and a solver that infers cell type from wiring alone.
            Every glowing probe on the map below is an independent, self-contained dashboard —
            UMAP embeddings, confusion matrices, recovery batteries and full solver runs.
          </p>

        </div>
        <div className="flex gap-2">
          <Link
            to="/registry"
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            Browse all experiments
          </Link>
          <Link
            to="/manage"
            className="rounded-lg border border-border bg-card/80 px-4 py-2.5 text-sm backdrop-blur-sm hover:border-primary"
          >
            Manage
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <ConnectomeMap experiments={enabled} />
      </div>

      <h2 className="mt-12 text-lg font-semibold tracking-tight">Jump straight in</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {enabled.slice(0, 3).map((e) => (
          <Link
            key={e.id}
            to="/experiments/$id"
            params={{ id: e.id }}
            className="group rounded-xl border border-border bg-card/80 p-5 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary"
          >
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-primary">
              {e.category}
            </span>
            <h3 className="mt-2 text-sm font-semibold leading-snug">{e.title}</h3>
            <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
              {e.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
