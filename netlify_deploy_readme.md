# Claims Generator v2026-06-01 beta 7

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

As of beta 7, the app is split into smaller files under `assets/` so future GitHub updates can be pushed without replacing one large `index.html` file.
