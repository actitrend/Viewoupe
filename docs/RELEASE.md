# Release checklist

Use this checklist before publishing a Viewoupe release.

## Code

- [ ] `npm run build`
- [ ] `npm run check`
- [ ] Main example works in current Chrome/Edge/Opera-family Chromium browser.
- [ ] Hostile-CSS example keeps the Viewoupe UI isolated.
- [ ] `VL` appears for paragraph, selection, and code targets.
- [ ] `Esc` always closes the reading layer.
- [ ] A− / A+, Focus, Article, Copy, and Shelf work.
- [ ] Scrolling does not leave stale activators on screen.

## Privacy and behavior

- [ ] No unexpected network requests.
- [ ] No persistent storage unless documented and intentionally added.
- [ ] No page text mutation introduced by the reading layer.
- [ ] Any new permission or remote service is documented before release.

## Documentation

- [ ] Version updated in `package.json` and `src/viewoupe.js`.
- [ ] `CHANGELOG.md` updated.
- [ ] README examples match the current API.
- [ ] `dist/viewoupe.js` rebuilt from `src/viewoupe.js`.

## Public release

- [ ] Re-check exact project-name collisions in npm, GitHub, browser stores, and the web.
- [ ] Treat trademark clearance as a separate legal check; a web search is not legal clearance.
- [ ] Add final repository URL to package metadata after the repository exists.
- [ ] Create release tag using semantic versioning.
- [ ] Attach a short GIF/video showing: page → VL → A+ → Focus → selection → Shelf → Esc.
- [ ] Test on a broader set of real external sites before calling behavior stable.
