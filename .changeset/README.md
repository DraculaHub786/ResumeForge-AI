# Changesets

This folder holds the pending release notes for the monorepo.

Every package in the workspace is **fixed**: they share one version number, so
a change to `@resume-builder/types` (the shared contract) and a change to the
web app are always released together. `scripts/check-versions.mjs` fails the
build if the versions ever drift apart.

## Adding a changeset

```bash
pnpm changeset
```

Pick the packages you touched, choose a bump type, and write a one-line summary
in the past tense — it becomes the changelog entry.

Then commit the generated markdown file in `.changeset/` alongside your code.

## Cutting a release

```bash
pnpm version   # applies the changesets, bumps every package, updates the lockfile
pnpm release   # publishes to npm
```
