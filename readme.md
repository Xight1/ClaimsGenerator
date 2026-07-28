# Claims Generator v2026-07-28 - Beta

A small static web app for generating claim email text and subjects.

## Overview

This repository contains a lightweight single-page application that helps build and preview claim-related emails (subject and body) based on several templates (Gas Claim, Streetlight, Escalation, Payment, Follow Up, Insurance, Settlement, Demand Request).

## Expected file structure

```
index.html
assets/
  css/
  js/
netlify.toml
```

---

## Recent Changes (2026-06-16) — Claim number auto-uppercase

### `assets/js/app.js` — New `getClaimValue()` helper forces uppercase on all claim number fields

Claim number fields (`clientClaim`, `tccClaim`, `insuranceClaim`) are now always uppercased in generated subjects and email bodies, regardless of how the user types them. A new `getClaimValue(id)` helper retrieves the field value and calls `.toUpperCase()` before returning it (falling back to the `[fill in]` placeholder when empty). The three claim number lookups in `composeEmail()` were updated to use this helper instead of `getValue()`. The Demand Request template's `demandClaimRef` field already applied `.toUpperCase()` inline and is unchanged.

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

### 2026-06-25 — Removed attachments feature; fixed post-removal crash in `navigation.js`; fixed stale DOM cache entries in `config.js`

---

#### `index.html` + `assets/js/app.js` + `assets/css/styles.css` — Attachments / Send to Outlook panel removed

**What changed:** The `#attachmentPanel` div and all supporting code were removed.

- `index.html`: the entire `#attachmentPanel` block (file inputs, New Email / Reply mode toggle, Send to Outlook button) was deleted.
- `app.js`: removed the `newEmailFiles` and `replyFiles` arrays, and the functions `handleEmailModeChange()`, `handleNewEmailFilesChange()`, `renderNewEmailFileList()`, `handleReplyFilesChange()`, `renderReplyFileList()`, `sanitizeFilename()`, `readFileAsBase64()`, `chunkBase64()`, and `downloadEml()`.
- `styles.css`: removed approximately 195 lines of attachment-related CSS (`.attachment-panel`, `.attach-file-*`, `.attach-mode-label`, `.attach-reply-note`, `.attach-delete-btn`, and their dark-mode variants).

**Why:** The feature was removed to simplify the app. Dead UI, logic, and styles were cleaned up in the same pass.

**Status:** Complete.

---

#### `assets/js/navigation.js` lines 161–164 — `ReferenceError` crash on every claim-type switch

**What changed:** Four lines were removed from `handleClaimTypeChange()`:

```js
newEmailFiles.length = 0;
replyFiles.length = 0;
renderNewEmailFileList();
renderReplyFileList();
```

**Why:** After the attachment feature was deleted from `app.js`, `handleClaimTypeChange()` still referenced `newEmailFiles`, `replyFiles`, `renderNewEmailFileList`, and `renderReplyFileList` — none of which existed anymore. Every claim-type switch threw a `ReferenceError` at runtime, breaking the core tab-switching flow.

**Status:** Fixed.

---

#### `assets/js/config.js` — Stale IDs in `cacheDOM()` caused `showToast()` to silently no-op

**What changed:** Two element IDs — `toastNotification` and `settlementClaimType` — were removed from the ID list passed to `cacheDOM()`.

**Why:** Neither element exists in `index.html`. `toastNotification` was the most consequential: `showToast()` retrieved the element via `getCached('toastNotification')`, got `null`, and returned without displaying anything. Every toast call in the app was silently suppressed. `settlementClaimType` was a stale reference with no active call sites.

**Status:** Fixed.

---

### 2026-06-16 — Demand Request template added

#### `index.html` — New button and select option

**What changed:** A "Demand Request" button was added to the topbar nav (after the Follow Up button). A matching `<option value="demand">Demand Request</option>` was added to the `#claimType` select.

**Why:** The Demand Request workflow was previously handled outside the app. Adding it as a template brings it in line with the other internal request types.

