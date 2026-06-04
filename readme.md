# Claims Generator v2026-06-03 - Stable

A small static web app for generating claim email text and subjects.

## Overview

This repository contains a lightweight single-page application that helps build and preview claim-related emails (subject and body) based on several templates (Gas Claim, Streetlight, Escalation, Payment, Follow Up, Insurance, Settlement).

## Expected file structure

```
index.html
assets/
  css/
  js/
netlify.toml
```

---

## Recent Changes: Performance & DOM Cache (2026-06-02)

To improve runtime responsiveness and reduce redundant DOM lookups, a small DOM caching helper was added to `assets/js/config.js`.

What was added

- A lightweight DOM cache populated on `DOMContentLoaded` with frequently used element IDs (subjectOutput, emailOutput, formContainer, senderName, claimType, and others).
- Two small helpers exposed on `window`: `cacheDOM(ids)` and `getCached(id)`.

Why this helps

- Repeated calls to `document.getElementById` are avoided in hot code paths, which reduces lookup overhead and improves responsiveness when the preview updates frequently while typing.

Next recommended changes (planned)

1. Update hot code paths (`assets/js/app.js`, `assets/js/performance.js`, `assets/js/navigation.js`) to use `getCached` and centralize the requestAnimationFrame scheduling.
2. Batch DOM writes using DocumentFragment when rebuilding the form to avoid layout thrash.
3. Memoize expensive formatters (toLocaleString / toLocaleDateString) to avoid repeated work.
4. Move duplicated utility helpers (like `addDays`) into a single `assets/js/utils.js` and import them where needed.
5. Add linting and small unit tests for pure helpers (currency parsing, date helpers) to prevent regressions.

If you want, I can implement the RAF unification and the remaining hot-path changes next.

---

## Changelog

### 2026-06-03 — Form reset, progress bar, and theme toggle fixes

**Commits:** `1639208`, `04f51de`, `230a94f`

---

#### `assets/js/app.js` — Reset form no longer restores stale values

**Problem:** `resetForm()` called `renderForm({ applyDefaults: false })` without clearing the in-memory `preserved` object, so field values from the previous session were silently re-populated after the reset. It also forced `senderName` back to `DEFAULT_SENDER_NAME` instead of leaving it blank.

**Fix:**
- `resetForm()` now clears the `preserved` map before re-rendering: `Object.keys(preserved).forEach((key) => delete preserved[key])`.
- `senderName` is now set to `''` (empty string) on reset instead of the hardcoded default.
- `renderForm()` gained two new options flags — `setDefaultDeadline` and `preserveValues` — so reset can skip both deadline injection and value restoration in a single call: `renderForm({ applyDefaults: false, setDefaultDeadline: false, preserveValues: false })`.
- `savePreserved()` was given an optional `id` argument so callers can update a single field without iterating all shared IDs.

---

#### `assets/js/app.js` + `index.html` + `assets/css/styles.css` — Form completion progress bar added

**Problem:** Users had no visual feedback about which required fields were still missing before hitting Generate.

**Fix:**
- New `updateProgressBar()` function in `app.js` counts all `[data-required="true"]` elements plus `senderName`, computes a percentage, and drives a `<div id="formProgressBar">` element. The bar turns green when all fields are complete. It is only shown for `gas` and `streetlight` claim types; all other types hide it.
- `updateProgressBar()` is called at the end of both `schedulePreviewUpdate()` (on every `input` event) and `renderForm()` (on every tab switch or type change).
- Progress bar markup added to `index.html` (`#formProgress`, `#formProgressBar`, `#formProgressText`).
- CSS classes added to `styles.css`: `.form-progress`, `.form-progress-header`, `.form-progress-track`, `.form-progress-bar`, `.form-progress-bar.complete`, and a dark-mode override for the track.

---

#### `assets/js/navigation.js` + `assets/js/settlement.js` — Settlement calculator reset button

