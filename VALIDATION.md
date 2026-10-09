# Pool Lab validation record

## Scope and assumptions

Complete for the stated scope. One English-language page, React/TypeScript source and a relative static export in `dist/`. The chosen module explains swap price impact; it does not repeat the supplied gas conversion, tower game or live pool monitoring examples. UNIT is fictional, the starting rate is illustrative, and all reserves are inputs rather than fetched balances. No requester-owned value, contract or credential is needed.

Review applied the supplied Better Interface workflow and the core principles of all six domains during implementation. The layout is an original light theme, with native controls and locally drawn vector graphics. No external content was fetched by the application. Source, model limitations, formula, impact thresholds and the visible purpose paragraph were reviewed together.

## Actual commands and outcomes

Environment: Node 24.9.0, npm 11.6.0, Vite 7.2.2, TypeScript 5.9.3, Playwright 1.56.1, Chromium 141.0.7390.37. Dependencies and browser binaries were installed in temporary directories, with an exact copy of source/configuration/lockfile used for the build. No dependencies were installed into the task repository.

| Command | Outcome |
| --- | --- |
| `npm install --prefix /tmp/pool-lab-build --cache /tmp/pool-lab-npm-cache --no-audit --no-fund` | Exit 0; pinned dependency lockfile generated and delivered |
| `npm run typecheck --prefix /tmp/pool-lab-build` | Exit 0 on final application/configuration source |
| `npm test --prefix /tmp/pool-lab-build` | Exit 0; 6 tests passed |
| `npm run build --prefix /tmp/pool-lab-build` | Exit 0; final HTML, JS, CSS, favicon and runtime license export: 227,946 bytes |
| `PLAYWRIGHT_BROWSERS_PATH=/tmp/pool-lab-browsers /tmp/pool-lab-build/node_modules/.bin/playwright install chromium` | Exit 0; browser installation stayed outside repository |
| `PLAYWRIGHT_BROWSERS_PATH=/tmp/pool-lab-browsers npm run test:browser` in `/tmp/pool-lab-build` | Exit 0; 15 check groups passed; bounded foreground server/browser closed |
| Byte comparison of source, public files, tests, package/lockfile/configuration and final copied export | Passed; repository `dist/` equals final build |

The final code and stylesheet were browser-checked after the last behavior/visual fixes. A final rebuild additionally copied the runtime license notice into `dist/`; JS/CSS hashes remained identical to the browser-checked assets. The Vite output uses a deferred classic IIFE script and external local CSS. The production-only content policy has `connect-src 'none'`, and all runtime asset references are relative.

The provided browser connector could not launch because its expected `chrome-for-testing` executable was absent. A local Playwright browser, installed under `/tmp`, provided the actual rendered checks instead. This is an executed alternative, not a claim that the connector worked.

## Interaction and export verification

`tests/model.test.ts` checks the exact half-pool result for a zero-fee equal-reserve trade; default output against independently rearranged constant-product arithmetic; improved execution with more liquidity; separate fee/slippage effects; min/max boundary combinations; and invalid/ambiguous numeric formats. The UI accepts `.5` and rejects unsupported exponent/comma notation explicitly.

`tests/browser.mjs` serves the actual production export at `/preview/` and checks:

- The initial 5 ETH / 100 ETH pool quote: **47,482.97 UNIT**, **4.75%** price impact, **0.015000 ETH** fee.
- All three liquidity presets; direct reserve and amount edits; fee and slippage selects; reset; native keyboard range control.
- Twice-liquidity comparison: **48,637.71 UNIT**, a larger output, a second dashed curve, and reversible disclosure.
- Both numeric fields with blank, negative, zero, comma, oversized and exponent entries. Inline errors expose invalid state, the old quote disappears and “Restore example” recovers the whole form.
- Supported extreme values at 320px, including comparison and nonfinite-result checks.
- Keyboard skip link, preset activation, field order, slider arrow key, selects, reset, comparison and formula disclosure.
- A real opaque-origin iframe with only `sandbox="allow-scripts"` at 1200px and 360px; no special CORS response headers.
- A loaded iframe with the browser context offline. Entering `.5` returns **4,960.27 UNIT**; comparison still works.

Final browser result: **0 console errors, 0 failed resources, 0 external requests**. Only the local preview origin is allowed by the request assertion. The HTML, scripts and CSS load from the subpath correctly. There is no service worker, wallet dependency, transaction flow, persistence layer or remote data feed.

## Better Interface coverage

