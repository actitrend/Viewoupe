# Viewoupe Memory

> **Read. Reduce. Recall.**

Viewoupe Memory is the optional local-first memory layer built on top of the existing Focus/Anchors interaction.

## Memory object

A saved memory belongs to one focused passage and contains:

- page URL and title;
- the passage text;
- 1–3 reader-selected anchors;
- one optional **In my words** sentence for the whole anchor set;
- creation/update timestamps;
- recall state and the next recall time.

The model deliberately avoids one note per anchor. Anchors are retrieval cues that work together as a semantic skeleton; **In my words** is the reader's own interpretation of the entire thought.

## Interaction

1. **Read** — open the passage in Viewoupe and isolate it with Focus/Deep.
2. **Reduce** — select up to three short anchors.
3. Optionally add **In my words** — preferably one sentence.
4. **Recall** — see only the anchors first and try to reconstruct the thought.
5. **Reveal** — compare with your own formulation and then the original passage.
6. Rate the recall as **Remembered**, **Partial**, or **Forgot**.

## Initial recall schedule

This prototype intentionally uses a simple schedule rather than a full spaced-repetition algorithm:

- Forgot → 1 day;
- Partial → 3 days;
- Remembered → 3 days, then 7 days, then 30 days.

This is a product prototype, not a claim that these intervals are universally optimal.

## Persistence and privacy

The prototype stores memories in `localStorage` under the current site origin. It does not require an account, server, analytics, or network request.

This limitation is intentional. Before a browser extension exists, persistence works only for pages served from the same origin as the Viewoupe demo. A future extension can move the same memory object into extension storage and attach it to arbitrary web pages.

## Reattachment

The first prototype restores anchors by matching saved anchor text inside the saved passage. A production-grade browser extension should use a more robust selector model:

- exact quote;
- prefix/suffix context;
- normalized text matching;
- approximate/fuzzy fallback;
- detached-memory state when the source can no longer be located reliably.

## Optional module

Core Viewoupe remains dependency-free and non-persistent. Memory is loaded separately:

```html
<script src="/dist/viewoupe.js" data-viewoupe></script>
<script src="/dist/viewoupe-memory.js"></script>
```

This keeps the original reading layer small while the memory workflow is validated.