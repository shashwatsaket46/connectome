import { useCallback, useEffect, useState } from "react";

import confusionAsset from "@/assets/confusion-matrix-by-family.html.asset.json";
import umapAsset from "@/assets/umap-vs-confusion.html.asset.json";
import recoveryExplainerAsset from "@/assets/recovery-battery-explainer.html.asset.json";
import familyBatteryAsset from "@/assets/family_battery_all_in_one.html.asset.json";
import motorVisualAsset from "@/assets/motor_visual_linked_dashboard.html.asset.json";
import cSplitHeatmapAsset from "@/assets/C_full_visual_split_heatmap.html.asset.json";
import ablationAsset from "@/assets/ablation_explorer.html.asset.json";
import threePanelAsset from "@/assets/viz_combined_three_panel.html.asset.json";
import rawClustersAsset from "@/assets/viz_01_raw_clusters.html.asset.json";
import cellConstraintsAsset from "@/assets/viz_02_cell_constraints.html.asset.json";
import mixExperimentsAsset from "@/assets/mix_experiments_umap_viewer.html.asset.json";
import metacellSelectorAsset from "@/assets/metacell_selector_viewer.html.asset.json";

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
    enabled: false,
    builtBy: "scripts/build_umap_confusion_dashboard.py",
  },
  {
    id: "recovery-battery-explainer",
    title: "Recovery Battery — How It Works",
    description:
      "The flowchart for the *other* experiment in this hub — not the regular solver run, but the hide-30%-and-recover stress test. Walks through the 70/30 split, the two solver passes (connectivity-only vs. NC-gated expression), the shuffle-null scoring, and the YES/no/ANTI verdict — with real numbers (e.g. TmY: 10.7% → 94.6% recovery) at every step.",
    url: recoveryExplainerAsset.url,
    category: "Recovery Battery",
    enabled: false,
    builtBy: "scripts/build_experiment_recovery_battery_explainer.py",
  },
  {
    id: "linked-explorer-rebalanced-all25",
    title: "Linked Explorer — All 25 Rebalanced Combos",
    description:
      "Same linked UMAP ↔ C ↔ Ĉ ↔ P ↔ P-constraints ↔ G ↔ β interaction as the Linked Connectome Explorer below, now available for all 25 gene-selection × metacell-generation combos from the rebalanced grid (real per-combo metacell counts, 3,780–6,695, instead of the old fixed ~6,650). Each combo gets its own real UMAP refit on that combo's own selected genes. Opens an index sorted by solver loss — click any row for that combo's full explorer.",
    url: "/expt-add/linked_explorer_index.html",
    category: "Full Solver Run",
    enabled: true,
  },
  {
    id: "solver-diagnostics-rebalanced-25combos",
    title: "Solver Diagnostics — Rebalanced 25-Combo Grid",
    description:
      "C, Ĉ, error (Ĉ−C), P, and β for all 25 gene-selection × metacell-generation combinations, after adding production's merge/re-split metacell rebalancing to the experiment harness (metacell counts now range 3,780–6,695 instead of a fixed ~6,650). Pick any combo from the sidebar — grouped and color-coded by gene method — to inspect its matrices and loss trajectory (hover for exact values). Reproduces the headline finding as a live scatter: raw_variance/binomial_deviance_approx keep genes type-specific but fit worse; seurat_vst_approx/trend_residual_approx/dispersion_binned fit better but flatten to near-uniform gene probabilities across types.",
    url: "/expt-add/solver_diagnostics_rebalanced_25combos.html",
    category: "Full Solver Run",
    enabled: true,
  },
  {
    id: "solver-overview",
    title: "UMAP + Matrix Heatmaps — Full Solver Run",
    description:
      "The regular (non-recovery-battery) end-to-end solver run, at full resolution — P and P Constraints across all 5,333 metacells, G across all 3000 genes, no subsampling. A UMAP paired with a tab-switcher for every matrix the solver produces or consumes; hover a UMAP point to highlight its type's row on the active tab, or hover a matrix cell to spotlight that type's cells on the UMAP.",
    url: "/expt-add/solver_run_dashboard_v2.html",
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
    enabled: false,
  },
  {
    id: "motor-visual-linked",
    title: "Motor ↔ Visual — Linked Dashboard",
    description:
      "Cross-subsystem linked view tying motor-side types to visual-system types: selecting on one panel highlights the corresponding rows/columns on the other, so shared connectivity motifs between the two subsystems are directly comparable.",
    url: motorVisualAsset.url,
    category: "Full Solver Run",
    enabled: false,
  },
  {
    id: "c-full-visual-split-heatmap",
    title: "C Matrix — Full vs. Visual Split Heatmap",
    description:
      "The complete connectivity matrix C rendered as a split heatmap: full network on one side, visual-system-only submatrix on the other, at matched color scaling so density differences between the whole brain and the visual subsystem are readable at a glance.",
    url: cSplitHeatmapAsset.url,
    category: "Matrices",
    enabled: false,
  },
  {
    id: "ablation-explorer",
    title: "Ablation Explorer — Gene-Set Ablations",
    description:
      "All 10 gene-set ablations of the solver in one explorer: hvg_3000, hvg_5000, tfs_only, adhesion_only, interactome_only, tfs_adhesion, tfs_interactome, adhesion_interactome, all_three_union and all_three_hvg3000. Each run shows its gene count, matched cells, recovery r and final loss, with a three-panel linked view — hover any cell for its full record.",
    url: ablationAsset.url,
    category: "Ablations",
    enabled: false,
  },
  {
    id: "three-panel-pipeline-overview",
    title: "3-Stage Pipeline Overview — Linked UMAP Panels",
    description:
      "FlyWire visual system × ConnectionMiner in one linked three-panel UMAP view. Pan or zoom any panel and the other two follow on matched axes, so the same cells can be compared across all three pipeline stages side by side. Hover any point for its type.",
    url: threePanelAsset.url,
    category: "Full Solver Run",
    enabled: false,
  },
  {
    id: "raw-multiome-clusters",
    title: "Raw MultiomeNN Clusters on UMAP",
    description:
      "Stage 1 of the pipeline on its own: every cell placed on the UMAP and colored by its raw MultiomeNN cluster, before any connectome constraint is applied. This is the starting point the solver has to work from — hover any point for its cluster.",
    url: rawClustersAsset.url,
    category: "UMAP Views",
    enabled: true,
  },
  {
    id: "cell-type-constraints",
    title: "Cell Type Constraints (P support) on UMAP",
    description:
      "Stage 2: the same UMAP colored by the cell-type constraints the solver's P matrix supports — which connectome types each cell is still allowed to be after the constraint pass. Compare against the raw clusters view to see what the constraints buy you.",
    url: cellConstraintsAsset.url,
    category: "UMAP Views",
    enabled: true,
  },
  {
    id: "mix-experiments-umap",
    title: "Mix Experiments — Actual vs. Predicted UMAP",
    description:
      "Dropdown-driven viewer over the mix experiments: for each run, the UMAP shows actual versus predicted assignment side by side with per-run stats, so agreement and failure regions are readable directly on the embedding.",
    url: mixExperimentsAsset.url,
    category: "UMAP Views",
    enabled: false,
  },
  {
    id: "metacell-selector",
    title: "Metacell Selector",
    description:
      "Pick a metacell from the dropdown and every cell it denotes keeps its true color with a gold ring on top across all three panels at once, while everything else greys out. Split out from the three-panel tool so each does one thing.",
    url: metacellSelectorAsset.url,
    category: "UMAP Views",
    enabled: false,
  },
  {
    id: "metacell-cluster-umap",
    title: "Metacell → Cluster Map",
    description:
      "Every dot is a metacell, positioned at the UMAP centroid of its member cells and colored by its dominant subtype. Hover any metacell to see its raw cluster; pick a raw cluster to spotlight its individual cells alongside the metacells they collapsed into.",
    url: "/expt-add/metacell_cluster_umap.html",
    category: "UMAP Views",
    enabled: true,
  },
  {
    id: "cluster-metacell-matrix",
    title: "Cluster → Metacell Count Matrix",
    description:
      "241 raw clusters × 5,310 metacells, block-diagonal by construction — confirms zero metacells span more than one cluster. Every one of the 5,310 metacells gets its own real column (no representative sampling), labeled m1..m5310, with cell counts labeled inside each block. Scroll to zoom, drag to pan, double-click to reset.",
    url: "/expt-add/cluster_metacell_matrix_full_viewer.html",
    category: "Matrices",
    enabled: true,
  },
  {
    id: "linked-connectome-explorer",
    title: "Linked Connectome Explorer — UMAP ↔ C ↔ Ĉ ↔ P ↔ G",
    description:
      "One shared selection across every matrix the solver touches: click a cell in any panel and its type lights up everywhere else — row/column in C and Ĉ (true vs. reconstructed connectome), the row in G (per-type gene detection), and the row in P (soft per-metacell type assignment). Click a P column, a UMAP point, or pick a metacell from the dropdown, and its exact cells spotlight on the UMAP. Now also includes β (learned gene-gene interaction) as a static reference panel — it has no type/metacell axis, so it isn't linked to the shared selection.",
    url: "/expt-add/linked_connectome_explorer_v2.html",
    category: "Full Solver Run",
    enabled: true,
  },
  {
    id: "type-gene-expression-postsolve",
    title: "P × G — Type-Level Gene Expression (Post-Solve)",
    description:
      "For each of the 741 known cell types, its gene expression profile after the solve: P_refined @ G_metacell_p (741 types × 3,000 genes), types sorted alphabetically, genes sorted by descending variance. Drag to box-zoom into any region, double-click to reset, hover any cell for the exact type/gene/probability.",
    url: "/expt-add/type_gene_expression_heatmap.html",
    category: "Matrices",
    enabled: true,
    builtBy: "scripts/build_type_gene_expression_html.py",
  },
  {
    id: "type-gene-expression-static5310",
    title: "P × G — Type-Level Gene Expression (Static 5,310-Metacell Build)",
    description:
      "Same 741 types × 3,000 genes matrix, but built from the static, un-optimized P_meta prior (row-stochastic per metacell, not solver-refined) instead of P_refined — the 667 orphan-pool types collapse into near-identical rows here since nothing disambiguates them pre-solve. Useful as a baseline comparison against the post-solve version.",
    url: "/expt-add/type_gene_expression_heatmap_static5310.html",
    category: "Matrices",
    enabled: true,
    builtBy: "scripts/build_type_gene_expression_matrix_static5310.py",
  },
  {
    id: "p-x-cluster-matrix",
    title: "P × Mᵀ — Inferred Type Mass on Raw Clusters",
    description:
      "P_refined mapped onto the 241 raw MultiomeNN clusters via the cluster→metacell matrix: for each type, how much of its inferred mass lands in each raw cluster (741 types × 241 clusters). Hover any cell for the type, raw cluster, ground-truth label, and weighted mass.",
    url: "/expt-add/p_x_cluster_matrix_heatmap.html",
    category: "Matrices",
    enabled: true,
  },
  {
    id: "p-x-m-prime",
    title: "P × M′ — Type Mass per Cell",
    description:
      "P_refined expanded down to individual cells rather than metacells (741 types × 99,656 cells) — each cell inherits its metacell's soft type distribution.",
    url: "/expt-add/p_x_m_prime_heatmap.html",
    category: "Matrices",
    enabled: true,
  },
  {
    id: "p-x-m-prime-proportional",
    title: "P × M′ — Proportional-Width Cell View",
    description:
      "Same per-cell P × M′ matrix, column-normalized and drawn with cell columns width-proportional to their metacell (55,749 cells in named metacells | 43,907 non-named), so metacell size is visible directly in the layout.",
    url: "/expt-add/p_x_m_prime_heatmap_proportional.html",
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
