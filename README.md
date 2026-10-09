# Pool Lab

A small Ethereum swap impact sandbox for the BluePrint and IMD community. Change a trade amount, choose or edit pool liquidity, adjust fee and slippage, and compare the same trade with twice the liquidity. The chart and estimated output update instantly. The visible page footer explains what was built and why.

The complete static website is in **`dist/`**. Source, lockfile, tests, design documentation and validation evidence are included. React + TypeScript + Vite; no account, backend, wallet, signing, keys, external assets or runtime services.

## Install and preview

Use Node.js 24 or later (the test runner uses built-in TypeScript stripping) and npm 11 or later.

```sh
npm ci
npm run preview
```

Open the local URL printed by Vite. Preview serves the existing `dist/` export. To edit source with live reload, use `npm run dev`. Dependencies are needed for development and checks, not on the hosting server. Keep every `node_modules` and package-manager cache directory out of the submission; do not use a blanket staging command. This delivery contains neither dependencies nor caches and does not alter any ignore file.

## Rebuild and check

```sh
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

The browser test starts its own temporary HTTP server, serves the export at `/preview/`, runs Chromium interactions and closes both browser and server. It overwrites the screenshots and JSON report in `artifacts/`. Browser downloads are development tools and are not part of the static export. No screenshot or test scaffolding is required at runtime.

For this constrained assignment, dependencies and browser binaries were installed only under `/tmp`. An exact source copy was built in `/tmp/pool-lab-build` to avoid writing the repository's protected `node_modules/` path. Actual commands were `npm run typecheck --prefix /tmp/pool-lab-build`, `npm test --prefix /tmp/pool-lab-build`, `npm run build --prefix /tmp/pool-lab-build`, and `PLAYWRIGHT_BROWSERS_PATH=/tmp/pool-lab-browsers npm run test:browser` from that directory. The final export is copied back byte for byte; source and export parity are checked during delivery.

## Publish

Upload **all contents of `dist/` together**, preserving `assets/` and the local license file. Serve `index.html` from any static HTTP(S) host. The publisher can serve the supplied export directly; it does not need to rebuild. Asset URLs begin with `./`, so subpaths work. No server routing rules, environment variables, network allowlists, CORS configuration or secrets are needed.

A host can embed the module with:

```html
<iframe
  src="./pool-lab/index.html"
  title="Pool Lab swap sandbox"
  sandbox="allow-scripts"
  style="width:100%;height:900px;border:0"
></iframe>
```

The example assumes the `dist/` contents were uploaded into a `pool-lab` directory beside the host page. The iframe scrolls vertically; the parent may choose a different height. Scripts must be enabled. The build emits a classic deferred script and a separate stylesheet, so an opaque-origin iframe does not need `allow-same-origin` or special CORS response headers. A production content policy blocks runtime connections, inline scripts and remote assets. Development omits that policy to permit Vite's local hot reload.

No service worker is installed. Once the local assets have loaded, every interaction works with the network disconnected. First load or reload still requires access to the static files (or a browser cache); “Runs offline” does not promise an installable offline app.

## Model and limits

UNIT is fictional. Examples begin at 10,000 UNIT per ETH. Pool presets contain 10, 100 and 1,000 ETH, respectively; the token reserve scales proportionally. Direct numeric inputs support 0.01 through 1,000,000, with a decimal point and no thousands separators. Fractional forms such as `.5` work. Exponent notation, negative amounts and ambiguous comma formats are rejected with recovery instructions.

For trade `d`, ETH reserve `x`, token reserve `y = 10,000x`, fee fraction `f` and slippage fraction `s`:

```text
a = d × (1 − f)
tokens received = y × a / (x + a)
price impact = a / (x + a) × 100%
minimum after buffer = tokens received × (1 − s)
```

Price impact excludes the pool fee; the received amount includes it. Slippage changes the hypothetical minimum, not the estimated output. Impact labels are teaching thresholds: under 1% small, 1% to below 5% noticeable, 5% or above high. They are not recommendations. The model uses browser floating-point arithmetic and formatted estimates, not on-chain integer execution. It excludes gas, routing, concentrated liquidity, intervening trades and token taxes. It is not a live quote.

## Actual validation

- Production build and TypeScript check: passed.
- Calculation tests: **6 passed**, including independent reference arithmetic, fees, slippage, liquidity, supported boundaries and invalid input handling.
- Browser validation: **15 groups passed**, including all primary controls, keyboard navigation, error recovery, offline calculations, and a restricted iframe.
- Reflow: no horizontal overflow at **320, 360, 600, 752, 900 and 1200px**, including extreme values at 320px; 200% text enlargement checked separately.
- Axe WCAG A/AA scans: **0 violations** at 360px and 1200px. Representative measured text contrast: **5.36:1 to 9.37:1**.
- Final browser run: **0 external requests, 0 failed resource requests and 0 console errors**.
- Six-domain Better Interface review completed; mobile chart-label sizing, collapsed-line whitespace and sandbox loading issues fixed and rechecked.

Full evidence, initial findings and coverage limitations are in [`VALIDATION.md`](VALIDATION.md). Delivered machine-readable results are in [`docs/validation/browser-results.json`](docs/validation/browser-results.json). Screenshots include [desktop](docs/validation/desktop.png), [mobile](docs/validation/mobile.png), [comparison](docs/validation/comparison.png) and [invalid input](docs/validation/invalid-input.png). Browser checks generate their originals under `artifacts/`; this workspace excludes that directory from Git, so the final evidence is also preserved in `docs/validation/` without changing any ignore rule. Paths recorded inside the raw JSON identify the original generated files.

These are worker-run checks, not independent certification. Screen-reader sessions, native browser zoom, Safari/Firefox, physical touch devices and the live community host were not tested. There is no live market-data validation because the examples are intentionally simulated.

## Files and attribution

- `src/`: interface, tokens and calculation model.
- `public/`: original favicon and runtime license notices.
- `dist/`: complete production export to publish.
- `tests/`: calculation and real-browser interaction checks.
- `DESIGN.md`: implemented typography, colors, components and responsive rules.
- `VALIDATION.md`: actual checks, six-domain review and limitations.
- `artifacts/`: locally generated browser evidence (ignored by workspace policy).
- `docs/`: delivered evidence, pinned design-guide attribution and licenses.

Design guidance follows the supplied Better Interface reference; documentation follows its included Impeccable method. Attribution and retained licenses are in [`docs/NOTICE.md`](docs/NOTICE.md). No remote guide content is needed to build or use the module.