| Domain | Coverage and evidence | Limits / not applicable |
| --- | --- | --- |
| Accessibility | **Checked.** Source labels, native controls, landmarks, one h1, pressed states, input errors, chart description and stable live region. Keyboard primary flow executed. Normal preset focus and forced-color comparison focus visually inspected. Axe scans at 360px and 1200px: zero WCAG A/AA violations. | No screen-reader session; live announcements are source-reviewed, not speech-verified. No physical touch device. Not every control's focus was individually screenshotted. Modals/focus traps are not applicable. |
| Layout | **Checked.** Shared edges and DOM order reviewed; production screenshots at desktop/mobile; overflow measured at 320, 360, 600, 752, 900 and 1200px; extreme values at 320px; iframe checks. 200% root-text enlargement at 1200px had no horizontal overflow. | Text enlargement is not native browser zoom. RTL/localized variants are not applicable to the English-only module. Live host sizing was not tested. |
| Writing | **Checked.** Action labels match their handlers. UNIT and simulation status are explicit. Errors state a recovery; minimum, fee and price impact are distinct. Formula and exclusions are available in disclosure. Required purpose paragraph is always visible. | No external factual claims about private persons, current prices or events. No localization. |
| Typography | **Checked.** Semantic scale, 16px+ editable fields, tabular numeric output, prose measure and selectable text reviewed. Screenshots cover default, error, comparison, long results and narrow wrapping. Chart label scaling and hidden-break whitespace fixed. | System font rendering varies by OS; there is no claimed custom-font loading test. Safari input zoom and native device typography unverified. Some nonessential metadata is intentionally 10–11px. |
| Colors | **Checked.** Semantic roles and text redundancy reviewed. Six rendered text/background pairs measured; representative results below. Forced-colors screenshot visually inspected. | No dark theme; no image/gradient contrast case. Focus is visually checked in representative states, not an exhaustive numeric contrast audit of every control state. |
| UI | **Checked.** Preset selection, high/noticeable/small status, input errors, quote/empty state, reset, comparison and native disclosure exercised. Only the comparison/restoration action is filled. Reduced motion produces zero transition duration; forced-color control boundaries and focus remain visible. | No network loading state, toast, dialog or page entrance. Slow-motion Animations-panel review not performed; movement is limited to 120ms button press feedback. |

## Findings and fixes

Locations point to the corrected source.

| Severity / domain | Source | Observed behavior and impact | Fix and recheck |
| --- | --- | --- | --- |
| Medium / typography | `src/App.tsx:29`, `src/styles.css:148` | At 360px, axis text embedded in a 568-unit SVG shrank to about half its intended size, making chart values hard to read. | Moved axis labels to 11px HTML tracks while keeping the plot scalable. Final mobile screenshot shows readable labels. Reflow and interaction suite passed. |
| Low / writing and layout | `src/App.tsx:82`, `src/App.tsx:119` | Hiding a visual line break on mobile joined adjacent words/sentences in the intro and footer. | Explicit whitespace now survives collapsed breaks. Final mobile and forced-color screenshots show the corrected spacing. |
| High / iframe runtime | `vite.config.ts:8`, `vite.config.ts:23` | Default module and stylesheet CORS attributes failed in `sandbox="allow-scripts"`; Chromium reported null-origin CORS errors and the iframe could not load the app. | Classic IIFE output, deferred script, no crossorigin attributes and separately emitted CSS. Both iframe widths now load and respond without console/resource errors; offline use also passes. |
| Medium / production styling | `vite.config.ts:23` | During the iframe correction, IIFE output initially injected CSS through JavaScript, which the production content policy rejected. | Explicit `cssCodeSplit: false` emits a local stylesheet. Final screenshots, computed styles, axe scans and browser console checks all pass. |

An initial accessibility-check harness failure required an explicit `browser.newContext()` (`tests/browser.mjs:35`). That was a test setup issue, corrected before claiming any scan result. No failed or partial run is represented as a passing browser report.

## Measured contrast

Computed foreground/background values were read from rendered elements and their effective opaque ancestor background, then evaluated with the WCAG relative-luminance formula. The six measured pairs all meet 4.5:1 for normal text.

| Element | Foreground / background | Ratio |
| --- | --- | --- |
| Intro copy and offline badge | `#5d685d` / `#f5f6f0` | 5.36:1 |
| Quote caption and metric labels | `#5d685d` / `#fcfdf9` | 5.70:1 |
| Compare button | `#fcfdf9` / `#234d3a` | 9.37:1 |
| Noticeable-impact tag | `#7a4b08` / `#f7edce` | 6.33:1 |

## Evidence and remaining limits

The raw passing report and six actual production screenshots are preserved in `docs/validation/`: `browser-results.json`, `desktop.png` (1200px), `mobile.png` (360px), `comparison.png` (360px), `invalid-input.png` (360px), `keyboard-focus.png` (320px), and `forced-colors.png` (360px). Screenshots were opened and visually inspected, not merely generated. Intermediate widths and text enlargement have programmatic overflow evidence, not separately saved screenshots.

The browser script generates originals under `artifacts/`, an existing workspace Git-excluded path. The copies under `docs/validation/` keep the evidence in the submission without changing `.git/info/exclude` or adding an ignore file. The raw JSON retains the original `artifacts/` output paths. Source/configuration, the lockfile, static export and documentation contain no dependency/cache directory, archive or submodule. The final file audit found 30 deliverable files, approximately 1.25 MB uncompressed, below the 8,388,608-byte submission ceiling; the production export itself is 227,946 bytes. All relative HTML assets and documentation links resolved to existing delivered files.

Unperformed: Safari/Firefox, real assistive-technology sessions, browser-native zoom, physical mobile devices, actual host integration and exhaustive focus/contrast variants. The formula is a simplified educational simulation, not audited execution logic. The six-domain review and test outcomes are worker evidence and have no independent certification authority.
