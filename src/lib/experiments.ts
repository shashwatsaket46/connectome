import { useCallback, useEffect, useState } from "react";


export type Experiment = {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  enabled: boolean;
  builtBy?: string;
  custom?: boolean;
  // Shows the red "new" pill next to the entry in the sidebar.
  isNew?: boolean;
};

export const SEED_EXPERIMENTS: Experiment[] = [
  {
    id: "morphology-motor",
    title: "Morphology — Motor",
    description:
      "3D viewer of the motor connectome's skeletons: 707 of the 730 C-matrix types have a local skeleton (the rest are absent from the cm730 bundle), 127,839 nodes after twig pruning and contraction. Orbit, zoom and pan; colour by population, side, depth or neuron; filter by side. Depth fog fades far branches toward the background and an optional slow spin adds parallax, so near and far arbors read apart.",
    url: "/expt-add/morphology_motor.html",
    category: "Morphology",
    enabled: true,
    isNew: false,
    builtBy: "cm_motor/scripts/build_morphology_viewer.py",
  },
  {
    id: "morphology-visual",
    title: "Morphology — Visual",
    description:
      "3D viewer of FlyWire visual-system skeletons: a stratified sample of one neuron per type per side across all 741 types (1,399 skeletons, 326,698 nodes), drawn from 95,079 reconstructions. Sampling is by side so both optic lobes appear. Colour by subsystem, side, depth or neuron; depth fog and an optional slow spin make the 3D structure readable.",
    url: "/expt-add/morphology_visual.html",
    category: "Morphology",
    enabled: true,
    isNew: false,
    builtBy: "cm_motor/scripts/build_visual_morphology_viewer.py",
  },
  {
    id: "morphology-cx",
    title: "Morphology — Central Complex",
    description:
      "3D viewer of every CX-class neuron in the T2 central-complex model: 2,102 FlyWire reconstructions over 116 types (407,108 nodes after twig pruning and contraction), none sampled out, so the columnar tiling of the protocerebral bridge, fan-shaped body and ellipsoid body is complete. Colour by CX group (EB columnar, ring, PB-FB columnar, h\u0394, v\u0394, FB columnar, FB tangential), side, depth or neuron; click a group to hide it.",
    url: "/expt-add/morphology_cx.html",
    category: "Morphology",
    enabled: true,
    isNew: false,
    builtBy: "cm_central_complex/scripts/build_cx_morphology_viewer.py",
  },
  {
    id: "connectivity-gene-pairs",
    title: "Connectivity Gene Pairs",
    description:
      "Which gene pairs carry the predicted connection between two cell types. Ĉ[pre, post] is split exactly into Σ E[pre, g] · β[g, h] · E[post, h] over each of the 50 train solves (10 folds × 5 seeds) for Visual, Central complex, Motor and Motor seurat 2000. Pick a type pair to see its ranked gene pairs, how often each lands in a solve's top 10, and the pre- and post-side genes; pick a gene to see the type pairs it drives; or pick a neuron (By neuron) to see the genes behind all its outputs or inputs, weighted by synapse count, with a radial partner map. For the central complex (FlyWire synapse locations) and visual datasets a neuropil filter restricts that view to the synapses in one neuropil (e.g. FB, EB, PB, NO; ME, LO, LOP), so you can see which gene pairs carry a type's connections in each neuropil. For the visual and motor datasets, each gene's P·G in the chosen types is plotted over development (Özel P15–Adult, Zipursky Early–Adult, motor tp0–tp3) on a log axis, with genes outside a stage's fitted set projected from that stage's solved P.",
    url: "/expt-add/pairgenes/index.html",
    category: "Gene Pairs",
    enabled: true,
    isNew: true,
    builtBy: "pairgenes/export_pairgenes.py, pairgenes/gene_figures.py, pairgenes/time_export.py",
  },
  {
    id: "synaptic-gene-partners",
    title: "Synaptic Gene Partners",
    description:
      "Pick any set of cell types in the adult visual (no filter), motor (tp3) or central-complex (best) connectome and see their strongest partners, with each real edge drawn as its top 1–6 synaptic gene pairs (pre-type gene → post-type gene). Genes are each type's most type-specific cell-surface/synaptic genes (dpr/DIP, beat/side, kek, klg, hig, Net, Sema/Plex, Ten, Dscam, Nrx/Nlg and others) by P·G, the mean over the 50 train solves of the best model projected onto every atlas gene; pairs are ranked by the product of the two types' P·G. This is a read-out of the solved cell→type assignment, not fitted β pairs. Choose genes per type, partners per type and edge direction; click nodes to add or remove them, drag to arrange.",
    url: "/expt-add/synnet/index.html",
    category: "Gene Pairs",
    enabled: true,
    isNew: true,
    builtBy: "synnet/build_synnet.py",
  },
  {
    id: "fig3-pair-browser",
    title: "Fig 3 Pair Browser",
    description:
      "Choose the cell-type pair for Fig 3. Pick any two cell types in the visual (adult), central-complex (best) or motor (tp3) model and see the genes that separate them: a ranked dumbbell list of the largest expression differences (filter by TF, CAM, neuropeptide or interactome genes, minimum expression, housekeeping), all genes A vs B, the two types' EM neurons coloured by type or by a selected gene, and that gene across every cell type. Expression = predicted fraction of a type's cells expressing the gene, mean of the 50 solves, every atlas gene. The candidate list ranks sister pairs (shared specific candidate cells, both wired, both with a skeleton) by largest difference.",
    url: "/expt-add/fig3-candidates/index.html",
    category: "Gene Pairs",
    enabled: true,
    isNew: true,
    builtBy: "biorender_fig/fig3/fig3_pair_candidates_v6.py, biorender_fig/fig3/export_web_v6.py",
  },
  {
    id: "pg-solve-explorer",
    title: "P·G Solve Explorer",
    description:
      "The type × gene matrix P·G (solved P times metacell detection rate) over the real solves, 10 folds × 5 seeds per type, for 41 datasets: adult and developing visual (Özel P15–P70, Zipursky Early–P96), motor tp0–tp3 and the central complex, with and without the gene filter, plus all-gene versions where each solve's P is projected onto every atlas gene: Adult (12,028), motor tp0\u2013tp3 (11,547) and the three central-complex configs (21,771). Drag a box or click a type; the matrix, cell UMAP and per-solve calls stay linked. Tabs add the consensus β, the gene-filter test, anatomy fitted on neurons, and the motor and central-complex gene-set experiments.",
    url: "/expt-add/pg-explorer/index.html",
    category: "Gene Pairs",
    enabled: true,
    isNew: false,
    builtBy: "pbnull/pg_consensus.py, pbnull/dash_export.py, pbnull/pg_allgenes.py, pbnull/dash2_export.py",
  },
  {
    id: "pupal-vnc-explorer",
    title: "Pupal VNC Explorer",
    description:
      "302,765 pupal VNC neurons (6, 24, 36, 48 h APF; VNC.neurons.loom) on the authors' two UMAPs: integrated, and all-ages where stages stay apart. Zoom and pan; colour by hemilineage, stage, transmitter, neuromere, birthtime, sex or sample, by any of 2,913 genes (preMN/MN HVGs, Interactome v3, markers, top HVGs) or by two genes at once; click legend items to filter, split into per-stage panels, lasso a region to see what it holds. Other tabs: annotation cross-tabs, dot plots and heatmaps for any of the 21,050 genes across hemilineages, transmitters and stages, a gene's course from 6 to 48 h per hemilineage, per-cell violins, and marker genes per group.",
    url: "/expt-add/pupal-vnc/index.html",
    category: "UMAP Views",
    enabled: true,
    isNew: true,
    builtBy: "conn_data/pupal_vnc_umap/prep_web_data.py",
  },
  {
    id: "pupal-vnc-paper-figures",
    title: "Pupal VNC — Paper Figures",
    description:
      "Main figures 1–5 of Cachero et al., Nature 2026 (global molecular code for birth order) rebuilt from VNC.neurons.loom and the authors' metadata: stage and birth-time UMAPs, hemilineage and segment calls, Hox, pseudotime trajectories, shared-TF peaks, sex-enriched neighbourhoods (miloR) and sex-regression scores. Connectome and imaging panels are left out.",
    url: "/expt-add/pupal-vnc/paper.html",
    category: "UMAP Views",
    enabled: true,
    isNew: true,
    builtBy: "conn_data/pupal_vnc_umap/paper_analysis.py, milo_48h.R, paper_post.py",
  },
  {
    id: "visual-explorer",
    title: "Visual (Optic Lobe) Explorer",
    description:
      "Optic-lobe neurons at P15, P30, P50, P70 and Adult (devstages h5ad files), each stage on its own stored tSNE, split side by side. Colour by cell type, cluster, metacluster, temporal/spatial origin, Notch status or sample, or by gene; follow any gene from P15 to Adult per cell type. Cross-tabs, dot plots, violins and markers.",
    url: "/expt-add/visual-explorer/index.html",
    category: "UMAP Views",
    enabled: true,
    isNew: true,
    builtBy: "conn_data/explorers/prep_explorer.py visual_dev",
  },
  {
    id: "visual-zipursky-explorer",
    title: "Visual · Zipursky Time Course",
    description:
      "Zipursky lab optic-lobe time course, 0 h to 96 h APF (W1118 and DGRP), each time point on its stored tSNE. Colour by multiome cell type, the authors' type/subtype and class, line or gene; follow any gene across time per cell type. Cross-tabs, dot plots, violins and markers.",
    url: "/expt-add/visual-zipursky-explorer/index.html",
    category: "UMAP Views",
    enabled: true,
    isNew: true,
    builtBy: "conn_data/explorers/prep_explorer.py zipursky",
  },
  {
    id: "motor-premn-explorer",
    title: "Motor · PreMN Explorer",
    description:
      "16,383 premotor neurons (counts_cg_corrected.txt, 120 transcriptional clusters) on the authors' tSNE and a UMAP computed here. Colour by cluster, replicate, sex or gene; cross-tabs, dot plots for all genes, violins and markers.",
    url: "/expt-add/motor-premn-explorer/index.html",
    category: "UMAP Views",
    enabled: true,
    isNew: true,
    builtBy: "conn_data/explorers/prep_explorer.py motor_premn",
  },
  {
    id: "motor-mn-explorer",
    title: "Motor · MN Explorer",
    description:
      "Leg motor neurons across 4 timepoints (2,709 cells each, 19 clusters) on the authors' per-timepoint UMAP. Split by timepoint, colour by cluster or gene, and follow any gene across timepoints per cluster.",
    url: "/expt-add/motor-mn-explorer/index.html",
    category: "UMAP Views",
    enabled: true,
    isNew: true,
    builtBy: "conn_data/explorers/prep_explorer.py motor_mn",
  },
  {
    id: "cx-explorer",
    title: "Central Complex (T2) Explorer",
    description:
      "50,148 T2-lineage neurons (T2.atlas.neurons, 161 clusters) on the authors' rpca UMAP. Colour by cluster, FlyWire / hemibrain type, sample, method or gene; cross-tabs, dot plots for all 21,771 genes, violins and markers.",
    url: "/expt-add/cx-explorer/index.html",
    category: "UMAP Views",
    enabled: true,
    isNew: true,
    builtBy: "conn_data/explorers/prep_explorer.py cx",
  },
  {
    id: "cx-best-g5-h2000-train-test",
    title: "Central Complex — Best Solve (g5 h2000, train | test)",
    description:
      "The central-complex winner of the nested split, chosen on validation before test was touched: gene set 5 (dispersion-binned with batch), 2,000 HVGs, batch-normalised, constrained k-means metacells. Of 100 configs it had the best validation r (0.792); it was then refit on train (681 types, r 0.648) and scored once on the 172 held-out test types with \u03b2 frozen: r 0.635, AUC 0.876 (degree-only baseline 0.862). The pre-specified reference config (g3 h3000) reaches test r 0.577. 853 types in all (116 CX-class), TRAIN and TEST panels side by side: C, Chat, P, P constraints, G, \u03b2, P x G. Click the r 0.792 point in the run scatter to open the same config's FIT | VAL page, the validation solve that selected it.",
    url: "/expt-add/cx_best_g5_h2000_bn1_train_test.html",
    category: "Full Solver Run",
    enabled: true,
    isNew: false,
    builtBy: "cm_central_complex/scripts/build_cx_grid_workbench.py",
  },
  {
    id: "replication-visual-disp2000-s0",
    title: "Replication — Visual disp h2000 seed 0",
    description:
      "The grid\u2019s rank-1 visual variant (3_dispersion_binned, h=2000, uniform init, seed 0) re-run end to end from a clean clone. Train r 0.6509 against the original 0.6590, but test r fell to 0.6044 from 0.6503 \u2014 a drop of 0.046, beyond the ~0.03 this codebase attributes to cuBLAS reduction order. The G-metacell null for the same variant is reported alongside. Rebuilt with the workbench dashboard (scripts/build_solver_tabs_dashboard.py), the same builder behind the site\u2019s own visual pages \u2014 14 matrix panels over 4 runs, the cell atlas, and 1,591 FlyWire skeletons (1,122 train / 469 test).",
    url: "/expt-add/replication_visual_disp2000_s0.html",
    category: "Full Solver Run",
    enabled: true,
    builtBy: "scripts/build_solver_tabs_dashboard.py",
  },
  {
    id: "replication-visual-disp2000-s1",
    title: "Replication — Visual disp h2000 seed 1",
    description:
      "The rank-2 visual variant (seed 1), same protocol. This one reproduces closely \u2014 train r 0.6622 vs 0.6599, test r 0.6266 vs 0.6245, both within \u00b10.002. Read with seed 0: the original rank-1/rank-2 margin on d_test was 0.005 while seed 0 moved by 0.046 on re-run, so the two are tied at the run-to-run noise level and the published ordering does not reproduce. The G-metacell null for the same variant is reported alongside. Rebuilt with the workbench dashboard (scripts/build_solver_tabs_dashboard.py), the same builder behind the site\u2019s own visual pages \u2014 14 matrix panels over 4 runs, the cell atlas, and 1,591 FlyWire skeletons (1,122 train / 469 test).",
    url: "/expt-add/replication_visual_disp2000_s1.html",
    category: "Full Solver Run",
    enabled: true,
    builtBy: "scripts/build_solver_tabs_dashboard.py",
  },
  {
    id: "replication-motor-seurat2000-s0",
    title: "Replication — Motor seurat h2000 seed 0",
    description:
      "Motor's top-2 variant (2_seurat_vst, h=2000, uniform init, seed 0) re-run from a clean clone: train, test and the G-metacell null, 14 matrix panels over 4 runs. Both real numbers reproduce bit-exactly against the original \u2014 train r 0.723821420 and test r 0.435808603, to machine precision. The null arm is the substantive result: on train it is indistinguishable from the real fit (0.713 vs 0.724), so the train block's fit does not rest on G's metacell axis; the test gap of 0.068 is where the signal actually lives.",
    url: "/expt-add/replication_motor_seurat2000_s0.html",
    category: "Full Solver Run",
    enabled: true,
    builtBy: "scripts/build_solver_tabs_dashboard.py",
  },
  {
    id: "replication-motor-seurat2000-s1",
    title: "Replication — Motor seurat h2000 seed 1",
    description:
      "The other motor top-2 variant (2_seurat_vst, h=2000, uniform init, seed 1), same protocol: train, test and G-metacell null, 14 matrix panels over 4 runs. Reproduces bit-exactly \u2014 train r 0.723264675, test r 0.438981261. Here the train-side null scores slightly ABOVE the real fit (0.725 vs 0.723), which is the cleanest statement of the same point: permuting which metacell carries which transcriptome costs nothing on train. The test gap is 0.095.",
    url: "/expt-add/replication_motor_seurat2000_s1.html",
    category: "Full Solver Run",
    enabled: true,
    builtBy: "scripts/build_solver_tabs_dashboard.py",
  },
  {
    id: "type-split-atlas-seurat-vst",
    title: "Connectome Atlas — Type Split (seurat_vst)",
    description:
      "All three blocks of the type-level 80/20 split of C on one page, with the FlyWire morphology behind every type. Switch between the held-out block (148 types, \u03b2 frozen — every connection shown was predicted without the model seeing the block, r +0.588), the training block \u03b2 was fitted on (593 types, r +0.670), and the whole 741-type catalogue solved in one piece on the same gene set (r +0.699). Hover the C matrix for a pair, or pick a type to light up its neurons in 3D along with its connectome partners. Test and train share no type and the catalogue is their union, so all three blocks are contiguous slices of a single shared skeleton pool in one global frame.",
    url: "/expt-add/type_split_atlas_seurat_vst.html",
    category: "Full Solver Run",
    enabled: true,
    builtBy: "type_split_study/build_combined_viewer.py",
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
    id: "wiring-vs-distance",
    title: "Wiring vs. Distance — C, Soma & Neurite Matrices",
    description:
      "Three independent 741×741 matrices, same alphabetical type order on all axes so a row/column lines up across panels: C is the binary synaptic connectome (does type i synapse onto type j, both hemispheres pooled); d(soma) is the mean soma-to-soma Euclidean distance between every cell of type i and every cell of type j; d(neurite) is the true closest-approach distance instead — the minimum distance between any point on any neurite of type i and any point on any neurite of type j, using each cell's full traced SWC skeleton (95,079 skeletons) rather than just its cell body, so it reflects how close the actual axon/dendrite arbors get. Scroll or drag to zoom on any heatmap — full cell-type labels fill in as you get closer — or use the jump-to-type search box to zoom all three panels to the same neighborhood at once.",
    url: "/expt-add/wiring_vs_distance_heatmap.html",
    category: "Matrices",
    enabled: true,
  },
  {
    id: "metacell-size-histograms-25combos",
    title: "Metacell Size Distributions — All 25 Combos",
    description:
      "Cells-per-metacell histogram for every gene-selection × metacell-generation combination in the rebalanced grid (real production merge/re-split logic, not a fixed target size). Metacell counts range 3,780–6,695 across combos — this shows the actual shape of that variation: most metacells are small (long right tail), and the tail's heaviness differs a lot by method — graph_ward_supercell and agglomerative_ward_full both show a sharp spike of very small metacells the other three methods don't. Dashed line marks the mean size per combo.",
    url: "/expt-add/metacell_size_histograms.html",
    category: "Matrices",
    enabled: true,
  },
  {
    id: "physical-terms-vs-gene-model",
    title: "Physical Terms vs. Gene Model",
    description:
      "Tests whether extending the reconstruction formula (Chat = b0·gene_term + b2/d_soma + b3/d_neurite + b4·overlap_volume) with physical/spatial terms improves the fit to the true connectome C beyond the existing gene-expression model, across all 25 combos, with weights fit via non-negative-constrained least squares. Finding: b2 and b3 are zero in 25/25 combos, b4 is negligible in the 4/25 where it's nonzero — the gene-based reconstruction already correlates with neurite distance and overlap volume at r≈0.31–0.37 in every combo (gene-compatible types tend to be anatomically co-located), so it implicitly re-derives most of the physical proximity signal on its own.",
    url: "/expt-add/physical_terms_analysis.html",
    category: "Matrices",
    enabled: true,
  },
];


const STORAGE_KEY = "connectionminer.experiment-registry.v1";

// Pages whose bundles were dropped (public/ trim for Vercel, dead Lovable asset links); hide them even if saved locally.
const REMOVED_IDS = new Set(["confusion-matrix-by-family", "umap-vs-confusion", "recovery-battery-explainer", "linked-explorer-rebalanced-all25", "solver-diagnostics-rebalanced-25combos", "solver-overview", "family-battery-all-in-one", "motor-visual-linked", "c-full-visual-split-heatmap", "ablation-explorer", "three-panel-pipeline-overview", "raw-multiome-clusters", "cell-type-constraints", "mix-experiments-umap", "metacell-selector", "linked-connectome-explorer", "type-gene-expression-postsolve", "type-gene-expression-static5310", "p-x-cluster-matrix", "p-x-m-prime", "p-x-m-prime-proportional"]);

function merge(stored: Experiment[]): Experiment[] {
  const byId = new Map(stored.filter((e) => !REMOVED_IDS.has(e.id)).map((e) => [e.id, e]));
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
