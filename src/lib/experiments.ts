import { useCallback, useEffect, useState } from "react";

import confusionAsset from "@/assets/confusion-matrix-by-family.html.asset.json";
import umapAsset from "@/assets/umap-vs-confusion.html.asset.json";
import recoveryExplainerAsset from "@/assets/recovery-battery-explainer.html.asset.json";
import solverAsset from "@/assets/solver-overview.html.asset.json";
import familyBatteryAsset from "@/assets/family_battery_all_in_one.html.asset.json";
import motorVisualAsset from "@/assets/motor_visual_linked_dashboard.html.asset.json";
import cSplitHeatmapAsset from "@/assets/C_full_visual_split_heatmap.html.asset.json";

export type Experiment = {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  enabled: boolean;
  builtBy?: string;
  custom?: boolean;
};

export const SEED_EXPERIMENTS: Experiment[] = [
  {
    id: "confusion-matrix-by-family",
    title: "Start Here — Interactive Pipeline Walkthrough",
    description:
      "Open this one first. An interactive, click-through (or auto-play) flowchart of the entire ConnectionMiner pipeline — every input, every matrix it builds, what the solver does, every output. C, Ĉ, and β are live Plotly charts (hover any cell/dot for real type or gene names); every node explains what's on the x-axis, the y-axis, and what the pattern is actually telling you.",
    url: confusionAsset.url,
    category: "Pipeline",
    enabled: true,
    builtBy: "scripts/build_experiment_confusion_matrix.py",
  },
  {
    id: "umap-vs-confusion",
    title: "UMAP + Confusion Matrix — per Family",
    description:
      "Same 4 recovery-battery conditions as the confusion-matrix experiment, but each confusion matrix is paired with a t-SNE/UMAP scatter of the underlying cells (green = predicted matches true type, red = mismatch). Hover any point for its predicted vs. true type.",
    url: umapAsset.url,
    category: "Recovery Battery",
    enabled: true,
    builtBy: "scripts/build_umap_confusion_dashboard.py",
  },
  {
    id: "recovery-battery-explainer",
    title: "Recovery Battery — How It Works",
    description:
      "The flowchart for the *other* experiment in this hub — not the regular solver run, but the hide-30%-and-recover stress test. Walks through the 70/30 split, the two solver passes (connectivity-only vs. NC-gated expression), the shuffle-null scoring, and the YES/no/ANTI verdict — with real numbers (e.g. TmY: 10.7% → 94.6% recovery) at every step.",
    url: recoveryExplainerAsset.url,
    category: "Recovery Battery",
    enabled: true,
    builtBy: "scripts/build_experiment_recovery_battery_explainer.py",
  },
  {
    id: "solver-overview",
    title: "UMAP + Matrix Heatmaps — Full Solver Run",
    description:
      "The regular (non-recovery-battery) end-to-end solver run: a UMAP/t-SNE of all 109,743 cells colored by inferred functional subsystem, paired with a tab-switcher for every matrix the solver produces or consumes — C, Ĉ, P (solved), P Constraints, β, G, Gene Correlation (ref), and the loss trajectory — all live, hoverable Plotly charts, each with an axis + interpretation readout. Hovering a UMAP point cross-highlights its type's row/column live on the C and Ĉ tabs.",
    url: solverAsset.url,
    category: "Full Solver Run",
    enabled: true,
    builtBy: "scripts/build_experiment_solver_overview.py",
  },
  {
    id: "family-battery-all-in-one",
    title: "Family Battery — All Complete-Picture Views",
    description:
      "Every family's full 5-condition recovery battery in one self-contained document: Lamina, Lawf, Lamina+Lawf, Dm, Mi, Tm, TmY, T4, T5, C, LC and LPLC. Each view carries its own condition switcher, so the page runs standalone with no dependency on the hub.",
    url: familyBatteryAsset.url,
    category: "Recovery Battery",
    enabled: true,
  },
  {
    id: "motor-visual-linked",
    title: "Motor ↔ Visual — Linked Dashboard",
    description:
      "Cross-subsystem linked view tying motor-side types to visual-system types: selecting on one panel highlights the corresponding rows/columns on the other, so shared connectivity motifs between the two subsystems are directly comparable.",
    url: motorVisualAsset.url,
    category: "Full Solver Run",
    enabled: true,
  },
  {
    id: "c-full-visual-split-heatmap",
    title: "C Matrix — Full vs. Visual Split Heatmap",
    description:
      "The complete connectivity matrix C rendered as a split heatmap: full network on one side, visual-system-only submatrix on the other, at matched color scaling so density differences between the whole brain and the visual subsystem are readable at a glance.",
    url: cSplitHeatmapAsset.url,
    category: "Matrices",
    enabled: true,
  },
];


const STORAGE_KEY = "connectionminer.experiment-registry.v1";

function merge(stored: Experiment[]): Experiment[] {
  const byId = new Map(stored.map((e) => [e.id, e]));
  const seeded = SEED_EXPERIMENTS.map((seed) => {
    const s = byId.get(seed.id);
    byId.delete(seed.id);
    return s ? { ...seed, ...s, url: s.custom ? s.url : seed.url } : seed;
  });
  return [...seeded, ...byId.values()];
}

function read(): Experiment[] {
  if (typeof window === "undefined") return SEED_EXPERIMENTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_EXPERIMENTS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED_EXPERIMENTS;
    return merge(parsed as Experiment[]);
  } catch {
    return SEED_EXPERIMENTS;
  }
}

const listeners = new Set<(v: Experiment[]) => void>();
let cache: Experiment[] | null = null;

function emit(next: Experiment[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota errors */
  }
  listeners.forEach((l) => l(next));
}

export function useExperiments() {
  const [experiments, setExperiments] = useState<Experiment[]>(SEED_EXPERIMENTS);

  useEffect(() => {
    const initial = cache ?? read();
    cache = initial;
    setExperiments(initial);
    const l = (v: Experiment[]) => setExperiments(v);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const update = useCallback((next: Experiment[]) => emit(next), []);

  const toggle = useCallback(
    (id: string) =>
      emit((cache ?? read()).map((e) => (e.id === id ? { ...e, enabled: !e.enabled } : e))),
    [],
  );

  const upsert = useCallback((exp: Experiment) => {
    const list = cache ?? read();
    const exists = list.some((e) => e.id === exp.id);
    emit(exists ? list.map((e) => (e.id === exp.id ? { ...e, ...exp } : e)) : [...list, exp]);
  }, []);

  const remove = useCallback((id: string) => {
    emit((cache ?? read()).filter((e) => e.id !== id));
  }, []);

  const reset = useCallback(() => emit(SEED_EXPERIMENTS), []);

  return { experiments, update, toggle, upsert, remove, reset };
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
