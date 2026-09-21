# Changelog

All notable public changes to Viewoupe will be documented here.

The project follows semantic versioning once public releases begin.

## [0.2.0] - 2026-09-21

### Added

- Three reader-selected memory anchors per focused passage.
- Focus cycle: `Focus → Deep → Anchors → Focus`; Anchors is skipped when empty.
- Anchors-only semantic skeleton that preserves the original spatial position of selected phrases.
- Slot hover emphasis and click-to-locate behavior.
- Click an anchor in Anchors mode to reveal its surrounding text block temporarily.
- Progressive return from Anchors: anchor neighborhoods first, then the full text.
- In-page-session restoration of anchors after close/reopen.
- 3.2-second anchor afterglow on close.
- Auto-dim on open by default.

### Changed

- Focus no longer cycles through an accidental no-dim state while the lens is open.
- Public API/package version bumped to `0.2.0`.

## [0.1.0] - 2026-09-18

First public-ready baseline.

### Added

- Passive `VL` activator for readable blocks and text selections.
- Local font enlargement with real reflow.
- Focus modes: normal, dim, isolate.
- Explicit Article mode.
- Copy current reading object.
- Temporary in-memory Shelf with add, remove, copy-all, and clear actions.
- Shadow DOM UI isolation from hostile page CSS.
- Selection-aware opening.
- Keyboard toggle with `Alt+L` and close with `Esc`.
- Soft activator glow for visibility on varied backgrounds.
- Red close-button affordance for faster visual discovery.

### Internal

- Standardized the Viewoupe public naming and `VL` trigger.
- Archived prototype patch scripts locally outside the publishable project surface.
- Added build, examples, documentation, and release metadata.
