<h1 align="center">ConnectionMiner</h1>

<p align="center">
  <img src="public/readme/hub-screenshot.png" alt="ConnectionMiner experiment dashboard — inferred cell-type UMAP next to the live connectome heatmap" width="900">
</p>

<h3 align="center">
  Connectome-informed cell-type inference in the <i>Drosophila</i> visual system
</h3>
<p align="center">
  <b>Gene expression × synaptic wiring → cell-type identity</b>
</p>

<p align="center">
  <a href="#overview">Overview</a> ·
  <a href="#the-problem">The Problem</a> ·
  <a href="#the-connectionminer-idea">The Idea</a> ·
  <a href="#joint-inference">Joint Inference</a> ·
  <a href="#why-metacells">Metacells</a> ·
  <a href="#validation">Validation</a> ·
  <a href="#interactive-exploration">Explorer</a> ·
  <a href="#key-results">Results</a>
</p>

---

## Overview

ConnectionMiner is a computational framework for inferring neuronal cell
types in the *Drosophila melanogaster* visual system by combining
single-cell gene expression with synaptic connectivity.

Modern transcriptomic atlases can profile roughly 100,000 cells and organize
them into hundreds of expression-based clusters. However, an expression
cluster is not necessarily a biologically resolved cell type — closely
related neurons can have highly similar transcriptional profiles while
occupying very different positions in the neural circuit.

Connectomics provides an independent source of information. A neuron is not
only defined by the genes it expresses — its identity is also reflected in
which neurons it connects to and receives connections from. ConnectionMiner
uses this complementary information to resolve cell-type identity.

> **The central idea:** a cell should be compatible with its cell type both
> molecularly and structurally.

## The Problem

Single-cell RNA sequencing provides a high-dimensional molecular description
of each neuron:

```text
Cell
 │
 ├── Gene 1
 ├── Gene 2
 ├── Gene 3
 ├── ...
 └── Gene N
```

Unsupervised clustering can then organize cells into transcriptomic
neighborhoods. However, this creates an important limitation — two
biologically distinct cell types can occupy nearly the same region of
expression space:

```text
Expression space

       Type A
      ● ● ●
    ● ● ● ●

          ● ●
        ● ● ●
        Type B
```

This means that:

```text
Gene expression → Expression cluster → Possible cell types → ?
```

is sometimes insufficient to determine the true identity of a neuron.

### The connectome provides another view

A connectome represents the wiring diagram of a nervous system. For every
neuron, it can describe:

- presynaptic partners
- postsynaptic partners
- synaptic connections and connection strengths
- circuit neighborhoods and higher-order network structure

In the *Drosophila* visual system, neurons form highly structured circuits
across regions such as the retina, lamina, medulla, lobula, and lobula
plate — giving a second description of neuronal identity:

```text
Gene expression  →  Molecular identity
Synaptic wiring  →  Circuit identity
```

ConnectionMiner combines both.

## The ConnectionMiner Idea

Suppose a cell could plausibly belong to either Type A or Type B based on
gene expression — expression alone might not be able to distinguish them.
But suppose:

```text
Type A ───────► X          Type B ───────► P
       └──────► Y                 └──────► Q
       └──────► Z                 └──────► R
```

and the cell's observed connectivity strongly resembles Type A. Then the
connectome provides evidence favoring Type A. ConnectionMiner formalizes
this intuition.

> **A good cell-type assignment should explain both what the cell looks
> like and how the cell is wired.**

## Joint Inference

ConnectionMiner treats cell-type identification as a joint optimization
problem. The model simultaneously considers:

- transcriptomic compatibility
- cell-type constraints
- synaptic connectivity
- a learned gene-interaction structure

The goal is to find a soft assignment of cells to known cell types that
produces a connectivity structure consistent with the observed connectome:

