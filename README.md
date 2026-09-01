ConnectionMiner — Drosophila Visual System Cell-Type Inference
Infers cell types for single-cell RNA-seq data from the adult Drosophila
visual system by jointly fitting expression similarity and connectome
(synaptic connectivity) structure. Many cells only carry a raw cluster ID, not
a known cell type — this pipeline recovers a probability distribution over
741 known visual-system types for every cell, constrained by which types are
even plausible for that cell's cluster and refined against the wiring
diagram (which types should be more/less connected to which).
See `P_CONSTRAINTS_AND_METACELLS.md` for
the exact math behind the two foundational artifacts, `P_constraints_cells`
and the metacell partition.
Pipeline overview
```
data/Adult.h5ad ─┐
                  ├─> build_all_matrices.py ─> output/{P,G,C,B}_matrix*, cell/metacell/type indices
data/visual_*.csv ┘         │
                             ├─> metacells (PCA + K-means within each type-constraint
                             │   signature group, ~15 cells/metacell) -> cell_to_metacell.csv
                             │
data/connections_princeton.csv.gz ─> connectome C (741x741)
                             │
                             v
                 cm_visual/ (ConnectionMiner solver)
                 P (type x metacell) and beta (gene x gene) fit jointly via
                 alternating optimization so that  P @ G @ beta @ G.T @ P.T ≈ C
                             │
                             v
        output/connectionMiner_solve/  (P_refined, beta_learned, C_reconstructed, ...)
                             │
                             v
     downstream rollups: P_x_cluster_matrix (-> raw clusters), M_prime /
     P_x_M_prime (-> individual cells), dashboards, viz
```
`scripts/build_all_matrices.py` — from `Adult.h5ad` + the known type
vocabulary, builds the per-cell soft type-constraint matrix `P_cells`
(`P_matrix.npz`), its binary/transposed solver form
`P_constraints_cells.npz`, the metacell partition (`cell_to_metacell.csv`),
metacell-level aggregates (`G_meta.npy`, `P_meta.npz`,
`P_constraints_metacell.npz`), and the connectome `C_matrix.npz` /
`C_mask.npy` from `connections_princeton.csv.gz`.
`cm_visual/` — the ConnectionMiner solver package. Alternates between:
beta-update: regress the connectome `C` onto
`(P @ G) @ beta @ (P @ G).T` (a gene x gene interaction matrix), and
P-update: an entropic optimal-transport step that refines the
type-assignment matrix `P` subject to the `P_constraints_metacell` mask,
for `num_iter` (default 100) iterations, tracking `obj_beta` /
`obj_P_fit` / `obj_P_ent` per iteration. Runs on the static 5,310-metacell
partition via `scripts/run_solver_static_partition.py` (GPU/Torch backend
when available) so results stay consistent with every other
5,310-metacell artifact in `output/`.
Derived matrices (`scripts/build_p_x_cluster_matrix.py`,
`build_m_prime_metacell_cell_matrix.py`, `build_p_x_m_prime_html*.py`) —
roll the metacell-level `P_refined` back onto raw clusters or individual
cells, and validate against ground-truth labels on named clusters.
Visualization — Plotly dashboards (`cm_visual/viz_plotly.py`,
`output/*.html`) and static heatmaps (`output/*.png`) for every stage:
raw clusters, cell constraints, metacells, inferred types, connectome fit,
loss trajectory.
Directory structure
Path	Contents
`data/`	Raw inputs: `Adult.h5ad` (expression + annotations), `visual_neuron_types.csv.gz` (741-type vocabulary), `connections_princeton.csv.gz` (synaptic connectome), `consolidated_anchor_types.csv` (root-ID -> type mapping), `gene_list/` (transcription factor / cell-adhesion / interactome gene sets)
`cm_visual/`	The solver package: `preprocess.py` (metacells), `solver.py` / `torch_solver.py` (CPU/GPU alternating optimization), `run_visual.py` (pipeline driver), `viz_plotly.py` (visualizations), `config.py` (defaults)
`scripts/`	One-off pipeline / analysis / viz-build scripts, plus their run logs (`*.log`)
`output/`	All generated matrices, CSVs, heatmaps, and dashboards (see below); `output/connectionMiner_solve/` holds the latest solver run's outputs, `output/mix_*_experiment/` and `output/mix_batch*` hold pairwise cell-type "mixing" experiments
`connectome/`	A separate Lovable/React web app (own git repo) for browsing connectome/experiment visualizations — see `connectome/README.md`
`cm_visual/runs/`	Timestamped per-run scratch directories written by `cm_run_visual`
`scratchpad/`	Ad hoc intermediate files (UMAP JSON, crop checks, etc.)
Key matrices (`output/`)
Fixed dimensions throughout: 99,656 cells, 741 known types, 5,310
metacells, 241 raw clusters (MultiomeNN), 3,000 HVGs.
File	Shape	Meaning
`G_matrix.npy`	cells x genes	HVG expression
`P_matrix.npz`	cells x types	soft per-cell type-constraint probabilities
`P_constraints_cells.npz`	types x cells	binary support mask (solver input)
`P_constraints_metacell.npz`	types x metacells	binary support mask, metacell level
`G_meta.npy` / `G_metacell_p.npy`	metacells x genes	metacell-aggregated expression
`P_meta.npz`	metacells x types	soft type-constraint, metacell level
`cluster_metacell_matrix.npz`	clusters x metacells	raw-cluster <-> metacell cell counts (block-diagonal)
`C_matrix.npz` / `C_mask.npy`	types x types	connectome adjacency / observed-entry mask
`B_matrix.npy`	genes x genes	reference gene-gene matrix (not used by the solver)
`connectionMiner_solve/P_refined.npz`	types x metacells	solved type-assignment mass
`connectionMiner_solve/beta_learned.npy`	genes x genes	learned gene-interaction matrix
`connectionMiner_solve/C_reconstructed.npy`	types x types	`P @ G @ beta @ G.T @ P.T`
`M_prime_metacell_cell.npz`	metacells x cells	one-hot metacell membership
`P_x_M_prime_741x99656.npz`	types x cells	`P_refined @ M_prime` — type inference per cell
`P_x_cluster_matrix.csv`	types x clusters	`P_refined @ cluster_metacell_matrix.T` — type inference per raw cluster
Running the pipeline
```bash
# 1. Build core matrices + static metacell partition from raw data
python3 scripts/build_all_matrices.py

# 2. Run the solver on the static 5,310-metacell partition (GPU if available)
python3 scripts/run_solver_static_partition.py --num-iter 100

# 3. Roll the solve back onto raw clusters / individual cells
python3 scripts/build_p_x_cluster_matrix.py
python3 scripts/build_m_prime_metacell_cell_matrix.py
python3 scripts/build_p_x_m_prime_html.py

# 4. Dashboards
python3 scripts/build_full_dashboard.py
```
Validation
`build_p_x_cluster_matrix.py` checks the solve against ground truth: for
every raw cluster with a known majority-vote label, `argmax(P_refined)`
should match that label. Current solve: 74/74 (100%) named clusters
correct. Connectome reconstruction (`C_reconstructed` vs. `C_matrix` on
masked entries) achieves AUC 0.86 separating true synaptic type-pairs
from unconnected ones.
