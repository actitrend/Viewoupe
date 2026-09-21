/*! Viewoupe 0.2.0 | MIT License | Zoom the text, not the page. */
(() => {
  'use strict';

  const DEFAULTS = {
    selector: 'p, li, blockquote, pre, dd, dt, figcaption, td, th, h1, h2, h3, h4, h5, h6',
    minTextLength: 24,
    zoomLevels: [1, 1.2, 1.4, 1.7, 2],
    hoverDelay: 180,
    leaveDelay: 850,
    scrollCooldown: 500,
    autoDim: true,
    dimOpacity: 0.72,
    isolateOpacity: 0.94,
  };

  const state = {
    config: { ...DEFAULTS },
    host: null,
    shadow: null,
    lens: null,
    content: null,
    toolbar: null,
    articleButton: null,
    backdrop: null,
    activator: null,
    shelfPanel: null,
    shelfList: null,
    shelf: [],
    anchors: [],
    anchorStrip: null,
    anchorFlashLayer: null,
    anchorMemory: new Map(),
    anchorKey: null,
    anchorContextTimer: null,
    anchorReturnTimer: null,
    target: null,
    hoverTarget: null,
    locked: false,
    focusMode: 0,
    zoomIndex: 2,
    hoverTimer: null,
    leaveTimer: null,
    lastSelectionText: '',
    scrollBlockedUntil: 0,
    enabled: false,
  };

  function createUI() {
    state.host = document.createElement('div');
    state.host.id = 'viewoupe-host';
    Object.assign(state.host.style, {
      position: 'fixed', inset: '0', zIndex: '2147483646',
      pointerEvents: 'none'
    });
    document.documentElement.appendChild(state.host);
    state.shadow = state.host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      :host { all: initial; }
      *, *::before, *::after { box-sizing: border-box; }
      .backdrop { position: fixed; inset: 0; background: rgba(12,16,22,0); transition: background .16s ease; pointer-events:none; }
      .activator { position:fixed; z-index:4; display:none; align-items:center; justify-content:center; min-width:34px; height:28px; padding:0 8px; border:1px solid rgba(76,102,140,.28); border-radius:999px; background:linear-gradient(180deg,#fff 0%,#eef4ff 100%); color:#23406b; box-shadow:0 4px 16px rgba(0,0,0,.16),0 0 12px rgba(120,160,255,.18); font:700 11px system-ui,-apple-system,Segoe UI,Arial,sans-serif; letter-spacing:.03em; cursor:pointer; pointer-events:auto; user-select:none; transition:background .16s ease,box-shadow .16s ease,transform .16s ease,color .16s ease,border-color .16s ease; }
      .activator:hover { background:linear-gradient(180deg,#fff 0%,#e5efff 100%); color:#17375f; border-color:rgba(76,102,140,.42); box-shadow:0 6px 18px rgba(0,0,0,.18),0 0 16px rgba(120,160,255,.30); transform:translateY(-1px); }
      .lens { position: fixed; left:50%; top:56px; transform:translateX(-50%); width:min(900px, calc(100vw - 48px)); max-height:calc(100vh - 112px); min-height:220px; overflow:auto; background:#fff; color:#15171a; border:1px solid rgba(0,0,0,.12); border-radius:18px; box-shadow:0 24px 80px rgba(0,0,0,.28); display:none; pointer-events:auto; font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif; }
      .toolbar { position:sticky; top:0; z-index:2; display:flex; flex-wrap:wrap; gap:6px; align-items:center; padding:8px 10px; background:rgba(250,250,250,.96); border-bottom:1px solid rgba(0,0,0,.08); backdrop-filter:blur(10px); }
      button { appearance:none; border:1px solid rgba(0,0,0,.12); background:#fff; color:#222; border-radius:9px; padding:6px 10px; font:600 13px system-ui,-apple-system,Segoe UI,Arial,sans-serif; cursor:pointer; }
      button:hover { background:#f0f2f5; }
      [hidden] { display:none !important; }
      [data-act="close"] { color:#b42318; border-color:rgba(180,35,24,.22); font-weight:800; }
      [data-act="close"]:hover { background:#fff0ef; color:#8f1d14; border-color:rgba(180,35,24,.38); }
      .spacer { flex:1; }
      .zoom-label { min-width:42px; text-align:center; font:600 12px system-ui,-apple-system,Segoe UI,Arial,sans-serif; opacity:.66; }
      .content { padding:26px 30px 30px; font-size:22.4px; line-height:1.58; max-width:38em; margin:0 auto; overflow-wrap:anywhere; }
      .content a { color:inherit; text-decoration:underline; }
      .content pre { white-space:pre-wrap; overflow-wrap:anywhere; background:#f5f6f8; padding:18px; border-radius:12px; font:500 .82em/1.5 ui-monospace,SFMono-Regular,Consolas,monospace; }
      .content code { font-family:ui-monospace,SFMono-Regular,Consolas,monospace; }
      .hint { font:500 12px system-ui,-apple-system,Segoe UI,Arial,sans-serif; opacity:.6; white-space:nowrap; }
      .shelf-group { display:inline-flex; align-items:center; gap:6px; margin-left:4px; padding-left:10px; border-left:1px solid rgba(0,0,0,.12); }
      .shelf-group button { background:#f4f7fa; border-color:rgba(75,95,120,.18); }
      .shelf-group button:hover { background:#eaf0f6; }
      .shelf-group .has-items { background:#e7f0ff; border-color:#b7c9e6; box-shadow:inset 0 0 0 1px rgba(80,115,165,.06); }
      .shelf-subtitle { margin-top:2px; color:#66717d; font:500 11px/1.35 system-ui,-apple-system,Segoe UI,Arial,sans-serif; }
      .shelf-panel { display:none; border-top:1px solid rgba(0,0,0,.08); border-bottom:1px solid rgba(0,0,0,.10); background:#eef1f4; box-shadow:inset 0 1px 0 rgba(255,255,255,.72); padding:12px 14px 14px; max-height:38vh; overflow:auto; }
      .shelf-head { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
      .shelf-title { font:700 13px system-ui,-apple-system,Segoe UI,Arial,sans-serif; }
      .shelf-actions { display:flex; gap:6px; }
      .shelf-list { display:grid; gap:8px; }
      .shelf-empty { padding:12px; opacity:.58; font:500 13px system-ui,-apple-system,Segoe UI,Arial,sans-serif; }
      .shelf-item { position:relative; background:#fff; border:1px solid rgba(0,0,0,.11); border-radius:10px; box-shadow:0 1px 2px rgba(0,0,0,.03); padding:10px 38px 10px 11px; }
      .shelf-text { white-space:pre-wrap; overflow-wrap:anywhere; max-height:5.4em; overflow:hidden; font:500 13px/1.45 system-ui,-apple-system,Segoe UI,Arial,sans-serif; }
      .shelf-meta { margin-top:6px; opacity:.52; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font:500 11px system-ui,-apple-system,Segoe UI,Arial,sans-serif; }
      .shelf-remove { position:absolute; right:7px; top:7px; min-width:27px; padding:4px 7px; }
      .anchor-strip { display:flex; gap:8px; align-items:center; padding:8px 14px; background:#f7f9fc; border-bottom:1px solid rgba(0,0,0,.08); }
      .anchor-slot { flex:1; min-width:0; padding:7px 10px; border:1px dashed rgba(73,96,128,.28); border-radius:999px; color:#6b7480; background:#fff; font:600 12px system-ui,-apple-system,Segoe UI,Arial,sans-serif; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; text-align:center; }
      .anchor-slot.has-anchor { border-style:solid; border-color:rgba(64,116,214,.34); color:#20385f; background:linear-gradient(180deg,#fff 0%,#eef4ff 100%); box-shadow:0 0 0 1px rgba(76,124,214,.04),0 4px 14px rgba(45,83,150,.08); cursor:pointer; }
      .anchor-slot.is-peeking { border-color:rgba(210,161,0,.52); box-shadow:0 0 0 2px rgba(241,196,15,.10),0 0 18px rgba(255,209,45,.16); }
      .anchor-mark { border-radius:.28em; padding:0 .08em; background:linear-gradient(180deg,rgba(255,244,171,.42),rgba(255,225,98,.62)); box-shadow:inset 0 -0.08em 0 rgba(210,161,0,.18); cursor:pointer; transition:box-shadow .16s ease,background .16s ease; }
      .anchor-mark:hover, .anchor-mark.is-peeking { background:linear-gradient(180deg,rgba(255,244,171,.58),rgba(255,220,70,.78)); box-shadow:0 0 0 2px rgba(241,196,15,.12),0 0 16px rgba(255,209,45,.26); }
      .anchor-mark.is-pulsing { animation:viewoupeAnchorPulse .85s ease-out; }
      @keyframes viewoupeAnchorPulse { 0% { box-shadow:0 0 0 0 rgba(255,209,45,.46),0 0 12px rgba(255,209,45,.24); } 55% { box-shadow:0 0 0 7px rgba(255,209,45,.10),0 0 28px rgba(255,209,45,.34); } 100% { box-shadow:inset 0 -0.08em 0 rgba(210,161,0,.18); } }
      .content.anchor-only, .content.anchor-return { color:transparent; }
      .content.anchor-only *, .content.anchor-return * { color:transparent !important; background-color:transparent !important; border-color:transparent !important; box-shadow:none !important; text-decoration-color:transparent !important; }
      .content.anchor-only img, .content.anchor-only picture, .content.anchor-only video, .content.anchor-only canvas, .content.anchor-only svg, .content.anchor-return img, .content.anchor-return picture, .content.anchor-return video, .content.anchor-return canvas, .content.anchor-return svg { visibility:hidden !important; }
      .content.anchor-only .anchor-mark, .content.anchor-only .anchor-mark *, .content.anchor-return .anchor-mark, .content.anchor-return .anchor-mark * { color:#19263a !important; visibility:visible !important; background:rgba(255,225,98,.82) !important; box-shadow:0 0 20px rgba(255,215,64,.58),0 0 42px rgba(255,215,64,.24) !important; }
      .content.anchor-only .anchor-context-reveal, .content.anchor-only .anchor-context-reveal *, .content.anchor-return .anchor-neighborhood, .content.anchor-return .anchor-neighborhood * { color:#15171a !important; visibility:visible !important; }
      .content.anchor-only .anchor-context-reveal .anchor-mark, .content.anchor-return .anchor-neighborhood .anchor-mark { color:#19263a !important; background:rgba(255,225,98,.82) !important; box-shadow:0 0 20px rgba(255,215,64,.58),0 0 42px rgba(255,215,64,.24) !important; }
      .anchor-flash-layer { position:fixed; inset:0; pointer-events:none; z-index:8; }
      .anchor-ghost { position:fixed; margin:0; padding:0 .08em; color:#19263a; background:rgba(255,225,98,.78); border-radius:.28em; box-shadow:0 0 18px rgba(255,215,64,.76),0 0 42px rgba(255,215,64,.34); opacity:1; transform:scale(1); transform-origin:left center; animation:viewoupeAnchorFade 3.2s ease-out forwards; }
      @keyframes viewoupeAnchorFade { 0% { opacity:1; filter:brightness(1.08); } 32% { opacity:1; filter:brightness(1.12); box-shadow:0 0 26px rgba(255,215,64,.92),0 0 62px rgba(255,215,64,.44); } 55% { opacity:.92; } 100% { opacity:0; filter:brightness(1); transform:scale(1.012); } }
    
    `;
    state.shadow.append(style);

    const backdrop = document.createElement('div');
    backdrop.className = 'backdrop';
    state.backdrop = backdrop;
    state.shadow.append(backdrop);

    const activator = document.createElement('button');
    activator.className = 'activator';
    activator.type = 'button';
    activator.textContent = 'VL';
    activator.title = 'Open Viewoupe (Alt+L)';
    state.activator = activator;
    state.shadow.append(activator);
    activator.addEventListener('pointerenter', () => {
      clearTimeout(state.leaveTimer);
    });
    activator.addEventListener('pointerleave', () => {
      clearTimeout(state.leaveTimer);
      state.leaveTimer = setTimeout(() => hideActivator(), state.config.leaveDelay);
    });
    activator.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const sel = currentSelection();
      const target = state.hoverTarget || (sel ? selectionElement(sel) : null);
      if (target) openFor(target, true);
      hideActivator();
    });

    const lens = document.createElement('section');
    lens.className = 'lens';
    state.lens = lens;
    lens.innerHTML = `
      <div class="toolbar">
        <button data-act="close" aria-label="Close" title="Close (Esc)">×</button>
        <button data-act="smaller">A−</button>
        <button data-act="larger">A+</button>
        <span class="zoom-label" data-role="zoom">140%</span>
        <button data-act="focus">Focus</button>
        <button data-act="article">Article</button>
        <button data-act="copy">Copy</button>
        <span class="shelf-group">
          <button data-act="shelf-add" title="Save this text to the temporary Shelf">+ Shelf</button>
          <button data-act="shelf-toggle" title="Open temporary text Shelf">Shelf (<span data-role="shelf-count">0</span>)</button>
        </span>
        <span class="hint">Esc = close · Alt+L = toggle</span>
      </div>
      <div class="anchor-strip" aria-label="Memory anchors">
        <div class="anchor-slot" data-anchor-slot="0">Anchor 1</div>
        <div class="anchor-slot" data-anchor-slot="1">Anchor 2</div>
        <div class="anchor-slot" data-anchor-slot="2">Anchor 3</div>
      </div>
      <div class="shelf-panel">
        <div class="shelf-head">
          <span><span class="shelf-title">Reading Shelf</span><div class="shelf-subtitle">Saved text clips from this page · temporary until reload</div></span>
          <span class="shelf-actions">
            <button data-act="shelf-copy">Copy all</button>
            <button data-act="shelf-clear">Clear</button>
            <button data-act="shelf-hide">Hide</button>
          </span>
        </div>
        <div class="shelf-list"></div>
      </div>
      <div class="content"></div>
    `;
    state.content = lens.querySelector('.content');
    state.toolbar = lens.querySelector('.toolbar');
    state.articleButton = lens.querySelector('[data-act="article"]');
    state.anchorStrip = lens.querySelector('.anchor-strip');
    state.shelfPanel = lens.querySelector('.shelf-panel');
    state.shelfList = lens.querySelector('.shelf-list');
    state.shadow.append(lens);

    const anchorFlashLayer = document.createElement('div');
    anchorFlashLayer.className = 'anchor-flash-layer';
    state.anchorFlashLayer = anchorFlashLayer;
    state.shadow.append(anchorFlashLayer);
    renderAnchors();
    renderShelf();

    state.shelfList.addEventListener('click', (event) => {
      const remove = event.target.closest('button[data-shelf-remove]');
      if (!remove) return;
      state.shelf = state.shelf.filter(item => item.id !== remove.dataset.shelfRemove);
      renderShelf();
    });

    state.content.addEventListener('mouseup', () => setTimeout(addAnchorFromSelection, 0));
    state.content.addEventListener('click', (event) => {
      const mark = event.target.closest('.anchor-mark');
      if (!mark) return;
      if (state.focusMode === 3) revealAnchorContext(mark.dataset.anchorId);
      else removeAnchor(mark.dataset.anchorId);
    });
    state.anchorStrip.addEventListener('pointerover', (event) => {
      const slot = event.target.closest('.anchor-slot.has-anchor');
      if (slot) setAnchorPeek(Number(slot.dataset.anchorSlot), true);
    });
    state.anchorStrip.addEventListener('pointerout', (event) => {
      const slot = event.target.closest('.anchor-slot.has-anchor');
      if (slot) setAnchorPeek(Number(slot.dataset.anchorSlot), false);
    });
    state.anchorStrip.addEventListener('click', (event) => {
      const slot = event.target.closest('.anchor-slot.has-anchor');
      if (slot) jumpToAnchor(Number(slot.dataset.anchorSlot));
    });

    lens.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-act]');
      if (!button) return;
      const action = button.dataset.act;
      if (action === 'smaller') setZoom(state.zoomIndex - 1);
      if (action === 'larger') setZoom(state.zoomIndex + 1);
      if (action === 'focus') cycleFocus();
      if (action === 'article') openArticle();
      if (action === 'copy') copyCurrent();
      if (action === 'shelf-add') addToShelf();
      if (action === 'shelf-toggle') toggleShelf();
      if (action === 'shelf-copy') copyShelfAll();
      if (action === 'shelf-clear') clearShelf();
      if (action === 'shelf-hide') hideShelf();
      if (action === 'close') close();
    });
  }

  function renderAnchors() {
    if (!state.anchorStrip) return;
    const slots = [...state.anchorStrip.querySelectorAll('.anchor-slot')];
    slots.forEach((slot, index) => {
      const anchor = state.anchors[index];
      slot.textContent = anchor ? anchor.text : `Anchor ${index + 1}`;
      slot.title = anchor ? `${anchor.text} · click to locate` : 'Select up to 5 words in the focused text';
      slot.classList.toggle('has-anchor', !!anchor);
      if (!anchor) slot.classList.remove('is-peeking');
    });
    updateFocusButton();
  }

  function resetAnchors() {
    state.anchors = [];
    renderAnchors();
  }

  function normalizeAnchorText(text) {
    return String(text || '').trim().replace(/\s+/g, ' ');
  }

  function boundaryTextOffset(root, container, offset) {
    const r = document.createRange();
    r.selectNodeContents(root);
    r.setEnd(container, offset);
    return r.toString().length;
  }

  function rangeFromOffsets(root, start, end) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let pos = 0, startNode = null, endNode = null, startOffset = 0, endOffset = 0;
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const len = node.nodeValue?.length || 0;
      if (!startNode && start >= pos && start <= pos + len) { startNode = node; startOffset = start - pos; }
      if (!endNode && end >= pos && end <= pos + len) { endNode = node; endOffset = end - pos; }
      pos += len;
      if (startNode && endNode) break;
    }
    if (!startNode || !endNode) return null;
    const r = document.createRange();
    r.setStart(startNode, startOffset);
    r.setEnd(endNode, endOffset);
    return r;
  }

  function wrapAnchorRange(range, id) {
    const mark = document.createElement('span');
    mark.className = 'anchor-mark';
    mark.dataset.anchorId = id;
    mark.append(range.extractContents());
    range.insertNode(mark);
    return mark;
  }

  function persistAnchors() {
    if (state.anchorKey == null) return;
    state.anchorMemory.set(state.anchorKey, state.anchors.map(anchor => ({
      id: anchor.id,
      text: anchor.text,
      start: anchor.start,
      end: anchor.end,
    })));
  }

  function restoreAnchors() {
    const saved = state.anchorKey == null ? [] : (state.anchorMemory.get(state.anchorKey) || []);
    state.anchors = [];
    saved.forEach(item => {
      const range = rangeFromOffsets(state.content, item.start, item.end);
      if (!range || normalizeAnchorText(range.toString()) !== item.text) return;
      try {
        const mark = wrapAnchorRange(range, item.id);
        state.anchors.push({ ...item, mark });
      } catch { /* stale page content: skip this anchor */ }
    });
    renderAnchors();
  }

  function lensSelection() {
    const candidates = [state.shadow?.getSelection?.(), document.getSelection?.(), window.getSelection?.()].filter(Boolean);
    for (const sel of candidates) {
      if (sel.rangeCount === 0 || sel.isCollapsed) continue;
      const range = sel.getRangeAt(0);
      if (range.commonAncestorContainer?.getRootNode?.() !== state.shadow) continue;
      const text = normalizeAnchorText(sel.toString());
      if (text) return { sel, range, text };
    }
    return null;
  }

  function addAnchorFromSelection() {
    if (state.anchors.length >= 3) { flashHint('3 anchors max'); return; }
    const picked = lensSelection();
    if (!picked) return;
    const words = picked.text.split(/\s+/).filter(Boolean);
    if (words.length > 5) { flashHint('Anchor: max 5 words'); return; }
    const startEl = picked.range.startContainer.nodeType === 1 ? picked.range.startContainer : picked.range.startContainer.parentElement;
    const endEl = picked.range.endContainer.nodeType === 1 ? picked.range.endContainer : picked.range.endContainer.parentElement;
    if (startEl?.closest('.anchor-mark') || endEl?.closest('.anchor-mark') || picked.range.cloneContents().querySelector?.('.anchor-mark')) {
      flashHint('Choose a new phrase');
      return;
    }
    const blockSelector = 'p,li,blockquote,pre,dd,dt,figcaption,td,th,h1,h2,h3,h4,h5,h6,div';
    if (startEl?.closest(blockSelector) !== endEl?.closest(blockSelector)) { flashHint('Anchor: one text block'); return; }
    const start = boundaryTextOffset(state.content, picked.range.startContainer, picked.range.startOffset);
    const end = boundaryTextOffset(state.content, picked.range.endContainer, picked.range.endOffset);
    const id = 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    try {
      const mark = wrapAnchorRange(picked.range, id);
      picked.sel.removeAllRanges();
      state.anchors.push({ id, text: picked.text, mark, start, end });
      persistAnchors();
      renderAnchors();
      flashHint(`Anchor ${state.anchors.length}/3`);
    } catch { flashHint('Try a shorter phrase'); }
  }

  function removeAnchor(id) {
    const index = state.anchors.findIndex(anchor => anchor.id === id);
    if (index < 0) return;
    const mark = state.anchors[index].mark;
    const parent = mark?.parentNode;
    if (mark?.isConnected) mark.replaceWith(...mark.childNodes);
    parent?.normalize?.();
    state.anchors.splice(index, 1);
    persistAnchors();
    renderAnchors();
    flashHint('Anchor removed');
  }

  function setAnchorPeek(index, on) {
    const anchor = state.anchors[index];
    const slot = state.anchorStrip?.querySelector(`[data-anchor-slot="${index}"]`);
    slot?.classList.toggle('is-peeking', !!on && !!anchor);
    anchor?.mark?.classList.toggle('is-peeking', !!on);
  }

  function jumpToAnchor(index) {
    const anchor = state.anchors[index];
    const mark = anchor?.mark;
    if (!mark?.isConnected) return;
    mark.scrollIntoView({ behavior:'smooth', block:'center', inline:'nearest' });
    mark.classList.remove('is-pulsing');
    void mark.offsetWidth;
    mark.classList.add('is-pulsing');
    setTimeout(() => mark.classList.remove('is-pulsing'), 900);
  }

  function clearAnchorContext() {
    clearTimeout(state.anchorContextTimer);
    state.anchorContextTimer = null;
    state.content?.querySelectorAll('.anchor-context-reveal').forEach(el => el.classList.remove('anchor-context-reveal'));
  }

  function revealAnchorContext(id) {
    const anchor = state.anchors.find(item => item.id === id);
    if (!anchor?.mark?.isConnected) return;
    clearAnchorContext();
    const block = anchor.mark.closest('p,li,blockquote,pre,dd,dt,figcaption,td,th,h1,h2,h3,h4,h5,h6,div');
    if (!block) return;
    block.classList.add('anchor-context-reveal');
    const index = state.anchors.indexOf(anchor);
    jumpToAnchor(index);
    state.anchorContextTimer = setTimeout(() => block.classList.remove('anchor-context-reveal'), 2400);
  }

  function clearAnchorReturn() {
    clearTimeout(state.anchorReturnTimer);
    state.anchorReturnTimer = null;
    state.content?.classList.remove('anchor-return');
    state.content?.querySelectorAll('.anchor-neighborhood').forEach(el => el.classList.remove('anchor-neighborhood'));
  }

  function beginAnchorReturn() {
    if (!state.content || !state.anchors.length) return;
    clearAnchorReturn();
    state.content.classList.add('anchor-return');
    state.anchors.forEach(anchor => {
      const block = anchor.mark?.closest('p,li,blockquote,pre,dd,dt,figcaption,td,th,h1,h2,h3,h4,h5,h6,div');
      block?.classList.add('anchor-neighborhood');
    });
    state.anchorReturnTimer = setTimeout(clearAnchorReturn, 460);
  }

  function flashAnchors() {
    if (!state.anchorFlashLayer || !state.anchors.length) return;
    state.anchorFlashLayer.replaceChildren();
    state.anchors.forEach(anchor => {
      const mark = anchor.mark;
      if (!mark?.isConnected) return;
      const cs = getComputedStyle(mark);
      [...mark.getClientRects()].forEach(rect => {
        if (rect.width <= 0 || rect.height <= 0) return;
        const ghost = document.createElement('span');
        ghost.className = 'anchor-ghost';
        ghost.textContent = anchor.text;
        Object.assign(ghost.style, {
          left: rect.left + 'px', top: rect.top + 'px',
          width: rect.width + 'px', minHeight: rect.height + 'px',
          font: cs.font, lineHeight: cs.lineHeight,
          overflow: 'hidden', whiteSpace: 'nowrap'
        });
        state.anchorFlashLayer.append(ghost);
      });
    });
    setTimeout(() => state.anchorFlashLayer?.replaceChildren(), 3400);
  }

  function updateFocusButton() {
    const button = state.toolbar?.querySelector('[data-act="focus"]');
    if (!button) return;
    const labels = { 0:'Focus', 1:'Focus', 2:'Deep', 3:'Anchors' };
    button.textContent = labels[state.focusMode] || 'Focus';
    const next = state.focusMode === 1 ? 'Deep' : state.focusMode === 2 ? (state.anchors.length ? 'Anchors' : 'Focus') : 'Focus';
    button.title = `Current: ${labels[state.focusMode] || 'Focus'} · next: ${next}`;
  }

  function applyFocusMode(mode) {
    const previous = state.focusMode;
    clearAnchorContext();
    clearAnchorReturn();
    state.focusMode = mode;
    state.content?.classList.toggle('anchor-only', mode === 3);
    if (mode === 0) {
      state.backdrop.style.background = 'rgba(12,16,22,0)';
      state.backdrop.style.pointerEvents = 'none';
    } else if (mode === 1) {
      state.backdrop.style.background = `rgba(12,16,22,${state.config.dimOpacity})`;
      state.backdrop.style.pointerEvents = 'auto';
    } else {
      state.backdrop.style.background = `rgba(12,16,22,${state.config.isolateOpacity})`;
      state.backdrop.style.pointerEvents = 'auto';
    }
    if (previous === 3 && mode === 1 && state.anchors.length) beginAnchorReturn();
    updateFocusButton();
  }

  function cleanClone(node) {
    const clone = node.cloneNode(true);
    clone.querySelectorAll('script, style, iframe, form, button, input, textarea, select, video, canvas, svg').forEach(el => el.remove());
    clone.querySelectorAll('*').forEach(el => {
      [...el.attributes].forEach(attr => {
        if (/^on/i.test(attr.name) || ['id', 'class', 'style'].includes(attr.name)) el.removeAttribute(attr.name);
      });
      if (el.tagName === 'A') {
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      }
    });
    return clone;
  }

  function currentSelection() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
    const text = sel.toString().trim();
    if (!text) return null;
    const range = sel.getRangeAt(0);
    if (state.host && state.host.contains(range.commonAncestorContainer)) return null;
    return { text, range };
  }

  function isExcludedReadingContext(start) {
    if (!(start instanceof Element)) return true;
    return !!start.closest('nav, header, footer, [role="navigation"], [role="banner"], [role="contentinfo"], [role="menu"], [role="menubar"], [role="toolbar"]');
  }

  function findTarget(start) {
    if (!(start instanceof Element) || isExcludedReadingContext(start)) return null;
    const direct = start.closest(state.config.selector);
    if (direct && direct.textContent.trim().length >= state.config.minTextLength) return direct;
    let el = start;
    for (let i = 0; i < 5 && el && el !== document.body; i++, el = el.parentElement) {
      const cs = getComputedStyle(el);
      const text = el.textContent.trim();
      const rect = el.getBoundingClientRect();
      const tag = el.tagName;
      if (['HTML','BODY','MAIN','ARTICLE','SECTION','NAV','HEADER','FOOTER'].includes(tag)) continue;
      if (el.querySelector?.(state.config.selector)) continue;
      if (text.length >= state.config.minTextLength && rect.width > 120 && rect.height > 18 && cs.display !== 'inline') return el;
    }
    return null;
  }

  function isReadableContainer(el) {
    if (!(el instanceof Element)) return false;
    if (['NAV','HEADER','FOOTER','ASIDE','FORM'].includes(el.tagName)) return false;
    const text = (el.innerText || el.textContent || '').trim();
    if (text.length < 280) return false;
    const blocks = el.querySelectorAll(state.config.selector).length;
    if (blocks < 2) return false;
    const linkText = [...el.querySelectorAll('a')].reduce((n, a) => n + (a.innerText || a.textContent || '').trim().length, 0);
    if (linkText / Math.max(text.length, 1) > 0.55) return false;
    const r = el.getBoundingClientRect();
    return r.width >= 240 && r.height >= 120;
  }

  function findArticleRoot() {
    const base = state.target;
    const semantic = base?.closest?.('article, main, [role="main"]');
    if (semantic && (semantic.innerText || semantic.textContent || '').trim().length >= state.config.minTextLength) return semantic;
    for (let el = base?.parentElement, depth = 0; el && el !== document.body && depth < 8; el = el.parentElement, depth++) {
      if (isReadableContainer(el)) return el;
    }
    return null;
  }

  function updateArticleAction() {
    if (!state.articleButton) return;
    state.articleButton.hidden = !findArticleRoot();
  }

  function selectionElement(sel) {
    const node = sel?.range?.commonAncestorContainer;
    if (!node) return null;
    return node.nodeType === 1 ? node : node.parentElement;
  }

  function hideActivator() {
    clearTimeout(state.hoverTimer);
    if (state.activator) state.activator.style.display = 'none';
  }

  function showActivator(target, rect = null) {
    if (!target || state.lens?.style.display === 'block') return;
    clearTimeout(state.leaveTimer);
    state.hoverTarget = target;
    const r = rect || target.getBoundingClientRect();
    if (!r || r.width <= 0 || r.height <= 0) return;
    const width = 38;
    const left = r.left >= 52 ? r.left - 44 : Math.min(window.innerWidth - width - 8, r.left + 8);
    const top = Math.max(8, Math.min(window.innerHeight - 36, r.top + 6));
    state.activator.style.left = Math.round(left) + 'px';
    state.activator.style.top = Math.round(top) + 'px';
    state.activator.style.display = 'flex';
  }

  function renderFromElement(el) {
    resetAnchors();
    state.content.innerHTML = '';
    state.content.append(cleanClone(el));
    state.lastSelectionText = '';
    state.target = el;
    state.anchorKey = el;
    restoreAnchors();
  }

  function renderFromSelection(sel) {
    resetAnchors();
    state.content.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.textContent = sel.text;
    state.content.append(wrapper);
    state.lastSelectionText = sel.text;
    state.target = sel.range.commonAncestorContainer.nodeType === 1
      ? sel.range.commonAncestorContainer
      : sel.range.commonAncestorContainer.parentElement;
    state.anchorKey = `selection:${location.href}:${normalizeAnchorText(sel.text)}`;
    restoreAnchors();
  }

  function openFor(target, lock = false) {
    const sel = currentSelection();
    const selEl = sel ? selectionElement(sel) : null;
    const selectionMatches = !!(selEl && target &&
      (selEl === target || target.contains?.(selEl) || selEl.contains?.(target)));
    if (sel && selectionMatches) renderFromSelection(sel);
    else if (target) renderFromElement(target);
    else return;
    updateArticleAction();

    state.locked = lock;
    state.lens.style.display = 'block';
    applyFocusMode(state.config.autoDim ? 1 : 0);
    setZoom(state.zoomIndex);
    state.host.style.pointerEvents = 'none';
    state.lens.style.pointerEvents = 'auto';
  }

  function openArticle() {
    const root = findArticleRoot();
    if (!root) { flashHint('No article'); return; }
    renderFromElement(root);
    state.locked = true;
    state.lens.style.display = 'block';
    applyFocusMode(state.config.autoDim ? 1 : 0);
    setZoom(state.zoomIndex);
    state.content.scrollTop = 0;
    flashHint('Article mode');
  }

  function close() {
    clearTimeout(state.hoverTimer);
    clearTimeout(state.leaveTimer);
    persistAnchors();
    flashAnchors();
    clearAnchorContext();
    clearAnchorReturn();
    state.locked = false;
    state.target = null;
    state.hoverTarget = null;
    state.lastSelectionText = '';
    hideActivator();
    applyFocusMode(0);
    if (state.lens) state.lens.style.display = 'none';
    if (state.shelfPanel) state.shelfPanel.style.display = 'none';
    resetAnchors();
    state.anchorKey = null;
  }

  function setZoom(index) {
    state.zoomIndex = Math.max(0, Math.min(index, state.config.zoomLevels.length - 1));
    const scale = state.config.zoomLevels[state.zoomIndex];
    state.content.style.fontSize = `${16 * scale}px`;
    state.content.style.lineHeight = scale >= 1.7 ? '1.62' : '1.56';
    const label = state.toolbar?.querySelector('[data-role="zoom"]');
    if (label) label.textContent = Math.round(scale * 100) + '%';
  }

  function cycleFocus() {
    if (state.focusMode === 1) applyFocusMode(2);
    else if (state.focusMode === 2) applyFocusMode(state.anchors.length ? 3 : 1);
    else if (state.focusMode === 3) applyFocusMode(1);
    else applyFocusMode(1);
  }


  function shelfText() {
    return (state.lastSelectionText || state.target?.textContent?.trim() || state.content?.textContent?.trim() || '').trim();
  }

  function renderShelf() {
    if (!state.shelfList) return;
    const count = state.toolbar?.querySelector('[data-role="shelf-count"]');
    if (count) count.textContent = String(state.shelf.length);
    const toggle = state.toolbar?.querySelector('[data-act="shelf-toggle"]');
    if (toggle) toggle.classList.toggle('has-items', state.shelf.length > 0);
    state.shelfList.innerHTML = '';
    if (!state.shelf.length) {
      const empty = document.createElement('div');
      empty.className = 'shelf-empty';
      empty.textContent = 'Shelf is empty';
      state.shelfList.append(empty);
      return;
    }
    state.shelf.forEach(item => {
      const row = document.createElement('div');
      row.className = 'shelf-item';
      const text = document.createElement('div');
      text.className = 'shelf-text';
      text.textContent = item.text;
      row.append(text);
      const meta = document.createElement('div');
      meta.className = 'shelf-meta';
      meta.textContent = item.title || item.url;
      meta.title = item.url;
      row.append(meta);
      const remove = document.createElement('button');
      remove.className = 'shelf-remove';
      remove.type = 'button';
      remove.textContent = '×';
      remove.title = 'Remove from Shelf';
      remove.dataset.shelfRemove = item.id;
      row.append(remove);
      state.shelfList.append(row);
    });
  }

  function addToShelf() {
    const text = shelfText();
    if (!text) { flashHint('Nothing to add'); return; }
    if (state.shelf.some(item => item.text === text && item.url === location.href)) {
      flashHint('Already on Shelf');
      state.shelfPanel.style.display = 'block';
      return;
    }
    const id = globalThis.crypto?.randomUUID?.() || String(Date.now()) + Math.random().toString(16).slice(2);
    state.shelf.push({ id, text, url: location.href, title: document.title });
    renderShelf();
    state.shelfPanel.style.display = 'block';
    flashHint('Added to Shelf');
  }

  function toggleShelf() {
    if (!state.shelfPanel) return;
    state.shelfPanel.style.display = state.shelfPanel.style.display === 'block' ? 'none' : 'block';
  }

  function hideShelf() {
    if (state.shelfPanel) state.shelfPanel.style.display = 'none';
  }

  function clearShelf() {
    state.shelf = [];
    renderShelf();
    flashHint('Shelf cleared');
  }

  async function copyShelfAll() {
    if (!state.shelf.length) { flashHint('Shelf is empty'); return; }
    const body = state.shelf.map((item, i) => (i + 1) + '. ' + item.text).join('\n\n──────────\n\n');
    const value = body + '\n\nSource: ' + document.title + '\n' + location.href;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    flashHint('Shelf copied');
  }

  async function copyCurrent() {
    const text = state.lastSelectionText || state.target?.textContent?.trim() || state.content.textContent.trim();
    try {
      await navigator.clipboard.writeText(text);
      flashHint('Copied');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
      flashHint('Copied');
    }
  }

  function flashHint(text) {
    const hint = state.toolbar.querySelector('.hint');
    const old = hint.textContent;
    hint.textContent = text;
    setTimeout(() => { hint.textContent = old; }, 900);
  }

  function onPointerMove(event) {
    if (!state.enabled || state.lens?.style.display === 'block' || Date.now() < state.scrollBlockedUntil || event.buttons) return;
    const path = event.composedPath?.() || [];
    if (path.includes(state.lens) || path.includes(state.activator)) return;
    const target = findTarget(event.target);
    if (!target) {
      clearTimeout(state.hoverTimer);
      clearTimeout(state.leaveTimer);
      state.leaveTimer = setTimeout(() => {
        if (state.lens?.style.display !== 'block') hideActivator();
      }, state.config.leaveDelay);
      return;
    }
    clearTimeout(state.leaveTimer);
    if (target === state.hoverTarget && state.activator?.style.display === 'flex') return;
    clearTimeout(state.hoverTimer);
    state.hoverTarget = target;
    state.hoverTimer = setTimeout(() => showActivator(target), state.config.hoverDelay);
  }

  function onPointerOut(event) {
    if (!state.enabled || state.lens?.style.display === 'block') return;
    const relatedPath = event.relatedTarget ? [event.relatedTarget] : [];
    if (event.relatedTarget === state.host || relatedPath.includes(state.activator) || state.activator?.contains?.(event.relatedTarget)) return;
    if (event.relatedTarget && state.hoverTarget?.contains?.(event.relatedTarget)) return;
    clearTimeout(state.leaveTimer);
    state.leaveTimer = setTimeout(() => {
      if (state.lens?.style.display !== 'block') hideActivator();
    }, state.config.leaveDelay);
  }

  function onDocumentClick(event) {
    if (!state.enabled || Date.now() < state.scrollBlockedUntil) return;
    const path = event.composedPath?.() || [];
    if (path.includes(state.lens) || path.includes(state.activator)) return;
    if (state.lens?.style.display === 'block') {
      if (state.focusMode > 0 && event.target === state.host) return;
      close();
      return;
    }
    hideActivator();
  }

  function onScrollIntent(event) {
    if (event?.composedPath?.().includes(state.lens)) return;
    state.scrollBlockedUntil = Date.now() + state.config.scrollCooldown;
    clearTimeout(state.hoverTimer);
    clearTimeout(state.leaveTimer);
    hideActivator();
    if (!state.locked && state.lens?.style.display === 'block') close();
  }

  function onMouseUp(event) {
    if (!state.enabled || state.lens?.style.display === 'block') return;
    if ((event.composedPath?.() || []).includes(state.activator)) return;
    setTimeout(() => {
      const sel = currentSelection();
      if (!sel) return;
      const target = selectionElement(sel);
      const rect = sel.range.getBoundingClientRect();
      if (target && rect.width > 0 && rect.height > 0) showActivator(target, rect);
    }, 0);
  }

  function onKeyDown(event) {
    if (!state.enabled) return;
    if (event.key === 'Escape') {
      close();
      return;
    }
    if (event.altKey && event.key.toLowerCase() === 'l') {
      event.preventDefault();
      if (state.lens?.style.display === 'block') { close(); return; }
      const sel = currentSelection();
      const target = state.hoverTarget || (sel ? selectionElement(sel) : null);
      if (target) openFor(target, true);
      hideActivator();
      return;
    }
    if (event.altKey && event.key === '+') { event.preventDefault(); setZoom(state.zoomIndex + 1); }
    if (event.altKey && event.key === '-') { event.preventDefault(); setZoom(state.zoomIndex - 1); }
    if (event.altKey && event.key.toLowerCase() === 'f' && state.lens.style.display === 'block') {
      event.preventDefault(); cycleFocus();
    }
  }

  function init(options = {}) {
    if (state.enabled) return window.Viewoupe;
    state.config = { ...DEFAULTS, ...options };
    createUI();
    state.enabled = true;
    document.addEventListener('pointermove', onPointerMove, true);
    document.addEventListener('pointerout', onPointerOut, true);
    document.addEventListener('click', onDocumentClick, true);
    document.addEventListener('mouseup', onMouseUp, true);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('wheel', onScrollIntent, { capture:true, passive:true });
    window.addEventListener('scroll', onScrollIntent, { passive:true });
    return window.Viewoupe;
  }

  function destroy() {
    if (!state.enabled) return;
    close();
    document.removeEventListener('pointermove', onPointerMove, true);
    document.removeEventListener('pointerout', onPointerOut, true);
    document.removeEventListener('click', onDocumentClick, true);
    document.removeEventListener('mouseup', onMouseUp, true);
    document.removeEventListener('keydown', onKeyDown, true);
    document.removeEventListener('wheel', onScrollIntent, true);
    window.removeEventListener('scroll', onScrollIntent);
    state.host?.remove();
    state.enabled = false;
  }

  window.Viewoupe = {
    version: '0.2.0',
    init,
    destroy,
    open(element) { if (element) openFor(element, true); },
    close,
    focus: cycleFocus,
    article: openArticle,
    shelf: {
      items() { return state.shelf.map(item => ({ ...item })); },
      add: addToShelf,
      clear: clearShelf,
      copy: copyShelfAll,
    },
    zoom(level) {
      const i = state.config.zoomLevels.findIndex(v => v >= level);
      setZoom(i < 0 ? state.config.zoomLevels.length - 1 : i);
    }
  };

  if (document.currentScript?.hasAttribute('data-viewoupe')) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init());
    else init();
  }
})();
