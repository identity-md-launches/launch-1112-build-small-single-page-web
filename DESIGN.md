# Pool Lab design system

## Overview

Pool Lab is a one-page educational swap sandbox for Ethereum token holders. Its original identity uses warm off-white surfaces, forest green, open spacing and a simple pool-line symbol. It is a community tool, not a replica of BluePrint's site or a trading interface. The quote is the strongest element within the workspace; the comparison is its only filled action. Setup, estimate, short lessons and model details follow that reading order.

The implementation lives in `src/App.tsx` and `src/styles.css`. `src/model.ts` owns calculations and formatting. There are no downloaded images, font files or icon libraries.

## Colors

`src/styles.css:1` is the source of truth. Components use semantic tokens backed by hexadecimal primitives. There is one light theme plus support for the browser's forced-colors mode.

| Semantic token | Exact value | Role |
| --- | --- | --- |
| `--bg-page` | `#f5f6f0` | Page canvas |
| `--bg-surface` | `#fcfdf9` | Panels and standard fields |
| `--bg-subtle` | `#edf0e7` | Trade field, model badge, comparison surface |
| `--text-primary` | `#25382b` | Headings, values, labels |
| `--text-secondary` | `#5d685d` | Supporting copy, chart axes, units |
| `--border-subtle` | `#dce1d5` | Structural borders and chart grid |
| `--border-control` | `#7a8578` | Input and preset boundaries |
| `--accent-solid`, `--focus-ring` | `#234d3a` | Primary action, selection outline, focus |
| `--accent-hover` | `#183d2c` | Primary action hover |
| `--accent-text` | `#fcfdf9` | Text on the primary action |
| `--accent-soft` | `#e6efdf` | Selected preset and small-impact status |
| `--chart-stroke` | `#497654` | Current-pool curve and display accent |
| `--chart-fill` | `#e6efdf` | Area under the current-pool curve |
| `--chart-compare` | `#5d685d` | Dashed comparison curve |
| `--brand-highlight` | `#d4eeab` | Pool symbol and text selection |
| `--status-warning-bg`, `--status-warning-text` | `#f7edce`, `#7a4b08` | Noticeable impact |
| `--status-high-bg`, `--status-high-text` | `#fae8df`, `#963e28` | High impact and field errors |

Status wording accompanies every status color. The comparison curve is dashed and labeled, so color is not its only distinction. Rendered measurements include secondary text/page 5.36:1, secondary text/surface 5.70:1, primary button 9.37:1 and warning status 6.33:1. These are representative measured pairs, not a blanket certification; see `VALIDATION.md`.

## Typography

The CSS stack is `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`. It uses installed system fonts only; Inter is optional if already installed, not requested over the network. Section indices use `ui-monospace, monospace`. Actual glyphs and intermediate requested weights depend on the available system face. Weight synthesis is allowed; no separate custom font-weight files are required.

Tokens define 12px (`--text-xs`), 13px (`--text-sm`), 14px (`--text-label`), 16px (`--text-body`) and 18px (`--text-title`) at a 16px root. The desktop hero uses `clamp(2.75rem, 5.4vw, 4.125rem)` at weight 550, line-height 1.04, and -3px letter spacing. Mobile overrides it to 3.5rem, then 3.25rem below 24rem. Section headings are 18px/650. The main quote uses `clamp(2rem, 4.1vw, 3.25rem)` with 2.7rem and 2.2rem mobile overrides. Input text is at least 16px; the trade amount is 30px. Body paragraphs use line-height 1.6.

Compact secondary metadata uses 10–11px to distinguish it from task controls. Chart axis numbers remain 11px HTML text instead of shrinking inside an SVG. Changing numbers use `font-variant-numeric: tabular-nums`. Headings balance, prose uses pretty wrapping, large result values can wrap, and no quote is truncated. Model prose is capped at 76ch; the footer paragraph at 74ch. Text remains selectable.

## Layout

Spacing tokens run 4, 8, 12, 16, 24, 32 and 48px. Main desktop gutters are 48px, with a 1200px maximum shell. Header, hero, workspace, lessons and footer share the shell edges. Panel padding is 26px. Workspace columns are `minmax(300px, .84fr)` and `minmax(0, 1.46fr)`, with a 20px gap. Inputs precede estimates in the DOM at every width.

