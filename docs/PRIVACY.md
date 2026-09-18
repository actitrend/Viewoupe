# Privacy

This document describes the baseline privacy behavior of Viewoupe 0.1.0.

## Data processing

Viewoupe processes the selected reading target locally in the current browser page. The reading clone, focus state, zoom state, and Shelf contents are handled in page memory.

## Network

Viewoupe 0.1.0 does not send page text, selections, Shelf items, URLs, or usage events to a Viewoupe server or third-party API.

## Accounts and analytics

Viewoupe 0.1.0 has no account system and includes no analytics or advertising SDK.

## Storage

Shelf contents are temporary and disappear when the page is reloaded. The baseline implementation does not use localStorage, IndexedDB, cookies, or cloud sync for Shelf data.

## Links

Links preserved inside the reading clone open with `noopener noreferrer`.

## Future features

If a future version adds persistent storage, synchronization, analytics, AI processing, or another remote service, that behavior should be documented separately and made explicit to the user before data is transmitted.