```text
   Single-cell RNA-seq
             │
             ▼
     Expression space
             │
             ▼
  Possible cell-type set
             │
             ▼
        Metacells
             │
             ▼
┌────────────────────────┐
│    ConnectionMiner     │
│  Expression + Wiring   │
└────────────────────────┘
             │
             ▼
 Cell-type probabilities
             │
             ▼
  Predicted connectivity
             │
             ▼
Compare with real connectome
```

### Soft cell-type assignments

ConnectionMiner does not require every cell to be assigned immediately to a
single type. Instead, each cell receives a probability distribution over
the known cell types, e.g.:

| Cell type | Probability |
|---|---|
| Type A | 0.72 |
| Type B | 0.21 |
| Type C | 0.05 |
| Other | 0.02 |

This representation preserves uncertainty and allows closely related cell
types to remain distinguishable until enough evidence is available. For
$N$ cells and $K$ known cell types, the assignment matrix is:

$$P \in \mathbb{R}^{N \times K}$$

where $P_{ik}$ is the probability that cell $i$ belongs to cell type $k$,
subject to:

$$P_{ik} \geq 0 \qquad \text{and} \qquad \sum_{k} P_{ik} = 1$$

For ConnectionMiner, **K = 741** known visual-system cell types are
considered as candidate identities.

### Expression-based constraints

The connectome should provide additional information, not override
everything already known from transcriptomics. ConnectionMiner therefore
imposes expression-derived constraints: a cell is only allowed to receive
probability mass from cell types that are compatible with its expression
neighborhood.

```text
Transcriptomic neighborhood
             │
             ▼
      Candidate cell types
             │
       ┌─────┴─────┐
       │           │
     allowed    forbidden
       │           │
       ▼           ✕
  ConnectionMiner
```

This prevents the connectivity optimization from assigning a cell to a
biologically implausible type simply because that assignment happens to
improve the connectivity objective. The detailed construction of these
constraints and the metacell procedure is described in
[`P_CONSTRAINTS_AND_METACELLS.md`](P_CONSTRAINTS_AND_METACELLS.md).

<p align="center">
  <img src="public/readme/diagram-p-constraints.png" alt="How the per-cell type-constraint matrix P_constraints_cells is built" width="700">
</p>

## Alternating Optimization

ConnectionMiner learns two interacting components:

- **Cell-type assignment** $P$ — the probability that each cell or
  metacell belongs to each known cell type.
- **Gene-interaction structure** $M$ — how gene-expression information
  contributes to the predicted connectivity structure.

The optimization alternates between them:

**Step 1 — fix the cell-type assignments.** Given $P$, estimate the
gene-interaction structure that best explains the observed connectome.

```text
Cell-type assignments → Learn interaction M → Predicted connectivity
```

**Step 2 — fix the interaction structure.** Given $M$, refine the
cell-type assignments so the predicted connectivity better agrees with the
real connectome while respecting the expression constraints.

```text
Interaction structure → Refine P → Better cell-type assignments
```

These steps repeat until the solution converges:

```text
   Initial P
      │
      ▼
Learn interaction M
      │
      ▼
Predict connectivity
      │
      ▼
 Refine assignment P
      │
      ▼
      Repeat  ──►  Convergence
```

## Why Metacells?

The transcriptomic atlas contains approximately 100,000 cells. Running a
full optimization independently at that scale is computationally expensive
and can introduce unnecessary noise. ConnectionMiner therefore first
constructs approximately **5,300 metacells** — small groups of cells that
are:

- transcriptionally homogeneous
- located in a similar expression neighborhood
- compatible with similar candidate cell types

The expensive optimization is performed at the metacell level, then
expanded back to raw expression clusters and finally to individual cells:

```text
Metacells → Raw expression clusters → Individual cells
```

This provides a computationally manageable representation while preserving
the biological structure needed for inference.

## The Full Pipeline

