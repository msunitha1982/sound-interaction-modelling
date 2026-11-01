/* Stage scaling, tab navigation, hash routing, footer controls, frame loop. */
(function (S) {
  'use strict';

  var STAGE_W = 1280;
  var STAGE_H = 618;
  var SLOW_FACTOR = 0.25; // Slow runs the animation 4 times slower than Normal.

  var ui = S.ui;
  var scenes = S.scenes.slice().sort(function (a, b) { return a.number - b.number; });

  var stage = document.getElementById('stage');
  var scenesBox = document.getElementById('scenes');
  var nav = document.getElementById('nav');
  var footer = document.getElementById('footer');
  var playBtn = document.getElementById('btn-play');
  var stepBtn = document.getElementById('btn-step');
  var resetBtn = document.getElementById('btn-reset');
  var aboutBtn = document.getElementById('btn-about');
  var aboutBox = document.getElementById('about');
  var aboutClose = document.getElementById('btn-about-close');
  var speedInputs = footer.querySelectorAll('input[name="speed"]');

  var clock = { playing: true, speed: 1 };
  var current = null;
  var tabs = [];
  var roots = [];
  var done = {}; // progress checkmarks, in memory only

  // ---------- Stage scaling ----------

  function fit() {
    var s = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
    stage.style.transform = 'scale(' + s + ')';
    stage.style.left = Math.round((window.innerWidth - STAGE_W * s) / 2) + 'px';
    stage.style.top = Math.round((window.innerHeight - STAGE_H * s) / 2) + 'px';
    S.stageScale = s;
    // Canvases size their backing store from the scale.
    window.dispatchEvent(new Event('soundsim:resize'));
  }

  // ---------- Progress marks ----------

  function checkSvg(isDone) {
    var mark = isDone ? '<path d="M2.5 6.5 L5 9 L9.5 3" fill="none" stroke="#1b1b1b" stroke-width="1.6"/>' : '';
    return '<svg class="tab-check" width="12" height="12" viewBox="0 0 12 12" role="img" aria-label="' +
      (isDone ? 'Done' : 'Not done') + '"><rect x="0.5" y="0.5" width="11" height="11" fill="#ffffff" stroke="#4d4d4d"/>' +
      mark + '</svg>';
  }

  function renderCheck(n) {
    var tab = tabs[n - 1];
    var old = tab.querySelector('.tab-check');
    if (old) { old.outerHTML = checkSvg(!!done[n]); }
  }

  // Scenes 1 to 5 call this when their checkmark rule is met.
  function markDone(n) {
    if (done[n]) { return; }
    done[n] = true;
    renderCheck(n);
  }

  // ---------- Tabs and routing ----------

  function buildTabs() {
    scenes.forEach(function (scene, i) {
      var n = scene.number;
      var tab = ui.el('button', {
        type: 'button',
        className: 'tab',
        role: 'tab',
        id: 'tab-' + n,
        'aria-selected': 'false',
        'aria-controls': 'scene-' + n,
        tabindex: '-1'
      });
      tab.innerHTML = scene.preview +
        '<span class="tab-label">' + n + ' ' + scene.tabLabel + '</span>' +
        (scene.hasCheck ? checkSvg(false) : '');
      tab.addEventListener('click', function () { show(n); });
      nav.appendChild(tab);
      tabs.push(tab);

      var root = ui.el('div', { className: 'scene', id: 'scene-' + n, role: 'tabpanel', 'aria-labelledby': 'tab-' + n });
      root.hidden = true;
      scenesBox.appendChild(root);
      roots.push(root);
      scene.init(root);
      scene.index = i;
    });

    nav.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') { return; }
      e.preventDefault();
      var i = current.index + (e.key === 'ArrowRight' ? 1 : -1);
      i = (i + scenes.length) % scenes.length;
      show(scenes[i].number);
      tabs[i].focus();
    });
  }

  function sceneFromHash() {
    var h = window.location.hash.replace('#', '').toLowerCase();
    for (var i = 0; i < scenes.length; i += 1) {
      if (h === String(scenes[i].number) || h === scenes[i].slug) { return scenes[i].number; }
    }
    return null;
  }

  function show(n) {
    var scene = scenes.filter(function (s) { return s.number === n; })[0];
    if (scene === current) { return; }
    if (current) {
      current.leave();
      roots[current.index].hidden = true;
      tabs[current.index].setAttribute('aria-selected', 'false');
      tabs[current.index].setAttribute('tabindex', '-1');
    }
    current = scene;
    roots[scene.index].hidden = false;
    tabs[scene.index].setAttribute('aria-selected', 'true');
    tabs[scene.index].setAttribute('tabindex', '0');
    footer.classList.toggle('summary-mode', !!scene.isSummary);
    closeAbout();
    resetClock();
    scene.enter();
    // Keep an alias hash (#reflection) if it already names this scene.
    if (sceneFromHash() !== n) { window.location.hash = '#' + n; }
  }

  window.addEventListener('hashchange', function () {
    var n = sceneFromHash();
    if (n !== null) { show(n); }
  });

  // ---------- Footer ----------

  function renderClock() {
    playBtn.textContent = clock.playing ? 'Pause' : 'Play';
    stepBtn.disabled = clock.playing;
    for (var i = 0; i < speedInputs.length; i += 1) {
      speedInputs[i].checked = speedInputs[i].value === (clock.speed === 1 ? 'normal' : 'slow');
    }
  }

  // Entering a scene and Reset All both return to Normal speed, playing.
  function resetClock() {
    clock.playing = true;
    clock.speed = 1;
    renderClock();
    S.audio.setPaused(false);
  }

  // Pause freezes simulation time and audio.
  playBtn.addEventListener('click', function () {
    clock.playing = !clock.playing;
    renderClock();
    S.audio.setPaused(!clock.playing);
  });

  stepBtn.addEventListener('click', function () {
    if (!clock.playing) { current.update(0, 1 / 20); }
  });

  for (var si = 0; si < speedInputs.length; si += 1) {
    speedInputs[si].addEventListener('change', function (e) {
      clock.speed = e.target.value === 'slow' ? SLOW_FACTOR : 1;
    });
  }

  resetBtn.addEventListener('click', function () {
    resetClock();
    current.reset();
  });

  // ---------- About the numbers ----------

  ui.aboutLines.forEach(function (line) {
    document.getElementById('about-list').appendChild(ui.el('li', { text: line }));
  });

  function openAbout() {
    aboutBox.hidden = false;
    aboutBtn.setAttribute('aria-expanded', 'true');
    aboutBox.focus();
  }

  function closeAbout() {
    if (aboutBox.hidden) { return; }
    aboutBox.hidden = true;
    aboutBtn.setAttribute('aria-expanded', 'false');
  }

  aboutBtn.addEventListener('click', function () {
    if (aboutBox.hidden) { openAbout(); } else { closeAbout(); }
  });
  aboutClose.addEventListener('click', function () {
    closeAbout();
    aboutBtn.focus();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !aboutBox.hidden) {
      closeAbout();
      aboutBtn.focus();
    }
  });

  // ---------- Frame loop ----------

  var rafId = 0;
  var lastTime = 0;

  function frame(t) {
    // Clamp dt to 50 ms so a slow frame never causes a jump.
    var dt = lastTime ? Math.min((t - lastTime) / 1000, 0.05) : 0;
    lastTime = t;
    if (clock.playing) { current.update(dt, dt * clock.speed); }
    current.draw();
    rafId = window.requestAnimationFrame(frame);
  }

  function startLoop() {
    lastTime = 0;
    rafId = window.requestAnimationFrame(frame);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      window.cancelAnimationFrame(rafId);
      S.audio.setPaused(true);
    } else {
      S.audio.setPaused(!clock.playing);
      startLoop();
    }
  });

  // ---------- Start ----------

  // Scenes read clock.speed (1 Normal, 0.25 Slow) for the slowdown label.
  S.main = { markDone: markDone, clock: clock };

  buildTabs();
  fit();
  window.addEventListener('resize', fit);
  show(sceneFromHash() || 1);
  startLoop();
})(window.SoundSim);
