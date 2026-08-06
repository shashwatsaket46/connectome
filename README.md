# ConnectionMiner

A model that links a **connectome** (who wires to whom) with a **transcriptome** (which genes each cell expresses), to learn the gene-level rules behind neural wiring.

---

## What is a connectome?

A **connectome** is a map of the connections in a nervous system — a wiring diagram of the brain. It records which neurons form synapses onto which others.

In practice it is stored as a matrix. If there are *N* cell types, the connectome is an *N × N* matrix **C** where entry `C[i, j]` says whether (or how strongly) type *i* connects to type *j*:

```
        to →
        L1   L2   L3   L4
from  ┌                      ┐
 L1   │  0    1    0    1    │   L1 synapses onto L2 and L4
 L2   │  1    0    1    1    │
 L3   │  0    1    0    0    │
 L4   │  1    1    0    0    │
      └                      ┘
```

Connectomes come from **electron-microscopy reconstructions** — imaging brain tissue slice by slice and tracing every neuron and synapse. The *Drosophila* (fruit fly) visual system used here comes from the **FlyWire** connectome, covering the optic lobe with 741 distinct cell types.

A connectome tells you the *structure* of a circuit, but not *why* it is wired that way. That "why" is what ConnectionMiner is after.

---

## What is ConnectionMiner?

Neurons don't wire up randomly. Which cell connects to which is shaped, in large part, by the **genes** each cell expresses — surface molecules, guidance cues, and recognition proteins that tell a growing axon where to go and what to bind.

ConnectionMiner tries to recover those rules. Given:

- **C** — the connectome (type × type wiring)
- **G** — gene expression per cell (cell × gene)
- **P** — an assignment of cells to types

it learns a **gene–gene interaction matrix β** such that the wiring predicted from expression matches the observed connectome:

```
Ĉ  =  Pᵀ (G β Gᵀ) P   ≈   C
```

In words: *"the connectivity you'd predict from these cells' genes, given this interaction matrix β, should reproduce the real connectome."*

The scientific payload is **β** — it encodes statements like *"cells expressing gene A tend to synapse onto cells expressing gene B."* That is a candidate molecular rule of brain wiring, extracted directly from data.

### How it works

ConnectionMiner optimizes by **alternating** between two updates:

```
repeat:
    β-update  →  fix P, find the gene rules that best explain C
    P-update  →  fix β, refine which cells belong to which type
```

- The **β-update** is a regression: given the current type assignment, which gene-pair interactions best reconstruct the connectome?
- The **P-update** is an assignment step (entropic optimal transport): given the current gene rules, which type does each cell most likely belong to?

Repeating these two steps lets the model co-refine *what the rules are* and *which cell is which* until the reconstructed connectome matches the observed one.

### Why both modalities

Neither source alone is enough:

- **Connectome alone** tells you the wiring but not the molecular cause.
- **Expression alone** tells you what genes are on but not what wiring they produce.

ConnectionMiner sits at the intersection — using expression to *explain* connectivity, and connectivity to *constrain* what the genes must be doing.

---

## Key terms

| Term | Meaning |
|---|---|
| **Connectome** | wiring diagram of a nervous system, as a type × type matrix `C` |
| **Transcriptome** | the set of genes expressed in each cell, as a cell × gene matrix `G` |
| **Cell type** | a group of neurons with shared molecular identity and connectivity (e.g. `L1`, `Tm3`) |
| **P** | assignment of cells to types (what the model resolves) |
| **β** | gene × gene interaction matrix (what the model learns — the payload) |
| **Metacell** | a small pool of similar cells averaged together to reduce noise and cost |

---

## The organism

This work uses the **adult *Drosophila melanogaster* (fruit fly) visual system** — the optic lobe. The fly is a standard model for connectomics: small enough to reconstruct completely, complex enough to have real circuit logic, and backed by both a full EM connectome (**FlyWire**) and a single-cell transcriptomic atlas.