```text
     ┌─────────────────────────┐
     │    Single-cell atlas    │
     │       ~100K cells       │
     └─────────────────────────┘
                  │
                  ▼
     ┌─────────────────────────┐
     │    Expression-based     │
     │       constraints       │
     └─────────────────────────┘
                  │
                  ▼
     ┌─────────────────────────┐
     │    ~5,300 metacells     │
     └─────────────────────────┘
                  │
                  ▼
     ┌─────────────────────────┐
     │     ConnectionMiner     │
     │ Expression + Connectome │
     └─────────────────────────┘
                  │
                  ▼
     ┌─────────────────────────┐
     │     Metacell × type     │
     │   probability matrix    │
     └─────────────────────────┘
                  │
                  ▼
     ┌─────────────────────────┐
     │     Expand back to      │
     │    individual cells     │
     └─────────────────────────┘
                  │
                  ▼
     ┌─────────────────────────┐
     │     Final cell-type     │
     │      probabilities      │
     └─────────────────────────┘
```

## Validation

ConnectionMiner is evaluated from two complementary perspectives.

### 1. Recovery of known cell types

Some transcriptomic clusters already have confident biological type
annotations. These labels can be treated as held-out ground truth and
hidden during the inference process.

> **Can the method recover known biological identities without directly
> being given those identities?**

ConnectionMiner currently recovers **74 / 74 (100%)** of the evaluated
named clusters.

### 2. Connectome reconstruction

The inferred cell-type assignments can also be used to reconstruct a
connectivity structure, which is compared with the actual connectome.

> **Do the inferred cell identities actually explain the observed wiring
> diagram?**

ConnectionMiner currently achieves **AUC = 0.86** for separating true
synaptic type-pairs from unconnected pairs.

### Why both metrics matter

The two evaluations probe different failure modes: a model could perform
well using only transcriptomic similarity while failing to explain
connectivity, or exploit connectivity while producing biologically
implausible expression assignments. ConnectionMiner is designed to satisfy
both.

| Evaluation | Question |
|---|---|
| Known-type recovery | Does the model recover biological cell identity? |
| Connectome AUC | Does the inferred identity structure explain wiring? |

## The Biological Intuition

A useful way to think about ConnectionMiner is that neuronal identity
exists in multiple spaces:

```text
              Neuron identity
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
  Molecular space          Circuit space
        │                       │
        ▼                       ▼
  Gene expression          Synaptic wiring
        │                       │
        └───────────┬───────────┘
                    ▼
             Cell-type identity
```

Gene expression captures the molecular program of a neuron; connectivity
captures its role in the circuit. ConnectionMiner asks whether these two
views can constrain each other.

## *Drosophila* Visual System

The *Drosophila* visual system is an especially useful setting for this
approach because it combines:

- hundreds of distinct neuronal types
- highly structured circuit architecture and stereotyped synaptic
  connectivity
- large-scale electron-microscopy reconstructions
- extensive transcriptomic profiling

The optic lobe contains multiple layers of visual processing — the lamina,
medulla, lobula, and lobula plate — through which information is
transformed across large networks of repeated, highly specialized
neuronal types. This makes connectivity particularly informative when
transcriptomic signatures alone are insufficient.

### Connectome context

ConnectionMiner builds on recent advances in *Drosophila* connectomics,
including large-scale reconstruction of neurons and their synaptic
relationships. The FlyWire connectome provides a near-complete wiring
diagram of the adult *Drosophila* brain — approximately 140,000 proofread
neurons and more than 50 million synapses — along with cell-type
annotations, optic-lobe circuit structure, and tools for interactive
network exploration.

## Repository Structure

```text
cm_active/
│
├── data/
│   ├── Adult.h5ad
│   ├── cell-type catalogue
│   ├── connectome
│   └── root-ID / type mappings
│
├── cm_visual/
│   ├── metacell construction
│   ├── ConnectionMiner solver (CPU + GPU/Torch backends)
│   └── pipeline components
│
├── scripts/
│   ├── preprocessing & solver pipeline
│   ├── downstream analyses
│   ├── cell-type mixing experiments
│   └── dashboard generation
│
├── output/
│   ├── solver results, matrices, heatmaps
│   ├── CSV outputs
│   └── interactive visualizations
│
├── connectome/                  ← this app
│   ├── public/readme/           (images used in this README)
│   └── src/                     (interactive connectome explorer)
│
├── P_CONSTRAINTS_AND_METACELLS.md
└── README.md
```

