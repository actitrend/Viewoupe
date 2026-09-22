/*! Viewoupe Memory 0.1.0 | MIT License | Read. Reduce. Recall. */
(() => {
  'use strict';

  const STORAGE_KEY = 'viewoupe.memories.v1';
  const DAY = 24 * 60 * 60 * 1000;
  const MAX_WORDS = 280;
  const state = {
    host: null,
    shadow: null,
    lens: null,
    content: null,
    anchorStrip: null,
    bar: null,
    editor: null,
    recall: null,
    attached: false,
    restoring: false,
    saveTimer: null,
    openObserver: null,
    anchorObserver: null,
  };

  function normalize(text) {
    return String(text || '').trim().replace(/\s+/g, ' ');
  }

  function pageUrl() {
    return location.href.split('#')[0];
  }

  function readStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeStore(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(-250)));
      return true;
    } catch {
      return false;
    }
  }

  function currentAnchors() {
    if (!state.anchorStrip) return [];
    return [...state.anchorStrip.querySelectorAll('.anchor-slot.has-anchor')]
      .map(slot => normalize(slot.textContent))
      .filter(Boolean)
      .slice(0, 3);
  }

  function currentPassage() {
    return normalize(state.content?.textContent);
  }

  function memoryId(url, passage) {
    let hash = 2166136261;
    const source = `${url}\n${passage}`;
    for (let i = 0; i < source.length; i++) {
      hash ^= source.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return `m${(hash >>> 0).toString(36)}`;
  }

  function currentMemory() {
    const passage = currentPassage();
    if (!passage) return null;
    return readStore().find(item => item.url === pageUrl() && item.passage === passage) || null;
  }

  function upsertCurrent(extra = {}) {
    if (!state.lens || state.lens.style.display !== 'block') return null;
    const passage = currentPassage();
    const anchors = currentAnchors();
    if (!passage || !anchors.length) return null;

    const url = pageUrl();
    const items = readStore();
    const index = items.findIndex(item => item.url === url && item.passage === passage);
    const now = Date.now();
    const old = index >= 0 ? items[index] : null;
    const record = {
      id: old?.id || memoryId(url, passage),
      url,
      title: document.title,
      passage,
      anchors,
      inMyWords: old?.inMyWords || '',
      createdAt: old?.createdAt || now,
      updatedAt: now,
      recallCount: old?.recallCount || 0,
      nextRecallAt: old?.nextRecallAt || (now + DAY),
      lastRecallResult: old?.lastRecallResult || null,
      ...extra,
    };

    if (index >= 0) items[index] = record;
    else items.push(record);
    writeStore(items);
    renderBar();
    return record;
  }

  function removeCurrentIfEmpty() {
    if (!state.lens || state.lens.style.display !== 'block') return;
    if (currentAnchors().length) return;
    const passage = currentPassage();
    if (!passage) return;
    const filtered = readStore().filter(item => !(item.url === pageUrl() && item.passage === passage));
    writeStore(filtered);
    renderBar();
  }

  function scheduleSave() {
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(() => {
      if (state.restoring) return;
      if (currentAnchors().length) upsertCurrent();
      else removeCurrentIfEmpty();
    }, 80);
  }

  function ensureStyles() {
    const style = document.createElement('style');
    style.dataset.viewoupeMemory = '1';
    style.textContent = `
      .memory-bar{display:flex;align-items:center;gap:7px;padding:8px 14px;background:#fbfaf7;border-bottom:1px solid rgba(0,0,0,.08);font:600 12px system-ui,-apple-system,Segoe UI,Arial,sans-serif}
      .memory-bar__label{color:#6b7280;margin-right:auto;letter-spacing:.01em}.memory-bar button{font-size:12px;padding:6px 9px}
      .memory-bar button[disabled]{opacity:.42;cursor:default}.memory-saved{color:#34613e}
      .memory-editor,.memory-recall{display:none;padding:16px 18px;border-bottom:1px solid rgba(0,0,0,.09);background:#f7f6f2;font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif}
      .memory-editor.is-open,.memory-recall.is-open{display:block}.memory-title{font:750 13px/1.3 system-ui,-apple-system,Segoe UI,Arial,sans-serif;color:#222;margin-bottom:6px}
      .memory-subtitle{font:500 12px/1.45 system-ui,-apple-system,Segoe UI,Arial,sans-serif;color:#69707a;margin-bottom:10px}
      .memory-editor textarea{display:block;width:100%;min-height:72px;resize:vertical;border:1px solid rgba(0,0,0,.15);border-radius:10px;padding:10px 12px;background:#fff;color:#1b1d20;font:500 15px/1.45 system-ui,-apple-system,Segoe UI,Arial,sans-serif;outline:none}
      .memory-editor textarea:focus{border-color:#7995c5;box-shadow:0 0 0 3px rgba(85,125,195,.10)}
      .memory-actions{display:flex;gap:7px;align-items:center;margin-top:9px}.memory-count{margin-left:auto;color:#8a8f97;font:500 11px system-ui,-apple-system,Segoe UI,Arial,sans-serif}
      .memory-recall__anchors{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 16px}.memory-chip{padding:8px 11px;border-radius:999px;background:#fff4a8;border:1px solid rgba(184,145,0,.25);color:#26334a;font:700 13px/1.25 system-ui,-apple-system,Segoe UI,Arial,sans-serif}
      .memory-question{font:700 18px/1.35 system-ui,-apple-system,Segoe UI,Arial,sans-serif;color:#20242a;margin:8px 0 14px}
      .memory-reveal{display:none;margin-top:14px;padding-top:14px;border-top:1px solid rgba(0,0,0,.10)}.memory-reveal.is-open{display:block}
      .memory-reveal__label{margin:12px 0 5px;color:#777;font:750 10px/1.2 system-ui,-apple-system,Segoe UI,Arial,sans-serif;text-transform:uppercase;letter-spacing:.10em}
      .memory-reveal__thought{font:650 15px/1.5 system-ui,-apple-system,Segoe UI,Arial,sans-serif;color:#24334e}
      .memory-reveal__passage{font:500 16px/1.55 Georgia,"Times New Roman",serif;color:#242424}
      .memory-rating{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}.memory-rating button{background:#fff}
      .memory-due{color:#835f00}.memory-later{color:#68707a}
    `;
    state.shadow.append(style);
  }

  function buildUI() {
    const bar = document.createElement('div');
    bar.className = 'memory-bar';
    bar.innerHTML = `
      <span class="memory-bar__label">Read. Reduce. Recall.</span>
      <span class="memory-status"></span>
      <button type="button" data-memory-act="words">+ In my words…</button>
      <button type="button" data-memory-act="recall">Recall</button>
    `;

    const editor = document.createElement('div');
    editor.className = 'memory-editor';
    editor.innerHTML = `
      <div class="memory-title">In my words</div>
      <div class="memory-subtitle">One thought. One sentence. This belongs to the whole set of anchors.</div>
      <textarea maxlength="${MAX_WORDS}" placeholder="What does this passage mean, in your own words?"></textarea>
      <div class="memory-actions">
        <button type="button" data-memory-act="save-words">Save</button>
        <button type="button" data-memory-act="cancel-words">Cancel</button>
        <span class="memory-count">0 / ${MAX_WORDS}</span>
      </div>
    `;

    const recall = document.createElement('div');
    recall.className = 'memory-recall';
    recall.innerHTML = `
      <div class="memory-title">Recall this thought</div>
      <div class="memory-subtitle">Use the anchors first. Do not reread the passage yet.</div>
      <div class="memory-recall__anchors"></div>
      <div class="memory-question">What was the idea?</div>
      <div class="memory-actions">
        <button type="button" data-memory-act="reveal">Reveal</button>
        <button type="button" data-memory-act="close-recall">Back</button>
      </div>
      <div class="memory-reveal">
        <div class="memory-reveal__label">Your thought</div>
        <div class="memory-reveal__thought"></div>
        <div class="memory-reveal__label">Original</div>
        <div class="memory-reveal__passage"></div>
        <div class="memory-rating">
          <button type="button" data-memory-rate="remembered">Remembered</button>
          <button type="button" data-memory-rate="partial">Partial</button>
          <button type="button" data-memory-rate="forgot">Forgot</button>
        </div>
      </div>
    `;

    state.anchorStrip.after(recall);
    state.anchorStrip.after(editor);
    state.anchorStrip.after(bar);
    state.bar = bar;
    state.editor = editor;
    state.recall = recall;

    const textarea = editor.querySelector('textarea');
    textarea.addEventListener('input', () => {
      editor.querySelector('.memory-count').textContent = `${textarea.value.length} / ${MAX_WORDS}`;
    });

    state.lens.addEventListener('click', onMemoryClick);
  }

  function renderBar() {
    if (!state.bar) return;
    const anchors = currentAnchors();
    const memory = currentMemory();
    const status = state.bar.querySelector('.memory-status');
    const words = state.bar.querySelector('[data-memory-act="words"]');
    const recall = state.bar.querySelector('[data-memory-act="recall"]');

    words.disabled = anchors.length === 0;
    recall.disabled = anchors.length === 0 && !memory;
    words.textContent = memory?.inMyWords ? 'In my words ✓' : '+ In my words…';

    if (memory) {
      const due = !memory.nextRecallAt || memory.nextRecallAt <= Date.now();
      status.textContent = due ? 'Memory saved · recall due' : 'Memory saved';
      status.className = `memory-status ${due ? 'memory-due' : 'memory-saved'}`;
    } else {
      status.textContent = anchors.length ? `${anchors.length}/3 anchors` : '';
      status.className = 'memory-status memory-later';
    }
  }

  function openWords() {
    if (!currentAnchors().length) return;
    const memory = upsertCurrent() || currentMemory();
    const textarea = state.editor.querySelector('textarea');
    textarea.value = memory?.inMyWords || '';
    state.editor.querySelector('.memory-count').textContent = `${textarea.value.length} / ${MAX_WORDS}`;
    state.recall.classList.remove('is-open');
    state.editor.classList.add('is-open');
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }

  function saveWords() {
    const value = normalize(state.editor.querySelector('textarea').value);
    upsertCurrent({ inMyWords: value });
    state.editor.classList.remove('is-open');
    renderBar();
  }

  function openRecall() {
    const memory = upsertCurrent() || currentMemory();
    if (!memory) return;
    state.editor.classList.remove('is-open');
    state.recall.classList.add('is-open');
    state.recall.querySelector('.memory-reveal').classList.remove('is-open');
    const anchors = state.recall.querySelector('.memory-recall__anchors');
    anchors.replaceChildren(...memory.anchors.map(text => {
      const chip = document.createElement('span');
      chip.className = 'memory-chip';
      chip.textContent = text;
      return chip;
    }));
    state.recall.querySelector('.memory-reveal__thought').textContent =
      memory.inMyWords || 'No “In my words” note saved.';
    state.recall.querySelector('.memory-reveal__passage').textContent = memory.passage;
  }

  function revealRecall() {
    state.recall.querySelector('.memory-reveal').classList.add('is-open');
  }

  function rateRecall(result) {
    const memory = currentMemory();
    if (!memory) return;
    const intervals = {
      forgot: DAY,
      partial: 3 * DAY,
      remembered: [3, 7, 30][Math.min(memory.recallCount || 0, 2)] * DAY,
    };
    const items = readStore();
    const index = items.findIndex(item => item.id === memory.id);
    if (index < 0) return;
    items[index] = {
      ...memory,
      recallCount: (memory.recallCount || 0) + 1,
      lastRecallResult: result,
      lastRecalledAt: Date.now(),
      nextRecallAt: Date.now() + intervals[result],
      updatedAt: Date.now(),
    };
    writeStore(items);
    state.recall.classList.remove('is-open');
    renderBar();
  }

  function onMemoryClick(event) {
    const button = event.target.closest('button[data-memory-act],button[data-memory-rate]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    if (button.dataset.memoryRate) {
      rateRecall(button.dataset.memoryRate);
      return;
    }
    const action = button.dataset.memoryAct;
    if (action === 'words') openWords();
    if (action === 'save-words') saveWords();
    if (action === 'cancel-words') state.editor.classList.remove('is-open');
    if (action === 'recall') openRecall();
    if (action === 'reveal') revealRecall();
    if (action === 'close-recall') state.recall.classList.remove('is-open');
  }

  function textRange(root, start, end) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let pos = 0, startNode = null, endNode = null, startOffset = 0, endOffset = 0;
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const length = node.nodeValue?.length || 0;
      if (!startNode && start >= pos && start <= pos + length) {
        startNode = node;
        startOffset = start - pos;
      }
      if (!endNode && end >= pos && end <= pos + length) {
        endNode = node;
        endOffset = end - pos;
      }
      pos += length;
      if (startNode && endNode) break;
    }
    if (!startNode || !endNode) return null;
    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    return range;
  }

  function locateAnchor(text) {
    const full = state.content?.textContent || '';
    let start = full.indexOf(text);
    if (start < 0) {
      const lower = full.toLowerCase();
      start = lower.indexOf(text.toLowerCase());
    }
    if (start < 0) return null;
    return textRange(state.content, start, start + text.length);
  }

  async function restoreStoredAnchors() {
    if (state.restoring || currentAnchors().length) return;
    const memory = currentMemory();
    if (!memory?.anchors?.length || !state.shadow?.getSelection) {
      renderBar();
      return;
    }

    state.restoring = true;
    for (const text of memory.anchors) {
      if (currentAnchors().some(existing => existing === text)) continue;
      const range = locateAnchor(text);
      if (!range) continue;
      const selection = state.shadow.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      state.content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, composed: true }));
      await new Promise(resolve => setTimeout(resolve, 35));
    }
    state.shadow.getSelection()?.removeAllRanges();
    state.restoring = false;
    renderBar();
  }

  function onLensState() {
    if (state.lens.style.display !== 'block') {
      state.editor?.classList.remove('is-open');
      state.recall?.classList.remove('is-open');
      return;
    }
    setTimeout(() => {
      restoreStoredAnchors();
      renderBar();
    }, 40);
  }

  function attach() {
    if (state.attached) return true;
    const host = document.getElementById('viewoupe-host');
    const shadow = host?.shadowRoot;
    const lens = shadow?.querySelector('.lens');
    const content = shadow?.querySelector('.content');
    const anchorStrip = shadow?.querySelector('.anchor-strip');
    if (!host || !shadow || !lens || !content || !anchorStrip) return false;

    state.host = host;
    state.shadow = shadow;
    state.lens = lens;
    state.content = content;
    state.anchorStrip = anchorStrip;
    ensureStyles();
    buildUI();
    renderBar();

    state.anchorObserver = new MutationObserver(() => {
      scheduleSave();
      renderBar();
    });
    state.anchorObserver.observe(anchorStrip, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class'],
    });

    state.openObserver = new MutationObserver(onLensState);
    state.openObserver.observe(lens, { attributes: true, attributeFilter: ['style'] });

    const contentObserver = new MutationObserver(() => {
      if (state.lens.style.display === 'block' && !state.restoring) {
        setTimeout(() => restoreStoredAnchors(), 20);
      }
    });
    contentObserver.observe(content, { childList: true });

    state.attached = true;
    return true;
  }

  function init() {
    if (attach()) return;
    const observer = new MutationObserver(() => {
      if (attach()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 10000);
  }

  window.ViewoupeMemory = {
    version: '0.1.0',
    init,
    items() { return readStore().map(item => ({ ...item, anchors: [...item.anchors] })); },
    clear() { writeStore([]); renderBar(); },
    due() { return readStore().filter(item => !item.nextRecallAt || item.nextRecallAt <= Date.now()); },
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();