**Problem:** There was no way to clear the settlement panel fields and outputs without reloading the page.

**Fix:**
- A Reset button was added to the settlement panel HTML in `navigation.js` (`ensureSettlementPanel()`), wired to `onclick="resetSettlementCalculator()"`.
- `resetSettlementCalculator()` was added to `settlement.js`. It clears `settlementTotalCost`, `settlementReductionPercent`, and the expiration checkbox, resets the output text fields (`settlementReductionAmount`, `settlementOfferAmount`, `settlementStatement`) to their default display values, and hides the warning box. All DOM lookups are guarded with null checks.

---

#### `assets/js/ui.js` + `index.html` + `assets/css/topbar.css` — Theme toggle icon replaced with SVG

**Problem:** The dark/light mode toggle button used a bare `☀` Unicode character for both states — the moon state was never rendered, and the icon looked inconsistent across platforms.

**Fix:**
- `applyTheme()` in `ui.js` now injects inline SVG: a sun icon (Feather-style, 8-ray) when in dark mode, and a crescent moon icon when in light mode. The initial button state in `index.html` was also updated to the moon SVG.
- A spin-in `@keyframes theme-icon-in` animation was added to `topbar.css` so the icon rotates into view on each theme toggle.

---

### Known remaining issues (not yet fixed)

| Location | Issue |
|---|---|
| `navigation.js:52–86` | Settlement panel inline `oninput`/`onclick` handlers fire before `settlement.js` finishes loading — race condition if script order changes |
| `app.js:167` | `querySelector` with an interpolated value — fragile if option values ever become dynamic |
| `app.js` + `performance.js` | Two independent rAF trackers; the performance wrapper is bypassed when `schedulePreviewUpdate` calls `updatePreview()` directly by name |
| `settlement.js:7` | `addDays()` is duplicated from `app.js` — should be extracted to a shared `utils.js` |
| `index.html:58` | `value="Kevin"` is hardcoded in HTML and separately in JS — no single source of truth |
| `settlement.js:37–38` | `calculateSettlement()` accesses DOM elements without null checks (unlike the new `resetSettlementCalculator()`) |

---

## Recent Fixes (2026-06-03) — XSS sinks, clipboard error handling, dead listener

### `assets/js/app.js` — Replaced `innerHTML` with `textContent` in `buildSelectField()` and `buildInputField()`

**Problem:** Both functions set `label.innerHTML` to a template string that concatenated `field.label` with a hard-coded HTML snippet for the required asterisk (`<span style="color:var(--red)">*</span>`). If `field.label` ever contained user-controlled or externally-sourced content, this was a direct XSS sink.

**Fix:** `label.textContent = field.label` sets the label text safely. When the field is required, an `<span>` element is created programmatically (`document.createElement('span')`), its `style.color` and `textContent` are set directly, and it is appended to the label via `label.appendChild(asterisk)`. No HTML string is parsed.

---

### `assets/js/app.js` — Added `.catch()` handlers to `copySubject()` and `copyEmail()`

**Problem:** Both functions called `navigator.clipboard.writeText(...).then(...)` with no `.catch()`. A rejected promise (clipboard permission denied, insecure context, etc.) would produce an unhandled promise rejection and silently fail with no diagnostic output.

**Fix:** Each call now chains `.catch((err) => console.error('Failed to copy subject:', err))` and `.catch((err) => console.error('Failed to copy email body:', err))` respectively, so failures surface in the console.

---

### `assets/js/navigation.js` — Replaced `innerHTML` with explicit DOM construction in `updateSelectedTemplateIndicator()`

**Problem:** The function set `indicator.innerHTML = \`<span>Selected Template</span><strong>${selectedLabel}</strong>\``. The `selectedLabel` value comes from `getTemplateLabel(value)`, where `value` is the currently selected template key. If that value were attacker-controlled, the interpolation was a direct XSS sink.