**Status:** Complete.

---

#### `assets/js/app.js` — Demand type fields, validation, and email composition

**What changed:**

- Sender name field is hidden and skipped during validation when `claimType` is `demand`, matching the existing pattern used by `payment` and `followup`.
- The `demand` form renders a Claim Reference section reusing the shared `claimNumberRow` (Client Claim # and TCC Claim # fields), followed by a Request Type `<select>` with two options: "Demand Needed" and "Balance Adjustment".
- Email subject is built as `{claimRef} - {requestType}`. The claim reference portion handles all three states: both claim numbers present, one present, or neither (in which case the subject is just the request type).
- Email body opens with an auto time-of-day greeting ("Good Morning / Afternoon / Evening") and reads: "I am requesting the demand for the above referenced claim. Please advise if you have any questions."

**Why:** Provides a consistent, repeatable format for internal demand requests without requiring the user to compose the subject line or greeting manually.

**Status:** Complete.

---

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
| ~~`navigation.js:52–86`~~ | ~~Settlement panel inline `oninput`/`onclick` handlers fire before `settlement.js` finishes loading — race condition if script order changes~~ — **Fixed 2026-06-03** |
| ~~`app.js:167`~~ | ~~`querySelector` with an interpolated value — fragile if option values ever become dynamic~~ — **Fixed 2026-06-03** |
| `app.js` + `performance.js` | Two independent rAF trackers; the performance wrapper is bypassed when `schedulePreviewUpdate` calls `updatePreview()` directly by name |
| ~~`settlement.js:7`~~ | ~~`addDays()` is duplicated from `app.js` — should be extracted to a shared `utils.js`~~ — **Fixed 2026-06-03** |
| ~~`index.html:58`~~ | ~~`value="Kevin"` is hardcoded in HTML and separately in JS — no single source of truth~~ — **Fixed 2026-06-03** |
| ~~`settlement.js:37–38`~~ | ~~`calculateSettlement()` accesses DOM elements without null checks (unlike the new `resetSettlementCalculator()`)~~ — **Fixed 2026-06-03** |

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
| ~~`navigation.js:52–86`~~ | ~~Settlement panel inline `oninput`/`onclick` handlers fire before `settlement.js` finishes loading — race condition if script load order changes~~ — **Fixed 2026-06-03** |
| ~~`app.js:167`~~ | ~~`querySelector` with an interpolated value — fragile if option values ever become dynamic~~ — **Fixed 2026-06-03** |
| `app.js` + `performance.js` | Two independent rAF trackers; the performance wrapper is bypassed by the direct `updatePreview()` call inside `schedulePreviewUpdate` |
| ~~`settlement.js:7`~~ | ~~`addDays()` duplicated from `app.js` — should be extracted to a shared `utils.js`~~ — **Fixed 2026-06-03** |
| ~~`index.html:58`~~ | ~~`value="Kevin"` hardcoded in both HTML and JS — no single source of truth~~ — **Fixed 2026-06-03** |
| ~~`settlement.js:37–38`~~ | ~~`calculateSettlement()` accesses DOM elements without null checks~~ — **Fixed 2026-06-03** |

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

---

## Recent Fixes (2026-06-03) — Settlement race condition, selector safety, negative input handling, and duplicate utility removal

### `assets/js/navigation.js` — Inline event handlers removed from settlement panel; listeners attached programmatically after script load

**Problem:** The settlement panel HTML in `ensureSettlementPanel()` used inline `oninput="calculateSettlement()"`, `onchange="calculateSettlement()"`, and `onclick="resetSettlementCalculator()"` / `onclick="copySettlementStatement()"` attributes. Because `settlement.js` is loaded lazily, these handlers fired as soon as the user interacted with the panel, before the script had necessarily finished loading — producing a `ReferenceError` if the load was slow. The reset and copy buttons had no `id`, making them hard to target programmatically.

**Fix:**
- All four inline handler attributes (`oninput`, `onchange`, `onclick` × 2) were removed from the HTML.
- `id="resetSettlementBtn"` and `id="copySettlementBtn"` were added to the reset and copy buttons.
- Inside the `.then()` callback of `ensureSettlementScriptLoaded()` in `handleClaimTypeChange()`, all five listeners are now attached programmatically: `input` on `#settlementTotalCost` and `#settlementReductionPercent`, `change` on `#includeSettlementExpiration`, `click` on `#resetSettlementBtn` and `#copySettlementBtn`.
- A `dataset.listenersAttached` guard on `#settlementTotalCost` prevents duplicate listener registration if the settlement panel is toggled more than once.
- Each element reference is null-checked before the listener is attached.

---

### `assets/js/app.js` — `querySelector` with interpolated value replaced in `getTemplateName()`

**Problem:** `getTemplateName(type)` called `document.querySelector(\`#claimType option[value="${type}"]\`)`. If `type` contained characters that are special in CSS selector syntax (quotes, brackets, etc.), the selector would throw or return a wrong result.

**Fix:** The lookup now uses `Array.from(select.options).find((opt) => opt.value === type)` after retrieving the `<select>` element via `getElementById`. String comparison is used instead of CSS selector interpolation, so no special characters in `type` can affect the result.

---

### `assets/js/settlement.js` — Negative inputs now display `"Invalid input"` and return early in `calculateSettlement()`

**Problem:** When `totalCost` or `reductionPercent` parsed to a negative number (e.g. the user typed `"-5"`), the validation check `>= 0` failed and the fallback clamped the value to `0`, silently treating a negative entry as zero. No error was surfaced to the user.

**Fix:** The sentinel for an invalid value was changed from `0` to `-1`. If either parsed value is `< 0`, `reductionAmountOutput` and `offerAmountOutput` are both set to `"Invalid input"` and the function returns early before touching any other outputs.

---

### `assets/js/settlement.js` — Reduction percentage clamped to 100% in `calculateSettlement()`

**Problem:** There was no upper bound on `reductionPercent`. A value over 100 produced a negative `settlementOffer` (floored to `0` by `Math.max`), while the `reductionAmount` displayed to the user exceeded the total cost — an arithmetically inconsistent result.

**Fix:** `Math.min(validReduction, 100)` is applied before computing `reductionAmount`, so a percentage above 100 is treated as 100 and the offer floors at $0 without producing a misleading reduction amount.

---

### `assets/js/settlement.js` — Null guards added to all DOM output assignments in `calculateSettlement()`

**Problem:** `calculateSettlement()` wrote to `reductionAmountOutput`, `offerAmountOutput`, `statementOutput`, and `warningOutput` without checking whether those elements existed in the DOM. If any were missing (e.g. during a partial render or a future HTML change), the assignments would throw a `TypeError`.

**Fix:** Each assignment is now guarded: `if (reductionAmountOutput)`, `if (offerAmountOutput)`, `if (statementOutput)`, and `if (warningOutput)` wrap their respective writes, consistent with the pattern already used in `resetSettlementCalculator()`.

---

### `assets/js/settlement.js` — Duplicate `addDays()` removed

**Problem:** `settlement.js` defined its own `addDays(date, days)` function. An identical implementation already existed in `app.js` and was available in global scope at the time `settlement.js` runs. The duplicate created a maintenance risk: a fix to one copy would not be reflected in the other.

**Fix:** The local `addDays()` definition was removed from `settlement.js`. All call sites inside `settlement.js` now rely on the definition in `app.js`.

---

### `index.html` — Hardcoded `value="Kevin"` removed from `#senderName` input

**Problem:** The `#senderName` input had `value="Kevin"` in the HTML. The JS also set a default sender name on load, creating two sources of truth. If the HTML default and the JS default ever diverged, the displayed value would depend on which one applied last.

**Fix:** The `value="Kevin"` attribute was removed from the `<input>` element. The JS default on load is now the sole source of truth for the initial sender name value.

---

### Known remaining issues (not yet fixed)

| Location | Issue |
|---|---|
| `app.js` + `performance.js` | Two independent rAF trackers; the performance wrapper is bypassed by the direct `updatePreview()` call inside `schedulePreviewUpdate` |
| `addDays()` | Still lives only in `app.js` global scope — should be extracted to a shared `utils.js` so `settlement.js` has an explicit, non-global dependency |

---

## Recent Fixes (2026-06-03) — Settlement calculator robustness: guard rails, retry, and optional chaining

### `assets/js/navigation.js` — Eager `calculateSettlement()` call now guarded by non-empty input check

**Problem:** After attaching event listeners inside the `.then()` callback of `ensureSettlementScriptLoaded()`, `handleClaimTypeChange()` immediately called `calculateSettlement()` unconditionally. Every time the user switched to the Settlement tab — even with a blank form — this produced a `$0.00` statement that overwrote the placeholder text.

**Fix:** The unconditional `if (typeof calculateSettlement === 'function') calculateSettlement()` call was replaced with:
```js
if (totalCostInput && totalCostInput.value.trim() !== '') {
  calculateSettlement();
}
```
`calculateSettlement()` now only fires on tab entry if `#settlementTotalCost` already has a non-empty value, preserving the placeholder when the field is blank.

---

### `assets/js/navigation.js` — Silent `.catch(() => {})` replaced with console error logging

**Problem:** The `.catch()` handler on the `ensureSettlementScriptLoaded()` promise was `.catch(() => {})` — a no-op that swallowed all script load failures silently. If `settlement.js` failed to load (network error, 404, etc.), nothing appeared in the console.

**Fix:** The handler is now `.catch((err) => console.error('Settlement script load failed:', err))`, matching the error-surfacing pattern used elsewhere in the codebase.

---

### `assets/js/navigation.js` — `onerror` handler now resets load promise before rejecting

**Problem:** The `script.onerror` callback inside `ensureSettlementScriptLoaded()` called `reject()` but left `window.__claimsSettlementLoadPromise` pointing at the failed, rejected promise. Any subsequent tab visit would resolve to the same rejected promise instead of re-attempting the script load.

**Fix:** `window.__claimsSettlementLoadPromise = null` is now set before calling `reject()`:
```js
script.onerror = () => {
  window.__claimsSettlementLoadPromise = null;
  reject(new Error('Failed to load settlement.js'));
};
```
Clearing the cached promise allows the next call to `ensureSettlementScriptLoaded()` to create a fresh `<script>` tag and retry.

---

### `assets/js/navigation.js` — `data-listenersAttached` guard moved from `totalCostInput` to `settlementPanel`

**Problem:** The guard that prevented duplicate listener registration was stored on `totalCostInput.dataset.listenersAttached`. If the settlement panel element were ever rebuilt (e.g. by `ensureSettlementPanel()` re-running), `totalCostInput` would be a new DOM node without the flag, so all listeners would be re-attached to a fresh input while the old listeners remained on the discarded node.

**Fix:** The guard is now stored on `settlementPanel.dataset.listenersAttached` — the container element that `ensureSettlementPanel()` manages — so the flag travels with the panel rather than with an individual input.

---

### `assets/js/settlement.js` — `includeExpirationInput.checked` replaced with optional chaining in `calculateSettlement()`

**Problem:** `calculateSettlement()` accessed `includeExpirationInput.checked` without optional chaining. All other element references in the function used the `?.` operator, but this one did not. If `#includeSettlementExpiration` were absent from the DOM, this line would throw a `TypeError` rather than treating the checkbox as unchecked.

**Fix:** The access is now `includeExpirationInput?.checked`, consistent with the null-safe pattern used for the other element references in the same function.

---

## Recent Changes (2026-06-03) — Settlement input symbol decorators

### `assets/js/navigation.js` + `assets/css/styles.css` — Currency and percentage symbols added to settlement inputs

The two plain `<input>` elements in the settlement panel now render with inline symbol decorators.

- `#settlementTotalCost` is wrapped in `.input-symbol-wrap` with a `.input-prefix` span displaying `$`.
- `#settlementReductionPercent` is wrapped in `.input-symbol-wrap` with a `.input-suffix` span displaying `%`.

Three new CSS rules support the layout:

- `.input-symbol-wrap` — flex container with its own border, background, and `border-radius`. The inner `<input>` has its own border and box-shadow stripped so the wrapper acts as the single visible field boundary.
- `.input-symbol-wrap:focus-within` — applies the standard blue border and box-shadow ring when the inner input is focused, matching the app's existing focus style.
- `.input-prefix` / `.input-suffix` — muted, bold, non-selectable labels with asymmetric padding to sit flush against the input text.

---

### `assets/js/navigation.js` — `settlementOriginalAmount` output line added to Settlement Summary

The `.subject-box` in the settlement preview panel now includes an `Original Amount` line above the existing `Reduction Amount` line:

```html
Original Amount: <span id="settlementOriginalAmount">—</span>
```

The span renders `—` on load and before any calculation runs.

---

### `assets/js/settlement.js` — `calculateSettlement()` populates `settlementOriginalAmount`; `resetSettlementCalculator()` resets it

- In `calculateSettlement()`, after `validTotal` is determined, `#settlementOriginalAmount` is set to `validTotal` formatted as USD currency via `toLocaleString('en-US', { style: 'currency', currency: 'USD' })`.
- In `resetSettlementCalculator()`, `#settlementOriginalAmount` is reset to `"—"`, matching the initial placeholder state. Both DOM lookups are null-guarded.

---

## Recent Changes (2026-06-04) — Attachments panel with New Email and Reply modes

### `index.html` + `assets/js/app.js` + `assets/css/styles.css` — Attachments panel added below the email preview

A new `#attachmentPanel` section was added beneath the Copy Body button in the email preview area. It contains a mode toggle and two mutually exclusive sub-sections.

**Mode toggle**

A radio-button pair (`New Email` / `Reply`) sits in `.attachment-mode-toggle` above the panel body. `handleEmailModeChange()` reads the checked value and shows `#attachNewEmail` or `#attachReply`, hiding the other.

**New Email mode (`#attachNewEmail`)**

- A `<input type="file" multiple>` (`#newEmailFiles`) lets the user select any number of files. `handleNewEmailFilesChange()` renders the selected filenames in `#newEmailFileList` as `.attach-file-item` rows.
- A `Download .eml` button calls `downloadEml()`, which assembles a complete RFC 2822 `multipart/mixed` .eml file:
  - Subject encoded as RFC 2047 base64: `=?UTF-8?B?…?=`
  - `To:` header populated from the `recipient` or `followUpRecipient` field when available
  - Body part uses `Content-Transfer-Encoding: 8bit`
  - Each attachment is read via `FileReader.readAsDataURL`, base64-extracted, chunked to 76-character lines (`chunkBase64()`), and written as a MIME part with `Content-Type` taken from `file.type` (falls back to `application/octet-stream`) and `Content-Disposition: attachment; filename="…"` sanitized by `sanitizeFilename()`
  - Download is blocked with a feedback message if the email has not been generated yet
  - Files that fail to read are skipped with a warning shown via `showCopyFeedback()`; successfully attached files proceed normally
  - The resulting `Blob` is downloaded with the subject (sanitized) as the filename and the `.eml` extension

**Reply mode (`#attachReply`)**

- Displays an instruction note (`attach-reply-note`) telling the user to paste the generated body into their Outlook reply and attach the files manually.
- A separate `<input type="file" multiple>` (`#replyFiles`) renders the selected filenames in `#replyFileList` via `handleReplyFilesChange()` — the same display-only pattern as New Email mode. No .eml is generated in this mode.

**Helpers added to `app.js`**

| Function | Purpose |
|---|---|
| `handleEmailModeChange()` | Switches visible sub-section based on checked radio |
| `handleNewEmailFilesChange()` | Renders filename list for New Email file input |
| `handleReplyFilesChange()` | Renders filename list for Reply file input |
| `sanitizeFilename(str)` | Strips filesystem-unsafe characters, collapses whitespace to underscores, trims to 120 chars |
| `readFileAsBase64(file)` | Returns a Promise that resolves to the raw base64 string (no data-URL prefix) |
| `chunkBase64(b64, lineLength)` | Splits a base64 string into 76-char CRLF-terminated lines per MIME spec |
| `downloadEml()` | Assembles and triggers download of the complete .eml file |

**CSS (`assets/css/styles.css`)**

New classes cover the full panel: `.attachment-panel`, `.attachment-panel-header`, `.attachment-mode-toggle`, `.attach-mode-label` (with `:has(input:checked)` highlight), `.attach-file-label`, `.attach-file-input` (dashed border, hover/focus state), `.attach-file-item`, and `.attach-reply-note`. Full dark-mode overrides are included for all new elements.

---

## Recent Fixes (2026-06-04) — EML security, error feedback, and dark-mode polish

### `assets/js/app.js` — Recipient value sanitized before use in EML `To:` header

`recipientValue` is now passed through `.replace(/[\r\n]+/g, ' ')` before being written into the `To:` header. Without this, a newline embedded in the field value could inject additional MIME headers into the generated .eml file.

---

### `assets/js/app.js` — RFC 2822 `From:` and `Date:` headers added to .eml output

Two headers required by RFC 2822 were missing from the generated .eml:

- `From: Claims Generator <noreply>` is written as a static header.
- `Date:` is populated from `new Date().toUTCString()` at download time.

Both are inserted before the `To:` and `Subject:` headers.

---

### `assets/js/app.js` — `showCopyFeedback()` accepts an `isError` parameter

`showCopyFeedback(message, isError = false)` now accepts a second argument. When `isError` is `true`, the `feedback-error` class is added to `#copyFeedback` so the toast renders in red. The class is removed alongside `show` when the timeout expires.

Two call sites updated to pass `true`:

- The empty-state guard in `downloadEml()` ("Generate the email first.")
- The failed-attachment warning ("Warning: … could not be attached.")

---

### `assets/js/app.js` — EML body line endings normalized to CRLF

Before being written into the `text/plain` MIME part, `body` is now normalized with `.replace(/\r?\n/g, '\r\n')`. This ensures the body uses CRLF line endings as required by the MIME specification, regardless of the platform line endings in the generated text.

---

### `assets/js/navigation.js` — Settlement script load failure shows user-visible message

Previously the `.catch()` handler for `ensureSettlementScriptLoaded()` only logged to the console. It now also sets `#settlementStatement` to `'Calculator unavailable. Please reload the page.'` when the script fails to load, so the failure is visible in the UI rather than silent.

---

### `assets/css/styles.css` — Dark mode fix for mobile sticky action bar

Inside the `@media` block for the preview actions bar, a new rule sets the background of `.preview-actions` to `rgba(11, 17, 32, 0.96)` when `body.dark-mode` is active. Previously the bar rendered white in dark mode on mobile.

---

### `assets/css/styles.css` — Dark mode fixes for error-state inputs and validation banner

Two new rules applied under `body.dark-mode`:

- `input.error`, `textarea.error`, `select.error` — background `#450a0a`, border `#991b1b`.
- `#validationBanner` — background `#450a0a`, border `#991b1b`, text color `#fecaca`.

Error states and the validation banner were previously unstyled in dark mode, inheriting the light-mode red-light background.

---

### `assets/css/styles.css` — `.feedback-error` CSS class added

`#copyFeedback.feedback-error` sets `background: var(--red, #ef4444)`, overriding the default green toast background. This class is applied and removed programmatically by the updated `showCopyFeedback()`.

---

## Recent Fixes (2026-06-04) — Attached file reset, download guard, and From header

### `assets/js/app.js` + `assets/js/navigation.js` — Attached files cleared on form reset and claim type change

**Problem:** `resetForm()` and `handleClaimTypeChange()` re-rendered the form but left `newEmailFiles` and `replyFiles` arrays untouched. Files selected for a previous claim silently carried over into the next .eml download.

**Fix:** Both functions now set `newEmailFiles.length = 0` and `replyFiles.length = 0`, then call `renderNewEmailFileList()` and `renderReplyFileList()` to clear the displayed file lists. The arrays are emptied in place (`.length = 0`) so existing references remain valid.

---

### `assets/js/app.js` — `downloadEml()` download guard replaced with `[fill in]` token check

**Problem:** The guard that blocked .eml download when required fields were incomplete checked for the `empty-preview` CSS class on `#emailOutput`. That class was never present in practice, so the guard was dead code and downloads could proceed with an incomplete email body.

**Fix:** The class check is replaced with a token check on the body text itself:
```js
const body = $('emailOutput')?.innerText || '';
if (!body || body.includes('[fill in]')) {
  showCopyFeedback('Complete all fields before sending.', true);
  return;
}
```
Download is now blocked whenever the body is empty or contains a `[fill in]` placeholder, which is the marker left by unfilled required fields.

---

### `assets/js/app.js` — Invalid `From:` header corrected

**Problem:** The static `From:` header was written as `From: Claims Generator <noreply>`. The `<noreply>` address token is not a valid RFC 2822 address and would cause MIME parsing errors in strict mail clients.

**Fix:** The header is now `From: Claims Generator` — a display-name only, with no malformed address token.

---

## Recent Changes: Auto Case Normalization & Bug Fixes (2026-06-10)

### New feature: `normalizeCase(str)` — `assets/js/app.js`

A new `normalizeCase(str)` function was added. It is called inside `getValue()` and `getClientName()` before any field value is written into the generated email output.

Behavior:

- If the input string is entirely uppercase (e.g. `"JOHN SMITH"`, `"123 MAIN STREET"`), it is converted to title case (`"John Smith"`, `"123 Main Street"`).
- Strings that are already mixed case are returned unchanged — the function only acts when every letter in the string is uppercase.
- Strings that contain digits and no spaces (e.g. `CLM-12345`, `TCC-67890`) are left unchanged, because these are claim/ticket IDs where capitalization is meaningful.

This means users who paste or type all-caps text into name, address, or description fields will see normalized output in the email body and subject without needing to manually reformat.

### Bug fixes

**`assets/js/app.js`**

- `copySubject()` and `copyEmail()`: clipboard failures previously resolved silently. Both `.catch()` handlers now call `showCopyFeedback('Copy failed.')` so the user sees feedback on failure.
- `schedulePreviewUpdate()`: previously called `updatePreview()` directly, bypassing the optimized version registered by `performance.js`. Corrected to call `window.updatePreview()`, which resolves to the wrapped, diff-checking implementation when `performance.js` is loaded.

**`assets/js/performance.js`**

- Added a comment at the top of the file documenting that it must be loaded after `app.js`, since it wraps `window.updatePreview` and `window.saveDefaults` defined there.

**`assets/js/navigation.js`**

- `updateSelectedTemplateIndicator(value)`: rewrote the function to build the indicator element using DOM methods (`createElement`, `textContent`, `replaceChildren`) instead of `innerHTML`. This removes a class of XSS risk from template label values being written directly as HTML.
- `handleClaimTypeChange()`: the `.catch()` on `ensureSettlementScriptLoaded()` now logs to console and shows `'Calculator unavailable. Please reload the page.'` inline in the settlement statement element, replacing the previous silent swallow.

**`index.html`**

- Removed the hardcoded `value="Kevin"` attribute from the sender name `<input>`. The sender name is now populated exclusively from `localStorage` via `getSavedDefaults()` on `DOMContentLoaded`, falling back to the `DEFAULT_SENDER_NAME` constant defined in `app.js`.
