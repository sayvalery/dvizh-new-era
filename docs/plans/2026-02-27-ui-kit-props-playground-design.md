# UI Kit: Props Table + Alpine Playground

**Date:** 2026-02-27
**Status:** Approved

## Goal

Show component props and descriptions alongside demos in UI Kit. For key components — interactive live editing of simple props via Alpine.js.

## Architecture

### 1. Auto-parsed Props Table

**Utility function `parseComponentMeta(filePath)`** in UI Kit frontmatter:
- Reads `.astro` source via `fs.readFileSync` at build time
- Extracts JSDoc description (first `/** ... */` block before `interface Props`)
- Parses `interface Props { ... }` — name, type, required (`?`), JSDoc comment
- Extracts default values from destructuring (`const { title = 'default' } = Astro.props`)
- Returns `{ description: string, props: PropMeta[] }`

**Component `PropsTable.astro`** in `components/ui/`:
- Renders: component description, then table (Name | Type | Required | Description | Default)
- Compact styling, monospace for types, badge for required

### 2. Alpine Playground (3 components)

Interactive live editing for:
- **CTA** — variant (select: dark/light/split), title, description, badge, buttonText
- **HeroSection** — badge, title, description, withForm (toggle), formPreset (select)
- **PersonCard** — name, jobTitle, variant (select: full/inline)

Layout: inputs panel left, live preview right (grid 1/3 + 2/3).
Alpine `x-data` with reactive variables, inline HTML with `x-text`, `:class`, `x-show`.

### 3. Non-playground components

All other components (FeaturesGrid, StatsSection, Timeline, BentoGrid, etc.) — PropsTable + static demos as currently.

## Implementation Steps

1. Create `parseComponentMeta()` utility function in UI Kit frontmatter
2. Create `PropsTable.astro` component
3. Add PropsTable to all existing UI Kit sections
4. Build Alpine playground for CTA
5. Build Alpine playground for HeroSection
6. Build Alpine playground for PersonCard
7. Verify with dev server

## Constraints

- No new dependencies (fs is Node.js built-in, Alpine.js already loaded)
- PropsTable.astro is a dev-only component (only used in UI Kit)
- Alpine playground HTML is a simplified copy, not 1:1 replica
- Only simple props are editable (string, number, boolean, enum select)