**Fix:** A `<span>` and a `<strong>` element are now created with `document.createElement`, their text is set via `textContent`, and `indicator.replaceChildren(labelSpan, valueStrong)` replaces the previous content atomically. No HTML string is parsed.

---

### `assets/js/settlement.js` — Removed dead `DOMContentLoaded` listener

**Problem:** The last line of the file was `document.addEventListener("DOMContentLoaded", calculateSettlement)`. Because `settlement.js` is loaded lazily (injected into the DOM after `DOMContentLoaded` has already fired), this listener could never trigger. It was dead code that created a false impression that `calculateSettlement` ran on page load.

**Fix:** The listener was removed. `calculateSettlement` is already called through the settlement panel's inline `oninput` handlers wired in `navigation.js`.

---

### `assets/js/settlement.js` — Added `.catch()` handler to `copySettlementStatement()`

**Problem:** `copySettlementStatement()` called `navigator.clipboard.writeText(...).then(...)` with no `.catch()`. A clipboard failure produced an unhandled promise rejection.

**Fix:** `.catch((err) => console.error('Failed to copy:', err))` is now chained onto the clipboard write, matching the pattern applied to `copySubject()` and `copyEmail()` in `app.js`.

---

### Known remaining issues (not yet fixed)

| Location | Issue |
|---|---|
| `navigation.js:52–86` | Settlement panel inline `oninput`/`onclick` handlers fire before `settlement.js` finishes loading — race condition if script load order changes |
| `app.js:167` | `querySelector` with an interpolated value — fragile if option values ever become dynamic |
| `app.js` + `performance.js` | Two independent rAF trackers; the performance wrapper is bypassed by the direct `updatePreview()` call inside `schedulePreviewUpdate` |
| `settlement.js:7` | `addDays()` duplicated from `app.js` — should be extracted to a shared `utils.js` |
| `index.html:58` | `value="Kevin"` hardcoded in both HTML and JS — no single source of truth |
| `settlement.js:37–38` | `calculateSettlement()` accesses DOM elements without null checks |

---

## Recent Fixes (2026-06-03) — Settlement input sanitization and expiration checkbox default

### `assets/js/settlement.js` — Formatted currency strings now parsed correctly in `calculateSettlement()`

**Problem:** `calculateSettlement()` passed `totalCostInput.value` and `reductionInput.value` directly to `Number.parseFloat()`. When a user typed or pasted a formatted value such as `"10,000"` or `"$10,000"`, `parseFloat` stopped at the first non-numeric character and returned `10`. All downstream calculations (reduction amount, offer amount, statement text) were then computed from `10` instead of `10000` — wrong by a factor of 1,000 with no warning shown.

**Fix:** Both values are now sanitized with `.replace(/[^0-9.]/g, '')` before being passed to `parseFloat`:
```js
const totalCost = Number.parseFloat((totalCostInput.value || "0").replace(/[^0-9.]/g, ''));
const reductionPercent = Number.parseFloat((reductionInput.value || "0").replace(/[^0-9.]/g, ''));
```
Commas, dollar signs, and any other non-numeric characters (except `.`) are stripped first, so `"$10,000"` correctly parses as `10000`.

---

### `assets/js/navigation.js` — Expiration checkbox no longer defaults to checked in `ensureSettlementPanel()`

**Problem:** The `#includeSettlementExpiration` checkbox in the settlement panel HTML was rendered with the `checked` attribute, so it was on by default. This caused the 7-day expiration clause to appear in the generated statement as soon as the panel loaded, before the user had entered any values or made a deliberate choice.

**Fix:** The `checked` attribute was removed from the checkbox input:
```html
<!-- before -->
<input type="checkbox" id="includeSettlementExpiration" checked onchange="calculateSettlement()" />
<!-- after -->
<input type="checkbox" id="includeSettlementExpiration" onchange="calculateSettlement()" />
```
The expiration clause now only appears when the user explicitly checks the box.
