# Architecture

Viewoupe is a single-browser-core project. The same core is intended to support three delivery forms over time: direct script embed, package distribution, and a browser-extension content script.

## Runtime model

1. The page loads `viewoupe.js`.
2. Viewoupe watches pointer movement, selection, keyboard input, and scroll intent.
3. A small `VL` activator is shown only when a readable target is available.
4. User activation clones the target into an isolated reading layer.
5. The clone is sanitized before insertion.
6. Reading controls operate on the clone, not on the original page node.
7. Closing the layer returns the user to the untouched source page.

## Isolation

The UI is attached through Shadow DOM. This protects Viewoupe from host-page selectors such as global `button`, `p`, `code`, or `*` rules and prevents Viewoupe styling from leaking back into the page.

The full-screen host itself uses `pointer-events: none`; only the activator and reading layer opt back into pointer interaction.

## Target model

Default readable targets include paragraphs, list items, blockquotes, preformatted code, table cells, captions, and headings. Parent heuristics deliberately avoid broad structural containers such as `body`, `main`, `article`, `section`, navigation, headers, and footers unless Article mode is explicitly requested.

## Clone sanitization

The reading clone removes active or page-specific elements such as scripts, styles, frames, forms, interactive inputs, video, canvas, and SVG. Event-handler attributes, ids, classes, and inline styles are removed. Links are preserved but open with `noopener noreferrer`.
## State

Runtime state is intentionally local to the page instance. Shelf items live only in memory and are reset on reload. There is no localStorage, account, cloud sync, or background service in 0.1.0.

## Typography

Zoom levels change actual font size and line height inside the reading layer. This creates natural reflow instead of enlarging a bitmap-like geometry with CSS transforms.

## Focus

Focus cycles through three states:

- normal — no page dimming;
- dim — page context remains visible but visually de-emphasized;
- isolate — page context is nearly hidden.

## Extension path

A browser extension should reuse the core rather than fork it. Extension-specific concerns such as permissions, injection, settings UI, site exclusions, and storage should sit outside `src/viewoupe.js` wherever possible.

## Non-goals for 0.1.0

- AI summarization or rewriting;
- cloud accounts or sync;
- persistent highlights;
- replacing native browser zoom;
- claiming full WCAG/accessibility conformance;
- becoming a general-purpose page editor.
