# Claims Generator v2026-06-01 beta 26

Claims Generator is a browser based claim workflow tool for generating consistent claim related email language and settlement wording. The app is designed for quick internal use, with template based workflows, live previews, dark mode, and copy tools for pasting into email clients.

## Current status

Beta 26 is the completed release package for the current app state. New functional or UI changes after this release should move to beta 27.

## Current workflows

The app currently supports the following workflow tabs:

1. Gas Claim
2. Streetlight Claim
3. Escalation
4. Payment Information
5. Follow Up
6. Insurance Adjuster
7. Settlement Calculator

The top navigation bar controls the active workflow. The visible Claim Type dropdown has been removed from the main form because the taskbar now handles workflow selection.

## Beta 26 changes

### Clipboard formatting

Beta 26 adds rich clipboard support through `assets/js/clipboard.js`.

The app now attempts to copy both:

```text
text/plain
text/html
```

This is intended to better preserve paragraph spacing when pasting generated email text or settlement language into applications such as Outlook, Gmail, Word, and Teams. If the browser does not support rich clipboard copying, the app falls back to plain text copying.

### Settlement copy update

The Settlement Calculator copy action now uses the same rich clipboard logic as the main email body copy action. This keeps settlement statement copying consistent with the rest of the app.

### Version update

The app version has been updated to:

```text
Claims Generator v2026-06-01 beta 26
```

## Main interface updates from recent beta releases

The current interface includes:

- Modern top taskbar navigation
- Active taskbar pill that follows the selected workflow
- Centered Claims Generator header
- Version badge below the app title
- Selected Template card in the header
- Selected template name centered under the Selected Template label
- Hidden internal claim type selector
- Red Reset button
- Blue primary copy buttons
- Floating dark mode toggle icon
- Dark mode styling for forms, previews, labels, and settlement output
- Settlement Calculator layout aligned with the same form and preview structure as the other workflows

## Settlement Calculator

The Settlement Calculator allows a user to enter:

- Total cost
- Percentage reduction
- Optional 7 day expiration language

The calculator displays:

- Reduction amount
- Settlement offer amount
- Settlement statement

If the reduction percentage is greater than 10%, the app displays a SIF authority warning.

## Copy behavior

Current copy actions:

- Copy Subject
- Copy Body
- Copy Settlement Statement

The body and settlement copy actions use rich clipboard formatting where supported. The subject copy remains plain text.

## File structure

Current primary file structure:

```text
index.html
README.md
assets/css/styles.css
assets/js/app.js
assets/js/clipboard.js
assets/js/config.js
assets/js/navigation.js
assets/js/performance.js
assets/js/settlement.js
assets/js/ui.js
```

## Deployment

This app is currently structured as a static browser app and can be deployed through Netlify from the connected GitHub repository.

Recommended deployment flow:

1. Push changes to the GitHub repository.
2. Allow Netlify to redeploy from the connected branch.
3. Open the deployed site after the build completes.
4. Verify the visible app version matches the latest beta number.
5. Test the affected workflow before using the release.

No OpenAI API key or Netlify serverless function is required for the current Beta 26 app state.

## Release workflow expectation

For future releases, a complete beta update should include:

1. Requested code or UI changes
2. Version number update
3. README update when behavior, structure, or workflow changes
4. Consistency review of affected files
5. Push to GitHub
6. Completion report with changed files and commit SHA

Unless marked as a final release, future changes after Beta 26 should increment to Beta 27.

## Recommended Beta 26 verification

After Netlify redeploys, test the following:

1. Confirm the visible version shows Beta 26.
2. Generate a Gas Claim email and copy the body.
3. Paste into Outlook or Gmail and verify paragraph spacing.
4. Open Settlement and generate settlement language.
5. Copy Settlement Statement and paste into Outlook or Gmail.
6. Confirm paragraph spacing is preserved as well as the receiving app allows.
7. Toggle dark mode and refresh the page.
8. Confirm navigation, selected template, and active taskbar pill stay synchronized.
