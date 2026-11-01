/* Scene 1: What is sound? */
(function (S) {
  'use strict';
  var ui = S.ui;
  var model = S.model;

  var TIME_SCALE = 400;                       // Normal view is 400x slower than real sound
  var SPEED = model.SPEED_CM / TIME_SCALE;    // cm per animation second
  var MAX_STRAIN = 0.95;                      // strain at 100% amplitude (exaggerated so it shows; below 1 so dots never cross)
  var TUBE_CM = 240;                          // visible tube length
  var TRACER_CM = 100;
  var ROWS = 7;
  var MID_ROW = 3;
  var REVEAL_SECONDS = 6;
  var RECENT = 4;                             // caption window for pitch and volume changes, s
  var PROBE_STEP = 1 / 60;                    // probe chart sample step, animation s
  var PROBE_SAMPLES = 180;                    // 3 s of animation time
  var TAPE_START_CM = 40;

  // Layout in stage units inside the sim area (about 698 x 264).
  var L = {
    tubeLeft: 54, tubeTop: 36, tubeBottom: 100,
    labelY: 24, bracketY: 107, bracketTextY: 124, tracerTextY: 142,
    graphTop: 152, graphZero: 198, graphPx: 44 / MAX_STRAIN,
    chartW: 170, chartH: 84
  };

  var C = {
    ink: '#1b1b1b', ink2: '#4d4d4d', panel: '#ebe8df', rule: '#b5b1a3',
    molecule: '#3d4651', tracer: '#CC79A7', sim: '#ffffff'
  };
  var FONT = '13px "Trebuchet MS", "Segoe UI", Roboto, Arial, sans-serif';
  var MONO = '13px ui-monospace, Consolas, Menlo, "DejaVu Sans Mono", monospace';

  function defaults() {
    return {
      soundOn: false,
      pitch: 500,
      volume: 50,
      showTracer: true,
      showLabels: true,
      showGraph: false,
      pitchAge: 99,           // real seconds since the pitch slider moved
      volumeAge: 99,
      onSeconds: 0,           // real seconds of sound on with tracer visible, after recording
      pitchChangedWhileOn: false,
      tape: { out: false, bx: 0, by: 0, tx: 0 },
      probe: { out: false, x: 0 }
    };
  }

  var state = defaults();
  var c = {};          // controls
  var canvas = null;
  var tube = null;
  var emitter = S.wave1d.createEmitter(SPEED);
  var voice = null;
  var think = null;
  var tray = null;
  var bgKey = '';
  var probeHist = new Float32Array(PROBE_SAMPLES);
  var probeHead = 0;
  var probeAcc = 0;
  var drag = null;

  // ---------- Tab preview and tool icons ----------

  var dotsX = [14, 16, 17.5, 19, 21, 24, 27.5, 30.5, 32, 33.5, 35, 37, 40];
  var preview = '<svg class="tab-preview" width="44" height="30" viewBox="0 0 44 30" aria-hidden="true">' +
    '<rect x="2" y="11" width="4" height="8" fill="#ebe8df" stroke="#1b1b1b"/>' +
    '<path d="M6 11 L10 7 L10 23 L6 19 Z" fill="#ebe8df" stroke="#1b1b1b"/>' +
    dotsX.map(function (x) { return '<circle cx="' + x + '" cy="15" r="1.1" fill="#3d4651"/>'; }).join('') +
    '</svg>';

  var tapeIcon = '<svg width="26" height="20" viewBox="0 0 26 20" aria-hidden="true" fill="none" stroke="currentColor">' +
    '<rect x="1.5" y="3.5" width="13" height="13" rx="2"/>' +
    '<circle cx="8" cy="10" r="3"/>' +
    '<path d="M14.5 13.5 H24.5" stroke-width="2"/>' +
    '<path d="M24.5 11 V16"/></svg>';
  var probeIcon = '<svg width="26" height="20" viewBox="0 0 26 20" aria-hidden="true" fill="none" stroke="currentColor">' +
    '<circle cx="8" cy="10" r="6"/>' +
    '<path d="M8 6 V14 M4 10 H12" stroke-width="0.8"/>' +
    '<path d="M14 10 H25" stroke-width="2"/></svg>';

  // ---------- Helpers ----------

  function fmtHz(f) { return f.toLocaleString('en-US'); }
  function lambdaCm() { return model.wavelengthCm(state.pitch); }
  function tubeMid() { return (L.tubeTop + L.tubeBottom) / 2; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function tapeCm() {
    return Math.round(Math.abs(state.tape.tx - state.tape.bx) / tube.pxPerCm);
  }
  function tapeOnTube() {
    return state.tape.out && state.tape.by >= L.tubeTop && state.tape.by <= L.tubeBottom;
  }

  function syncEmitter() {
    // Square-root scale: strain still rises steadily with the slider, but
    // mid settings show clear compressions without dots crossing at 100%.
    var strain = state.soundOn ? MAX_STRAIN * Math.sqrt(state.volume / 100) : 0;
    emitter.set(state.pitch / TIME_SCALE, strain);
  }

  function startSound() {
    S.audio.ensure();
    voice = S.audio.startVoice({ type: 'sine', freq: state.pitch, gain: state.volume / 100 });
  }
  function stopSound() {
    if (voice) { voice.stop(); voice = null; }
  }

  function checkDone() {
    if (think.revealed() && state.pitchChangedWhileOn) { S.main.markDone(1); }
  }

  // ---------- Tools ----------

  var tapeTool = {
    label: 'Measuring tape',
    icon: tapeIcon,
    isOut: function () { return state.tape.out; },
    placeDefault: function () {
      tapeTool.placeAt(tube.xOf(60), tubeMid());
    },
    placeAt: function (x, y) {
      state.tape.out = true;
      state.tape.bx = x;
      state.tape.by = y;
      state.tape.tx = Math.min(x + TAPE_START_CM * tube.pxPerCm, canvas.w - 4);
    },
    putAway: function () { state.tape.out = false; }
  };

  var probeTool = {
    label: 'Probe',
    icon: probeIcon,
    isOut: function () { return state.probe.out; },
    placeDefault: function () { probeTool.placeAt(tube.xOf(170)); },
    placeAt: function (x) {
      state.probe.out = true;
      state.probe.x = clamp(x, L.tubeLeft, canvas.w - 4);
    },
    putAway: function () { state.probe.out = false; }
  };

  function chartLeft() {
    return clamp(state.probe.x - L.chartW / 2, 2, canvas.w - L.chartW - 2);
  }

  function hitTest(p) {
    var t = state.tape;
    if (t.out && Math.abs(p.x - t.tx) <= 8 && Math.abs(p.y - t.by) <= 10) { return 'tip'; }
    if (t.out && Math.abs(p.x - t.bx) <= 12 && Math.abs(p.y - t.by) <= 12) { return 'tape'; }
    if (state.probe.out) {
      var cx = chartLeft();
      if (Math.abs(p.x - state.probe.x) <= 11 && Math.abs(p.y - tubeMid()) <= 11) { return 'probe'; }
      if (p.x >= cx && p.x <= cx + L.chartW && p.y >= L.graphTop - 2 && p.y <= L.graphTop + L.chartH) { return 'probe'; }
    }
    return null;
  }

  function onPointerDown(e) {
    var p = canvas.toSim(e.clientX, e.clientY);
    var kind = hitTest(p);
    if (!kind) { return; }
    canvas.fg.setPointerCapture(e.pointerId);
    drag = { kind: kind, x: p.x, y: p.y };
    canvas.fg.style.cursor = 'grabbing';
  }

  function onPointerMove(e) {
    var p = canvas.toSim(e.clientX, e.clientY);
    if (!drag) {
      canvas.fg.style.cursor = hitTest(p) ? 'grab' : 'default';
      return;
    }
    var dx = p.x - drag.x;
    var dy = p.y - drag.y;
    drag.x = p.x;
    drag.y = p.y;
    var t = state.tape;
    if (drag.kind === 'tip') {
      t.tx = clamp(t.tx + dx, 0, canvas.w);
    } else if (drag.kind === 'tape') {
      t.bx += dx;
      t.tx += dx;
      t.by += dy;
    } else {
      state.probe.x = clamp(state.probe.x + dx, L.tubeLeft, canvas.w - 4);
    }
  }

  function onPointerUp(e) {
    if (!drag) { return; }
    // Dropping a tool outside the sim area (for example on the tray) puts it back.
    if (!canvas.contains(e.clientX, e.clientY)) {
      if (drag.kind === 'probe') { probeTool.putAway(); } else { tapeTool.putAway(); }
      tray.sync();
    }
    drag = null;
    canvas.fg.style.cursor = 'default';
  }

  // ---------- Captions ----------

  function caption() {
    var f = state.pitch;
    var lam = lambdaCm().toFixed(1);
    if (!state.soundOn) { return ''; } // caption bar hidden while no sound is playing
    if (tapeOnTube()) {
      return 'Measuring tape reads ' + tapeCm() + ' cm between two compressions. Wavelength = speed of sound / frequency = 34,300 cm/s / ' +
        fmtHz(f) + ' Hz = ' + lam + ' cm.';
    }
    if (state.pitchAge < RECENT) {
      return 'Frequency ' + fmtHz(f) + ' Hz: ' + fmtHz(f) + ' compressions pass any point each second. Wavelength is ' + lam +
        ' cm. Higher frequency means shorter wavelength.';
    }
    if (state.volumeAge < RECENT) {
      return 'Amplitude ' + state.volume + '%: the molecules move farther back and forth, so compressions are denser and rarefactions are thinner.';
    }
    return 'The compressions travel to the right. The tracer molecule moves back and forth and stays near its starting position.';
  }

  // ---------- Drawing ----------

  function drawBg() {
    var ctx = canvas.ctxBg;
    var w = canvas.w;
    ctx.clearRect(0, 0, w, canvas.h);
    ctx.font = FONT;
    ctx.textBaseline = 'alphabetic';

    // Slowdown factor, always shown.
    ctx.fillStyle = C.ink2;
    ctx.textAlign = 'left';
    ctx.fillText('Animation: ' + (S.main.clock.speed === 1 ? '400x' : '1,600x') + ' slower than real sound', 8, 16);

    // Tube walls. The tube runs off the right edge: no end wall.
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(L.tubeLeft - 2, L.tubeTop - 0.5);
    ctx.lineTo(w, L.tubeTop - 0.5);
    ctx.moveTo(L.tubeLeft - 2, L.tubeBottom + 0.5);
    ctx.lineTo(w, L.tubeBottom + 0.5);
    ctx.stroke();

    // Speaker cabinet.
    ctx.fillStyle = C.panel;
    ctx.fillRect(8.5, 46.5, 26, 44);
    ctx.strokeRect(8.5, 46.5, 26, 44);
    ctx.fillStyle = C.ink;
    ctx.fillText('Speaker', 6, 118);

    // Tracer starting position.
    if (state.showTracer) {
      var x = Math.round(tube.xOf(TRACER_CM)) + 0.5;
      ctx.strokeStyle = C.ink2;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(x, L.tubeTop - 6);
      ctx.lineTo(x, L.tubeBottom + 6);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Pressure graph axes and labels.
    if (state.showGraph) {
      ctx.strokeStyle = C.rule;
      ctx.beginPath();
      ctx.moveTo(L.tubeLeft, L.graphZero + 0.5);
      ctx.lineTo(w, L.graphZero + 0.5);
      ctx.moveTo(L.tubeLeft - 0.5, L.graphTop);
      ctx.lineTo(L.tubeLeft - 0.5, L.graphZero + 46);
      ctx.stroke();
      ctx.fillStyle = C.ink;
      ctx.font = 'bold ' + FONT;
      ctx.fillText('Pressure', 4, L.graphTop + 8);
      ctx.font = FONT;
      ctx.fillStyle = C.ink2;
      ctx.fillText('higher', 4, L.graphZero - 22);
      ctx.fillText('normal', 4, L.graphZero + 4);
      ctx.fillText('lower', 4, L.graphZero + 34);
      ctx.fillText('Position along the tube', L.tubeLeft + 4, canvas.h - 6);
    }
  }

  function leader(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Compression and rarefaction labels: the text stays put so it can be
  // read; the leader line follows the nearest compression or rarefaction.
  function drawFeatureLabels(ctx, lam) {
    var specs = [['Compression', 130, 1], ['Rarefaction', 190, -1]];
    ctx.textAlign = 'center';
    specs.forEach(function (sp) {
      var i = tube.extremum(sp[1] - lam / 2, sp[1] + lam / 2, sp[2], 0.02);
      if (i < 0) { return; }
      var tx = tube.xOf(sp[1]);
      var fx = tube.xOf(tube.colCm[i]);
      ctx.fillText(sp[0], tx, L.labelY);
      leader(ctx, tx, L.labelY + 3, fx, L.tubeTop - 2);
    });
  }

  // Wavelength bracket between two neighboring compressions. The text is
  // fixed at an anchor that the bracket always straddles. Hidden when one
  // wavelength does not fit comfortably in the visible tube.
  function drawWavelength(ctx, lam) {
    if (lam > 117) { return; }
    var anchor = Math.min(190, 235 - lam);
    var i1 = tube.extremum(anchor - lam, anchor, 1, 0.02);
    if (i1 < 0) { return; }
    var c1 = tube.colCm[i1];
    var i2 = tube.extremum(c1 + lam / 2, c1 + lam * 1.5, 1, 0.02);
    if (i2 < 0) { return; }
    var x1 = tube.xOf(c1);
    var x2 = tube.xOf(tube.colCm[i2]);
    var y = L.bracketY;
    ctx.beginPath();
    ctx.moveTo(x1, y - 4);
    ctx.lineTo(x1, y + 4);
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.moveTo(x2, y - 4);
    ctx.lineTo(x2, y + 4);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillText('Wavelength', tube.xOf(anchor), L.bracketTextY);
  }

  function drawSpeakerCone(ctx) {
    var dx = L.tubeLeft + emitter.dispAt(0) * tube.pxPerCm;
    ctx.fillStyle = C.panel;
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(34.5, 58);
    ctx.lineTo(dx, L.tubeTop + 2);
    ctx.lineTo(dx, L.tubeBottom - 2);
    ctx.lineTo(34.5, 79);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 2;
    leader(ctx, dx, L.tubeTop + 2, dx, L.tubeBottom - 2);
    ctx.lineWidth = 1;
  }

  function drawTracer(ctx) {
    var x = tube.xOf(TRACER_CM + emitter.dispAt(TRACER_CM));
    var y = tube.rowY[MID_ROW];
    var x0 = tube.xOf(TRACER_CM);
    ctx.strokeStyle = C.ink2;
    leader(ctx, x0 + 12, L.tracerTextY - 12, x + 2, y + 4);
    ctx.fillStyle = C.ink;
    ctx.textAlign = 'left';
    ctx.fillText('Tracer molecule', x0 + 8, L.tracerTextY);
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = C.tracer;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = C.ink;
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  function drawProbe(ctx) {
    var x = state.probe.x;
    var y = tubeMid();
    var cx = chartLeft();
    var top = L.graphTop;
    ctx.strokeStyle = C.ink;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.moveTo(x - 9, y);
    ctx.lineTo(x + 9, y);
    ctx.moveTo(x, y - 9);
    ctx.lineTo(x, y + 9);
    ctx.moveTo(x, y + 9);
    ctx.lineTo(x, top);
    ctx.stroke();

    // Strip chart: pressure at the probe over the last 3 s of animation time.
    ctx.fillStyle = C.sim;
    ctx.fillRect(cx, top, L.chartW, L.chartH);
    ctx.strokeRect(cx + 0.5, top + 0.5, L.chartW - 1, L.chartH - 1);
    ctx.fillStyle = C.ink;
    ctx.textAlign = 'left';
    ctx.fillText('Pressure at probe', cx + 6, top + 15);
    ctx.fillStyle = C.ink2;
    ctx.textAlign = 'right';
    ctx.fillText('last 3 s', cx + L.chartW - 6, top + L.chartH - 5);
    var zero = top + 46;
    var left = cx + 6;
    var span = L.chartW - 12;
    ctx.strokeStyle = C.rule;
    leader(ctx, left, zero + 0.5, left + span, zero + 0.5);
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (var i = 0; i < PROBE_SAMPLES; i += 1) {
      var v = probeHist[(probeHead + i) % PROBE_SAMPLES];
      var px = left + span * i / (PROBE_SAMPLES - 1);
      var py = zero - v * (24 / MAX_STRAIN);
      if (i === 0) { ctx.moveTo(px, py); } else { ctx.lineTo(px, py); }
    }
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  function drawTape(ctx) {
    var t = state.tape;
    var dir = t.tx >= t.bx ? 1 : -1;
    var len = Math.abs(t.tx - t.bx);
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2;
    leader(ctx, t.bx, t.by, t.tx, t.by);
    ctx.lineWidth = 1;
    // A tick every 10 cm.
    ctx.beginPath();
    for (var d = 10 * tube.pxPerCm; d < len; d += 10 * tube.pxPerCm) {
      ctx.moveTo(t.bx + dir * d, t.by - 4);
      ctx.lineTo(t.bx + dir * d, t.by);
    }
    // Tip marker.
    ctx.moveTo(t.tx, t.by - 8);
    ctx.lineTo(t.tx, t.by + 8);
    ctx.stroke();
    // Case.
    ctx.fillStyle = C.panel;
    ctx.fillRect(t.bx - 11, t.by - 11, 22, 22);
    ctx.strokeRect(t.bx - 10.5, t.by - 10.5, 21, 21);
    ctx.beginPath();
    ctx.arc(t.bx, t.by, 5, 0, Math.PI * 2);
    ctx.stroke();
    // Reading.
    var text = tapeCm() + ' cm';
    ctx.font = MONO;
    ctx.textAlign = 'center';
    var tw = ctx.measureText(text).width + 8;
    ctx.fillStyle = C.sim;
    ctx.fillRect(t.bx - tw / 2, t.by - 30, tw, 16);
    ctx.strokeRect(t.bx - tw / 2 + 0.5, t.by - 29.5, tw - 1, 15);
    ctx.fillStyle = C.ink;
    ctx.fillText(text, t.bx, t.by - 18);
    ctx.font = FONT;
  }

  function draw() {
    if (!canvas.w) { return; }
    var key = [state.showTracer, state.showGraph, S.main.clock.speed].join();
    if (canvas.needsBg || key !== bgKey) {
      bgKey = key;
      canvas.needsBg = false;
      drawBg();
    }

    var ctx = canvas.ctx;
    var w = canvas.w;
    var lam = lambdaCm();
    ctx.clearRect(0, 0, w, canvas.h);
    ctx.font = FONT;
    ctx.lineWidth = 1;

    tube.sampleIncident(emitter);
    tube.hidden = state.showTracer ? Math.round(TRACER_CM / tube.spacing - 0.5) * ROWS + MID_ROW : -1;
    tube.drawDots(ctx, C.molecule, w);
    drawSpeakerCone(ctx);

    ctx.strokeStyle = C.ink2;
    ctx.fillStyle = C.ink;
    if (state.showLabels) { drawFeatureLabels(ctx, lam); }
    if (!state.tape.out) { drawWavelength(ctx, lam); }
    if (state.showTracer) { drawTracer(ctx); }

    if (state.showGraph) {
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1.5;
      tube.drawPressure(ctx, L.graphZero, L.graphPx, w);
      ctx.lineWidth = 1;
    }
    if (state.probe.out) { drawProbe(ctx); }
    if (state.tape.out) { drawTape(ctx); }

    ui.setCaption(c.caption, caption());
  }

  // ---------- Controls ----------

  function sync() {
    c.sound.set(state.soundOn);
    c.pitch.set(state.pitch);
    c.volume.set(state.volume);
    c.tracer.set(state.showTracer);
    c.labels.set(state.showLabels);
    c.graph.set(state.showGraph);
    c.ideas.reset();
    tray.sync();
  }

  var scene = {
    number: 1,
    slug: 'sound',
    tabLabel: 'What is sound?',
    title: 'What is sound?',
    goal: 'What is actually happening when sound moves through air?',
    preview: preview,
    hasCheck: true,

    init: function (root) {
      var lay = ui.sceneLayout(root, scene);
      c.caption = lay.caption;
      canvas = ui.simCanvas(lay.sim);
      canvas.fg.addEventListener('pointerdown', onPointerDown);
      canvas.fg.addEventListener('pointermove', onPointerMove);
      canvas.fg.addEventListener('pointerup', onPointerUp);

      think = ui.thinkPanel(lay.think, {
        question: 'The tracer molecule is 100 cm from the speaker. When sound passes it, what will the tracer molecule do?',
        options: [
          { value: 'a', label: 'Travel with the wave to the far end of the tube.' },
          { value: 'b', label: 'Move back and forth around the same spot.' },
          { value: 'c', label: 'Travel back toward the speaker.' }
        ],
        correct: 'b',
        runText: 'Turn the sound on and watch the tracer molecule.',
        mainIdea: 'Sound is a disturbance that travels through a material. The molecules only move back and forth around one place and pass the disturbance to their neighbors. Frequency is how many compressions pass each second. We hear it as pitch. Amplitude is how far the molecules move. We hear it as loudness.',
        onChange: checkDone
      });

      c.ideas = ui.ideasPanel([
        'Air is made of molecules.',
        'Compression: a region where molecules are closer together than normal.',
        'Rarefaction: a region where molecules are farther apart than normal.',
        'Frequency: how many compressions pass a point each second, measured in hertz (Hz). We hear frequency as pitch.',
        'Amplitude: how far the molecules move from their resting place. A larger amplitude sounds louder.'
      ]);

      var sound = ui.panel('Sound');
      c.sound = ui.toggleButton({
        offLabel: 'Sound: Off',
        onLabel: 'Sound: On',
        onChange: function (on) {
          state.soundOn = on;
          state.onSeconds = 0;
          if (on) { startSound(); } else { stopSound(); }
          syncEmitter();
        }
      });
      c.pitch = ui.slider({
        label: 'Frequency', min: model.PITCH_MIN, max: model.PITCH_MAX, step: 10, value: state.pitch, unit: 'Hz',
        onInput: function (v) {
          state.pitch = v;
          state.pitchAge = 0;
          if (state.soundOn) {
            state.pitchChangedWhileOn = true;
            checkDone();
          }
          if (voice) { voice.set({ freq: v }); }
          syncEmitter();
        }
      });
      c.volume = ui.slider({
        label: 'Amplitude', min: 0, max: 100, step: 1, value: state.volume, unit: '%',
        onInput: function (v) {
          state.volume = v;
          state.volumeAge = 0;
          if (voice) { voice.set({ gain: v / 100 }); }
          syncEmitter();
        }
      });
      sound.body.appendChild(c.sound.el);
      sound.body.appendChild(c.pitch.el);
      sound.body.appendChild(c.volume.el);

      var show = ui.panel('Show');
      c.tracer = ui.checkbox({ label: 'Tracer molecule', checked: state.showTracer, onChange: function (v) { state.showTracer = v; } });
      c.labels = ui.checkbox({ label: 'Compression and rarefaction labels', checked: state.showLabels, onChange: function (v) { state.showLabels = v; } });
      c.graph = ui.checkbox({ label: 'Pressure graph', checked: state.showGraph, onChange: function (v) { state.showGraph = v; } });
      show.body.appendChild(c.tracer.el);
      show.body.appendChild(c.labels.el);
      show.body.appendChild(c.graph.el);

      var tools = ui.panel('Tools');
      tray = ui.toolTray(canvas, [tapeTool, probeTool]);
      tools.body.appendChild(tray.el);

      lay.colA.appendChild(c.ideas.root);
      lay.colA.appendChild(sound.root);
      lay.colB.appendChild(show.root);
      lay.colB.appendChild(tools.root);
    },

    enter: function () {
      canvas.resize();
      tube = S.wave1d.createTube({
        left: L.tubeLeft, right: canvas.w, top: L.tubeTop, bottom: L.tubeBottom,
        lengthCm: TUBE_CM, cols: 220, extraCols: 12, rows: ROWS
      });
      scene.reset();
    },

    leave: function () {
      stopSound();
      S.audio.stopAll();
    },

    update: function (dt, simDt) {
      emitter.advance(simDt);
      state.pitchAge += dt;
      state.volumeAge += dt;

      // Probe chart history, sampled in animation time.
      if (state.probe.out) {
        probeAcc += simDt;
        var cm = (state.probe.x - L.tubeLeft) / tube.pxPerCm;
        while (probeAcc >= PROBE_STEP) {
          probeAcc -= PROBE_STEP;
          probeHist[probeHead] = emitter.pressAt(cm);
          probeHead = (probeHead + 1) % PROBE_SAMPLES;
        }
      }

      // Reveal: sound on (and audible) with the tracer visible for 6 s
      // of real time after the prediction is recorded.
      if (think.recorded() && !think.revealed() && state.soundOn && state.volume > 0 && state.showTracer) {
        state.onSeconds += dt;
        if (state.onSeconds >= REVEAL_SECONDS) {
          think.reveal('The tracer molecule returned to its starting position on every cycle. The compressions kept moving to the right, but the air did not flow down the tube.');
        }
      }
    },

    draw: draw,

    reset: function () {
      stopSound();
      state = defaults();
      emitter.reset();
      syncEmitter();
      probeHist.fill(0);
      probeAcc = 0;
      drag = null;
      think.reset();
      sync();
      canvas.needsBg = true;
    }
  };

  S.scenes.push(scene);
})(window.SoundSim);
