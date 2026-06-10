# Claims Generator v2026-06-10 - Stable

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

- `updateSelectedTemplateIndicator(value)`: rewrote the function to build the indicator element using DOM methods (`createElement`, `textContent`, `append`) instead of `innerHTML`. This removes a class of XSS risk from template label values being written directly as HTML.
- `handleClaimTypeChange()`: the `.catch()` on `ensureSettlementScriptLoaded()` previously swallowed the error silently. It now calls `alert('Failed to load the Settlement Calculator. Please refresh the page and try again.')`.

**`index.html`**

- Removed the hardcoded `value="Kevin"` attribute from the sender name `<input>`. The sender name is now populated exclusively from `localStorage` via `getSavedDefaults()` on `DOMContentLoaded`, falling back to the `DEFAULT_SENDER_NAME` constant defined in `app.js`. The input retains `placeholder="e.g. Kevin"` for display guidance only.
