# Contributing to Viewoupe

Viewoupe is intentionally small. Contributions should preserve its central interaction model: work with the text being read in place, without taking over the whole page.

## Before changing behavior

Open an issue for changes that affect interaction, privacy, persistence, keyboard shortcuts, browser-extension permissions, or external services.

Small bug fixes, browser compatibility fixes, documentation improvements, and test-page additions can usually go directly to a pull request.

## Development

```bash
npm run build
npm run check
npm run serve
```

Use the main example and the hostile-CSS example before submitting a change.

## Principles to preserve

- Do not modify the source page text to implement the reading layer.
- Prefer real typography/reflow over geometric scaling.
- Keep activation passive and user-controlled.
- Keep `Esc` reliable.
- Avoid dependencies unless they solve a clear problem that cannot be solved cleanly in the current small core.
- Do not add analytics, remote text processing, or persistent storage silently.
- Keep host-page CSS isolated from the Viewoupe interface.