| Breakpoint | Implemented behavior |
| --- | --- |
| Up to 62rem / 992px | Gutters 28px, panels 22px, workspace gap 16px, tighter metrics, optional model badge hidden |
| Up to 47rem / 752px | Shell capped at 620px, gutters 20px, single-column workspace, panels 24px, stacked lessons/footer, inline hero wrapping, header caption hidden |
| Up to 24rem / 384px | Gutters 16px, panels 20px, smaller quote/heading, model badge hidden, stacked comparison values |

There is no fixed-height page or sticky element. An iframe may scroll vertically. The chart scales to its container while its HTML labels stay legible. Extreme supported amounts wrap rather than pushing the viewport wider. Observed widths: 320, 360, 600, 752, 900 and 1200 CSS pixels, plus 200% root-text enlargement at 1200px. Native browser zoom and physical devices were not tested.

## Elevation & Depth

The surface system is flat. There are no shadows, blurs, modals or overlays. One-pixel borders define panels, inputs and metric divisions. Pale fills group secondary information. The only special stacking is the keyboard skip link at `z-index: 5` when focused.

## Shapes

`--radius-panel` is 20px; `--radius-control` is 10px. The pool mark has a 12px radius, statuses 4px, the model badge 5px, reset 7px, and the offline indicator is a pill. Presets use a 1px control border and a 2px selected border with compensating padding so selection does not change size. SVG icons share round caps/joins and a 1.7px stroke.

## Components

| Source / pattern | Purpose and states |
| --- | --- |
| `App` in `src/App.tsx` | Owns trade, reserve, fee, buffer and comparison state. Updates immediately. Reset restores all five defaults. A stable polite live region debounces summary updates by 450ms. |
| `.preset-grid` | Three native buttons with `aria-pressed`. Selected state uses a pale fill, heavier label and double-width border. Custom reserve amounts clear the preset selection. |
| `.field` / `.input-shell` | Permanent labels, decimal keyboards, selectable numeric text, unit suffixes, inline recovery instructions. Invalid entries expose `aria-invalid` and `aria-describedby`; results disappear until valid. |
| Native range and selects | Range mirrors the amount and supports arrow keys. Fee and slippage remain native selects. There are no custom popovers to manage. |
| `.compare-button` | Filled primary action. Its label and pressed state change when comparison is shown. It adds/removes output and impact values plus a dashed chart curve. In the empty state the same visual pattern restores the example. |
| `ImpactChart` in `src/App.tsx:14` | Accepts `amount`, `reserve`, `fee`, `compare`. SVG curves are computed from the same model as the quote. Accessible title/description state the current result. Axes are HTML for stable text size. |
| `Icon` in `src/App.tsx:4` | Five inline SVG variants: pool, arrow, reset, plus, info. Icons are decorative and use `currentColor`; controls always carry visible text. |
| `.model-details` | Native `details`/`summary` for formula and assumptions. Enter/Space toggles it. A plus changes to a cross when open. |

Keyboard focus uses a 2px perimeter with 4px offset (1px offset inside text fields). Forced colors use `Highlight` and native system colors. Buttons are at least 44px tall; selects 46px; the range input has a 30px native target. Hover styling is limited to hover-capable devices. Button background/press transitions are 120ms, only under `prefers-reduced-motion: no-preference`; press scale is .96. The high-frequency chart updates instantly. There are no loading states because there is no asynchronous data source.

## Do's and Don'ts

- Reuse the shell edges, surface tokens, field pattern and one filled action when extending this page.
- Keep numerical state in the model; derive chart and textual estimates from the same inputs.
- Preserve the distinction between fee, price impact and slippage. UNIT remains a clearly fictional example token.
- Keep axis text outside the scalable graphic; keep meaningful results readable without the chart.
- Add explicit error recovery and keyboard names to any new control. Do not replace native controls with clickable containers.
- Keep the production export self-contained. Do not add remote fonts, price feeds, wallet controls or trackers.

For another small section, use an existing panel, an `h2`, the spacing tokens and labeled native controls. Place secondary explanations in the existing disclosure pattern. Recheck the single-column layout and both normal and forced-color focus states.
