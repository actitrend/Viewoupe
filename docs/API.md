# API

Viewoupe exposes one browser global: `window.Viewoupe`.

## Version

```js
Viewoupe.version
```

Returns the current public version string.

## Initialize

```js
Viewoupe.init(options)
```

Calling `init()` more than once is safe; an already enabled instance is returned.

Supported options in 0.1.0:

- `selector` — readable element selector.
- `minTextLength` — minimum text length for a direct readable target.
- `zoomLevels` — ordered numeric font-scale levels.
- `hoverDelay` — delay before showing the `VL` trigger.
- `leaveDelay` — grace period before hiding the trigger.
- `scrollCooldown` — time to suppress the trigger after scroll intent.
- `dimOpacity` — backdrop opacity for dim focus.
- `isolateOpacity` — backdrop opacity for isolate focus.

## Core methods

```js
Viewoupe.open(element)
Viewoupe.close()
Viewoupe.focus()
Viewoupe.article()
Viewoupe.zoom(level)
Viewoupe.destroy()
```
## Shelf API

```js
Viewoupe.shelf.items()
Viewoupe.shelf.add()
Viewoupe.shelf.clear()
Viewoupe.shelf.copy()
```

`items()` returns copies of the current in-memory Shelf items. Shelf state is not persisted across page reloads in 0.1.0.

## Automatic initialization

Add the `data-viewoupe` attribute to the script tag:

```html
<script src="/path/to/viewoupe.js" data-viewoupe></script>
```

Without `data-viewoupe`, call `Viewoupe.init()` manually after the script has loaded.
