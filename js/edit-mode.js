/* TEMPORARY owner tool (remove in Stage 7). Open the page with ?edit in the
   URL, for example index.html?edit#1. Click any text to change it, then use
   "Copy changes" and paste the list into the chat so the change can be made
   in the code and the docs. Nothing is saved; a reload clears all edits.
   Without ?edit this file does nothing. */
(function () {
  'use strict';
  if (!/[?&]edit\b/.test(window.location.search)) { return; }

  var on = true;
  var changes = [];   // {el, where, was, now}
  var notes = [];
  var editing = null; // {el, textNode}

  var css = [
    '.em-bar{position:fixed;left:8px;top:8px;z-index:1000;display:flex;gap:6px;align-items:center;',
    'padding:4px 6px;background:#fff8d6;border:1px solid #1b1b1b;font:13px "Trebuchet MS",Roboto,Arial,sans-serif;color:#1b1b1b}',
    '.em-bar button,.em-box button{font:inherit;padding:2px 8px;border:1px solid #1b1b1b;background:#fff;cursor:pointer;border-radius:2px}',
    '.em-bar button[aria-pressed=true]{background:#1b1b1b;color:#fff}',
    '.em-hl{position:fixed;z-index:999;pointer-events:none;outline:1px dashed #D55E00}',
    '.em-box{position:fixed;z-index:1001;width:380px;padding:8px;background:#fff8d6;border:1px solid #1b1b1b;',
    'font:13px "Trebuchet MS",Roboto,Arial,sans-serif;color:#1b1b1b}',
    '.em-box textarea{width:100%;height:90px;font:14px "Trebuchet MS",Roboto,Arial,sans-serif;box-sizing:border-box}',
    '.em-box p{margin:0 0 6px}.em-row{display:flex;gap:6px;margin-top:6px}'
  ].join('');
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  function make(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) { e.className = cls; }
    if (text) { e.textContent = text; }
    return e;
  }

  // ---------- Toolbar ----------

  var bar = make('div', 'em-bar');
  var toggle = make('button', null, 'Click to edit: On');
  toggle.setAttribute('aria-pressed', 'true');
  var count = make('span', null, '0 changes');
  var copyBtn = make('button', null, 'Copy changes');
  var noteBtn = make('button', null, 'Add note');
  var moveBtn = make('button', null, 'Move bar down');
  bar.appendChild(make('strong', null, 'Edit mode'));
  bar.appendChild(toggle);
  bar.appendChild(count);
  bar.appendChild(copyBtn);
  bar.appendChild(noteBtn);
  bar.appendChild(moveBtn);
  document.body.appendChild(bar);

  var hl = make('div', 'em-hl');
  hl.hidden = true;
  document.body.appendChild(hl);

  var box = make('div', 'em-box');
  box.hidden = true;
  var boxMsg = make('p');
  var area = document.createElement('textarea');
  var row = make('div', 'em-row');
  var saveBtn = make('button', null, 'Save');
  var cancelBtn = make('button', null, 'Cancel');
  row.appendChild(saveBtn);
  row.appendChild(cancelBtn);
  box.appendChild(boxMsg);
  box.appendChild(area);
  box.appendChild(row);
  document.body.appendChild(box);

  function renderCount() {
    var n = changes.length + notes.length;
    count.textContent = n + (n === 1 ? ' change' : ' changes');
  }

  // The bar covers part of the page; move it to reach what is underneath.
  moveBtn.addEventListener('click', function () {
    var down = moveBtn.textContent === 'Move bar down';
    bar.style.top = down ? 'auto' : '8px';
    bar.style.bottom = down ? '8px' : 'auto';
    moveBtn.textContent = down ? 'Move bar up' : 'Move bar down';
  });

  toggle.addEventListener('click', function () {
    on = !on;
    toggle.textContent = 'Click to edit: ' + (on ? 'On' : 'Off');
    toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
    hl.hidden = true;
  });

  // ---------- Finding the text that was clicked ----------

  function ownTextNodes(el) {
    var out = [];
    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3 && n.nodeValue.trim()) { out.push(n); }
    }
    return out;
  }

  // Walk up from the click target to the nearest element that has its own text.
  function textTarget(el) {
    var tab = el.closest && el.closest('[role=tab]');
    if (tab) { return tab.querySelector('.tab-label'); }
    if (el.tagName === 'INPUT' && el.parentElement) { el = el.parentElement; }
    for (var e = el; e && e !== document.body; e = e.parentElement) {
      if (ownTextNodes(e).length) { return e; }
    }
    return null;
  }

  function where(el) {
    var scene = el.closest('.scene');
    var title = scene ? scene.querySelector('.scene-title') : null;
    var place = title ? 'Scene "' + title.textContent + '"' :
      el.closest('#nav') ? 'Tabs' : el.closest('#footer') ? 'Footer' : el.closest('#about') ? 'About the numbers box' : 'Page';
    var part = el.closest('[role=tab]') ? 'tab label' :
      el.closest('.caption-bar') ? 'caption bar' :
      el.closest('.think-panel') ? 'Think panel' :
      el.closest('.panel-title') ? 'panel title' :
      el.closest('.ideas') ? 'Ideas panel' :
      el.closest('.panel') ? 'panel "' + (el.closest('.panel').querySelector('.panel-title, summary') || {}).textContent + '"' :
      el.closest('.title-strip') ? 'title strip' : el.tagName.toLowerCase();
    return place + ', ' + part;
  }

  function isLive(el) {
    return !!el.closest('.caption-bar, .slider-value, .slider-end');
  }

  // ---------- Editor box ----------

  function openBox(x, y, message, text) {
    boxMsg.textContent = message;
    area.value = text;
    box.hidden = false;
    var left = Math.min(x, window.innerWidth - 400);
    var top = Math.min(y + 12, window.innerHeight - 170);
    box.style.left = Math.max(4, left) + 'px';
    box.style.top = Math.max(4, top) + 'px';
    area.focus();
    area.select();
  }

  function closeBox() {
    box.hidden = true;
    editing = null;
  }

  function save() {
    if (!editing) { closeBox(); return; }
    var text = area.value.trim();
    if (editing && editing.note) {
      if (text) { notes.push(text); }
    } else if (editing) {
      var el = editing.el;
      var nodes = ownTextNodes(el);
      var was = nodes.map(function (n) { return n.nodeValue; }).join(' ').replace(/\s+/g, ' ').trim();
      if (text !== was) {
        nodes[0].nodeValue = text;
        for (var i = 1; i < nodes.length; i += 1) { nodes[i].nodeValue = ''; }
        var found = changes.filter(function (ch) { return ch.el === el; })[0];
        if (found) { found.now = text; } else { changes.push({ el: el, where: where(el), was: was, now: text, live: isLive(el) }); }
      }
    }
    renderCount();
    closeBox();
  }

  saveBtn.addEventListener('click', save);
  cancelBtn.addEventListener('click', closeBox);
  area.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); }
    if (e.key === 'Escape') { e.preventDefault(); closeBox(); }
    e.stopPropagation();
  });

  noteBtn.addEventListener('click', function () {
    editing = { note: true };
    var r = noteBtn.getBoundingClientRect();
    openBox(r.left, r.bottom, 'Write any other change, for example a label drawn inside the simulation picture.', '');
  });

  // ---------- Click to edit ----------

  function inTool(t) { return bar.contains(t) || box.contains(t); }

  document.addEventListener('mouseover', function (e) {
    if (!on || inTool(e.target)) { hl.hidden = true; return; }
    var el = textTarget(e.target);
    if (!el) { hl.hidden = true; return; }
    var r = el.getBoundingClientRect();
    hl.hidden = false;
    hl.style.left = r.left - 2 + 'px';
    hl.style.top = r.top - 2 + 'px';
    hl.style.width = r.width + 4 + 'px';
    hl.style.height = r.height + 4 + 'px';
  }, true);

  // Stop the page from reacting (buttons, tabs, radios) while editing is on.
  ['pointerdown', 'mousedown', 'pointerup', 'mouseup'].forEach(function (type) {
    document.addEventListener(type, function (e) {
      if (on && !inTool(e.target)) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  });

  document.addEventListener('click', function (e) {
    if (!on || inTool(e.target)) { return; }
    e.preventDefault();
    e.stopPropagation();
    if (e.target.tagName === 'CANVAS') {
      editing = { note: true };
      openBox(e.clientX, e.clientY, 'Labels inside the simulation picture cannot be edited directly. Write the label and the new text you want.', '');
      return;
    }
    var el = textTarget(e.target);
    if (!el) { return; }
    editing = { el: el };
    var current = ownTextNodes(el).map(function (n) { return n.nodeValue; }).join(' ').replace(/\s+/g, ' ').trim();
    openBox(e.clientX, e.clientY, isLive(el) ?
      'This text is generated live, so it will change back on screen. Your change is still saved in the list.' :
      'Edit the text, then press Enter or Save.', current);
  }, true);

  // ---------- Copy changes ----------

  function report() {
    var lines = ['Edit-mode changes (' + (changes.length + notes.length) + ')', ''];
    changes.forEach(function (ch, i) {
      lines.push((i + 1) + '. ' + ch.where + (ch.live ? ' (live text)' : ''));
      lines.push('   Was: ' + ch.was);
      lines.push('   Now: ' + ch.now);
    });
    if (notes.length) {
      lines.push('', 'Notes:');
      notes.forEach(function (n) { lines.push('- ' + n); });
    }
    return lines.join('\n');
  }

  copyBtn.addEventListener('click', function () {
    var text = report();
    function fallback() {
      editing = null;
      openBox(80, 60, 'Copy this text (Ctrl+C) and paste it into the chat.', text);
      saveBtn.hidden = true;
      cancelBtn.textContent = 'Close';
      cancelBtn.addEventListener('click', function restore() {
        saveBtn.hidden = false;
        cancelBtn.textContent = 'Cancel';
        cancelBtn.removeEventListener('click', restore);
      });
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () {
        copyBtn.textContent = 'Copied';
        window.setTimeout(function () { copyBtn.textContent = 'Copy changes'; }, 1500);
      }, fallback);
    } else {
      fallback();
    }
  });
})();
