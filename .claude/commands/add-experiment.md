---
description: Register (or replace) an experiment tile from a file dropped in public/expt-add/, then commit and push
argument-hint: "[filename in public/expt-add/] [replace:<existing-experiment-id>]"
---

You are running the ConnectionMiner "add experiment" workflow for this repo. Goal: take one or
more raw files a human manually copied into `public/expt-add/`, turn each into a properly
registered experiment tile, and ship it.

Arguments passed to this command: $ARGUMENTS

Follow these steps in order.

## 1. Find the target file(s)

- If an argument names a specific file (relative to `public/expt-add/`), use that one file.
- Otherwise, list `public/expt-add/` and diff it against every `url` value already present in
  `SEED_EXPERIMENTS` inside `src/lib/experiments.ts` — any file in that folder not yet referenced
  by a `url: "/expt-add/<name>"` entry is a new upload to process. Process all of them.
- If nothing new is found and no argument was given, say so and stop.

## 2. Understand what the file is

- **HTML files**: these are large, self-contained interactive dashboards — do NOT `cat`/`Read`
  the whole file (they can be 10-40MB with multi-megabyte single lines of embedded JSON data).
  Instead use targeted `grep -o` for `<title>...</title>`, the first `<h1...>`, and any element
  with `class="subtitle"` to learn what the visualization shows. If useful, `grep -n` for
  structural markers (`<script`, `toolbar`, `select`, `canvas`, `plotly`) to understand the
  interaction model, but never dump the giant embedded-data lines into context — check line
  lengths first (`awk '{ print length, NR }' file | sort -rn | head`) and read around them, not
  through them.
- **Image files** (png/jpg/svg): open with the Read tool (it renders images) to see what the
  figure actually depicts.
- Note the file size — this repo has shipped 12-18MB HTML bundles before, that's normal.

## 3. Clean up the filename

Rename to a lowercase, URL-safe filename: no spaces, no parentheses, underscores or hyphens only
(e.g. `metacell_cluster_umap (3).html` → `metacell_cluster_umap.html`). Do this with `mv` inside
`public/expt-add/`.

## 4. Decide: new tile, or replace an existing one?

- If the argument included `replace:<id>`, find that experiment object in `SEED_EXPERIMENTS` by
  its `id` field and update its `url` in place (point it at the new `/expt-add/<file>` path).
  Update `description` too if the new content's subject differs from the old description at all
  — keep `id`, `title`, and `category` unless the new content is clearly a different thing, in
  which case ask the user before renaming the tile.
- Otherwise, this is a new tile: pick a short kebab-case `id` (derived from the title, matching
  the style of existing ids like `metacell-cluster-umap`), a clear `title`, and a one-paragraph
  `description` written in the same voice as the existing entries in `src/lib/experiments.ts`
  (factual, specific about what's on each axis / what interaction does what — not marketing
  copy). Pick `category` to match one of the existing categories already used in that file
  (Pipeline, Recovery Battery, Full Solver Run, Matrices, Ablations, UMAP Views) based on what
  the content actually is — don't invent a new category unless nothing existing fits, and ask
  the user first if so.
- Add/edit the entry in the `SEED_EXPERIMENTS` array in `src/lib/experiments.ts`, matching the
  existing formatting exactly (see the entries already there for the shape).

## 5. Commit and push

- `git add` the renamed file(s) in `public/expt-add/` and `src/lib/experiments.ts`.
- Commit with a concise message describing what tile was added/replaced (follow this repo's
  existing commit style — check `git log --oneline -5` if unsure).
- `git push origin <current-branch>`.
- If push fails on auth (403 / could not read username), stop and tell the user exactly what
  failed — do not attempt to embed credentials in the remote URL or write secrets to any dotfile
  yourself; ask the user how they'd like to authenticate on this machine.

## 6. Report back

Tell the user, in the language they've been using in this conversation, which tile(s) were
added/replaced (title, id, category, file path) and confirm the push succeeded with the commit
range (e.g. `abc123..def456`).