## Main Outputs

ConnectionMiner produces several downstream data products:

- **Cell × cell-type probability matrix** — $P_{\text{cell}\times\text{type}}$,
  one row per cell, one column per each of the 741 candidate
  visual-system cell types.
- **Metacell-level solution** — the compact solution from the primary
  optimization stage; useful for inspecting the global inference,
  evaluating uncertainty, visualizing cell-type structure, and downstream
  analysis.
- **Predicted connectivity** — the inferred cell-type assignments
  projected back into connectivity space, for direct comparison between
  the observed and predicted connectome.

The repository also contains outputs for evaluating known cell-type
recovery, connectome reconstruction, pairwise connectivity discrimination,
and cell-type mixing experiments.

## Interactive Exploration

This repository includes a separate connectome visualization
application (`connectome/`), designed to make it possible to inspect
cell-type assignments, connectivity patterns, experimental results, neuron
pairs, and inferred relationships between transcriptomic and connectomic
structure — maintained as its own web app.

## What ConnectionMiner Adds

Traditional transcriptomic annotation can be summarized as:

```text
Gene expression → Expression cluster → Cell type
```

ConnectionMiner adds circuit information:

```text
                     Gene expression
                            │
                            ▼
                    Possible identities
                            │
                            ▼
                  ┌───────────────────┐
   Synaptic       │   ConnectionMiner │
   wiring ───────►│                   │
                  └───────────────────┘
                            │
                            ▼
                        Connectome
```

The result is an annotation framework where molecular similarity and
circuit similarity constrain each other.

## Key Results

| Metric | Result |
|---|---|
| Candidate visual-system types | 741 |
| Transcriptomic cells | ~100,000 |
| Metacells | ~5,300 |
| Held-out named clusters recovered | 74 / 74 |
| Cell-type recovery | 100% |
| Connectome pair discrimination | AUC 0.86 |

## Project Goal

> **Can neuronal identity be inferred more accurately by jointly modeling
> molecular expression and circuit connectivity?**

Rather than treating transcriptomics and connectomics as independent
annotation systems, ConnectionMiner treats them as complementary
observations of the same underlying biological identity. The long-term
goal is to move from an *unknown / ambiguous transcriptomic cluster* to a
*connectome-informed cell-type distribution* for every neuron in the
*Drosophila* visual system.

## Research Perspective

ConnectionMiner sits at the intersection of single-cell genomics,
computational neuroscience, connectomics, representation learning, graph
inference, and cell-type annotation.

The broader motivation is that neuronal identity is inherently
multidimensional — molecular, morphological, connectivity, and functional
properties all play a part. ConnectionMiner focuses on two of these:

$$\textbf{Gene expression} \;+\; \textbf{Synaptic connectivity}$$

and asks whether combining them can reveal cell identity that neither
source can resolve reliably on its own.

## References

- **FlyWire** — Dorkenwald et al., *Neuronal wiring diagram of an adult
  brain*, Nature, 2024.
- **Drosophila visual system connectomics** — recent connectomic studies
  producing detailed inventories of neuronal types and their synaptic
  relationships across the *Drosophila* visual system.
- **Connectome exploration** — the FlyWire and Codex ecosystems provide
  interactive tools for exploring reconstructed neurons, annotations, and
  synaptic connections.

## Acknowledgements

ConnectionMiner builds upon publicly available *Drosophila* transcriptomic
and connectomic resources, including data generated by the broader
FlyWire/connectomics community.

---

<p align="center">
  <b>ConnectionMiner</b>
  <br>
  <i>Inferring neuronal identity from molecular expression and circuit wiring.</i>
  <br><br>
  🧬 × 🕸️ → 🧠
</p>
