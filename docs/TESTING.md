# Testing guide

Viewoupe is interaction-heavy, so manual browser testing is part of every release.

## Required local pages

- `/` — normal long-form reading page with paragraphs, inline formatting, code, and long JSON.
- `/examples/hostile-css.html` — aggressive global CSS to verify Shadow DOM isolation.

## Core interaction matrix

For each target type below, verify `VL` placement, open, zoom, Focus, Copy, Shelf, and Esc close:

- paragraph;
- heading;
- list item;
- blockquote;
- preformatted code;
- selected text;
- Article mode.

## Scroll behavior

- Trackpad/wheel scrolling hides stale `VL` markers.
- `VL` does not flash repeatedly while scrolling.
- Closing Viewoupe keeps the original page position.
- Scrolling inside the Viewoupe reading layer does not accidentally close it.

## Visual behavior

- `VL` remains discoverable on both light and dark page regions.
- Host-page global button styles do not affect Viewoupe buttons.
- The close button is visually easy to locate and has a red hover affordance.
- Long code/text wraps or scrolls without breaking the toolbar.

## External-site pass

Before a stable release, run the same checks on a varied set of public sites: news/article pages, documentation, forums, code-heavy pages, tables, and pages with unusual CSS. Record failures by URL and target type.
