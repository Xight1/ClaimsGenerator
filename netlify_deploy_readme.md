# Claims Generator v2026-06-01 beta 6

This version includes the API based AI Case Review section.

## Required environment variable

Add the following environment variable in Netlify:

```text
OPENAI_API_KEY
```

Optional:

```text
OPENAI_MODEL
```

If `OPENAI_MODEL` is not set, the function uses `gpt-4.1-mini` by default.

## Netlify deployment

Deploy this folder through GitHub connected to Netlify or through the Netlify CLI.

Expected structure:

```text
index.html
netlify.toml
netlify_deploy_readme.md
netlify/functions/analyze-case.js
```

The AI Case Review section will not work if the Netlify function is not deployed.

If the app shows a JSON or HTML parsing error, verify that `/.netlify/functions/analyze-case` is active.
