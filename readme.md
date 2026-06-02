# Claims Generator v2026-06-01 beta 26

This version includes the API based AI Case Review section.

## Required environment variable

Add this in Netlify before testing the AI section:

```
OPENAI_API_KEY
```

Optional model override:

```
OPENAI_MODEL
```

Default model: `gpt-4.1-mini`

## Important deployment note

The AI Case Review section requires the Netlify Function located at:

```
netlify/functions/analyze-case.js
```

For the function to work, deploy through a connected GitHub repository or the Netlify CLI. A basic drag and drop static deploy may publish `index.html` but not activate the serverless function.

## Expected file structure

```
index.html
netlify.toml
netlify/functions/analyze-case.js
netlify_deploy_readme.md
```

## File structure note

As of beta 26, the app is split into smaller files under `assets/` so future GitHub updates can be pushed without replacing one large `index.html` file.

---

## Recent Changes: Performance & DOM Cache (2026-06-02)

To improve runtime responsiveness and reduce redundant DOM lookups, a small DOM caching helper was added to `assets/js/config.js`.

What was added

- A lightweight DOM cache populated on `DOMContentLoaded` with frequently used element IDs (subjectOutput, emailOutput, formContainer, senderName, claimType, and others).
- Two small helpers exposed on `window`: `cacheDOM(ids)` and `getCached(id)`.

Why this helps

- Repeated calls to `document.getElementById` are avoided in hot code paths, which reduces lookup overhead and improves responsiveness when the preview updates frequently while typing.

How to use it

Replace direct DOM lookups in hot paths with `getCached('elementId')`. For example:

- Before: `const subjectEl = document.getElementById('subjectOutput');`
- After:  `const subjectEl = getCached('subjectOutput');`

Next recommended changes (planned)

1. Update hot code paths (`assets/js/app.js`, `assets/js/performance.js`, `assets/js/navigation.js`) to use `getCached` and centralize the requestAnimationFrame scheduling.
2. Batch DOM writes using DocumentFragment when rebuilding the form to avoid layout thrash.
3. Memoize expensive formatters (toLocaleString / toLocaleDateString) to avoid repeated work.
4. Move duplicated utility helpers (like `addDays`) into a single `assets/js/utils.js` and import them where needed.
5. Add linting and small unit tests for pure helpers (currency parsing, date helpers) to prevent regressions.

If you want, I can update the code to use `getCached` across the hot paths and unify the RAF scheduler in the next change; tell me and I will prepare the patch and push it.
