/* Shared 1D molecule tube (Scenes 1, 3, 4, 5).

   Physics, kept analytic (CLAUDE.md section 7): the speaker emits a
   displacement u(t). A traveling wave carries it down the tube unchanged,
   so the displacement at distance x is u(t - x / c). The emitter keeps a
   short history of u so pitch, volume, and on/off changes travel down the
   tube at the speed of sound instead of changing the whole tube at once.

   Volume sets the pressure amplitude (strain). The displacement amplitude
   is strain * wavelength / (2 pi), so at the same volume a low pitch moves
   molecules farther than a high pitch, as in real air.

   Units: positions in cm along the tube, times in animation seconds. */
SoundSim.wave1d = (function () {
  'use strict';

  var TWO_PI = Math.PI * 2;
  var STEP = 1 / 400;        // emitter sample step, animation seconds
  var HISTORY = 3.6;         // seconds of history kept (longer than the tube's travel time)
  var N = Math.ceil(HISTORY / STEP);

  // speed: cm per animation second.
  function createEmitter(speed) {
    var u = new Float32Array(N);  // displacement, cm
    var w = new Float32Array(N);  // relative pressure (strain); positive = compression
    var e = {
      time: 0,
      count: 0,     // samples emitted so far; sample k is at time k * STEP
      phase: 0,
      freq: 0,      // Hz in animation time
      strain: 0,
      reset: function () {
        u.fill(0);
        w.fill(0);
        e.time = 0;
        e.count = 0;
        e.phase = 0;
        e.strain = 0;
      },
      // freq in animation Hz; strain 0 means silent.
      set: function (freq, strain) {
        e.freq = freq;
        e.strain = strain;
      },
      advance: function (simDt) {
        e.time += simDt;
        while (e.count * STEP <= e.time) {
          e.phase = (e.phase + TWO_PI * e.freq * STEP) % TWO_PI;
          var amp = e.freq > 0 ? e.strain * (speed / e.freq) / TWO_PI : 0;
          var i = e.count % N;
          u[i] = amp * Math.sin(e.phase);
          // Pressure is proportional to -du/dx. For u(t - x/c) that is
          // (1/c) du/dt = strain * cos(phase).
          w[i] = e.strain * Math.cos(e.phase);
          e.count += 1;
        }
      },
      // Value emitted at animation time tau, linearly interpolated.
      lookup: function (arr, tau) {
        var last = e.count - 1;
        if (last < 0) { return 0; }
        var k = tau / STEP;
        if (k < 0 || k < last - N + 2) { return 0; } // before the sound started, or long gone
        if (k >= last) { return arr[last % N]; }
        var k0 = Math.floor(k);
        var f = k - k0;
        return arr[k0 % N] * (1 - f) + arr[(k0 + 1) % N] * f;
      },
      dispAt: function (xCm) { return e.lookup(u, e.time - xCm / speed); },
      pressAt: function (xCm) { return e.lookup(w, e.time - xCm / speed); }
    };
    return e;
  }

  // A tube of molecule dots. Columns share one displacement (1D motion).
  // opts: left, right (px, visible end), top, bottom (px), lengthCm (visible),
  // cols (visible), extraCols (beyond the right edge), rows.
  function createTube(opts) {
    var cols = opts.cols + opts.extraCols;
    var rows = opts.rows;
    var spacing = opts.lengthCm / opts.cols;
    var pxPerCm = (opts.right - opts.left) / opts.lengthCm;
    var colCm = new Float32Array(cols);
    var offX = new Float32Array(cols * rows);
    var offY = new Float32Array(cols * rows);
    var rowY = new Float32Array(rows);
    var gap = (opts.bottom - opts.top) / rows;
    var seed = 12345;
    function rand() { // small fixed pseudo-random jitter so dots do not look like a grid
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647 - 0.5;
    }
    for (var r = 0; r < rows; r += 1) { rowY[r] = opts.top + gap * (r + 0.5); }
    for (var c = 0; c < cols; c += 1) {
      colCm[c] = (c + 0.5) * spacing;
      for (r = 0; r < rows; r += 1) {
        offX[c * rows + r] = rand() * spacing * pxPerCm * 0.1;
        offY[c * rows + r] = rand() * gap * 0.5;
      }
    }

    var tube = {
      left: opts.left,
      top: opts.top,
      bottom: opts.bottom,
      rows: rows,
      cols: cols,
      spacing: spacing,
      pxPerCm: pxPerCm,
      colCm: colCm,
      rowY: rowY,
      disp: new Float32Array(cols),   // cm, filled by the scene each frame
      press: new Float32Array(cols),  // strain, filled by the scene each frame
      hidden: -1,                      // index of one dot to skip (under the tracer)

      xOf: function (cm) { return opts.left + cm * pxPerCm; },

      // Incident wave only (Scene 1).
      sampleIncident: function (emitter) {
        for (var i = 0; i < cols; i += 1) {
          tube.disp[i] = emitter.dispAt(colCm[i]);
          tube.press[i] = emitter.pressAt(colCm[i]);
        }
      },

      drawDots: function (ctx, color, clipRight) {
        var size = 2;
        ctx.save();
        ctx.beginPath();
        ctx.rect(opts.left, opts.top, clipRight - opts.left, opts.bottom - opts.top);
        ctx.clip();
        ctx.beginPath();
        for (var i = 0; i < cols; i += 1) {
          var x = opts.left + (colCm[i] + tube.disp[i]) * pxPerCm;
          for (var j = 0; j < rows; j += 1) {
            var d = i * rows + j;
            if (d === tube.hidden) { continue; }
            ctx.rect(x + offX[d] - size / 2, rowY[j] + offY[d] - size / 2, size, size);
          }
        }
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
      },

      // Pressure against position, aligned under the columns.
      drawPressure: function (ctx, zeroY, pxPerStrain, clipRight) {
        ctx.beginPath();
        for (var i = 0; i < cols; i += 1) {
          var x = opts.left + colCm[i] * pxPerCm;
          if (x > clipRight) { break; }
          var y = zeroY - tube.press[i] * pxPerStrain;
          if (i === 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
        }
        ctx.stroke();
      },

      // Column index with the largest (sign = 1) or smallest (sign = -1)
      // pressure between two positions, or -1 if the wave is too weak there.
      extremum: function (fromCm, toCm, sign, minStrain) {
        var best = -1;
        var bestV = minStrain;
        var i0 = Math.max(0, Math.floor(fromCm / spacing));
        var i1 = Math.min(cols - 1, Math.ceil(toCm / spacing));
        for (var i = i0; i <= i1; i += 1) {
          var v = tube.press[i] * sign;
          if (v > bestV) { bestV = v; best = i; }
        }
        return best;
      }
    };
    return tube;
  }

  // A single layer sampled from the same delayed source history as Scene 1.
  // Pressure reflection at a hard face is positive; displacement reverses.
  // Entering energy is 1-R, and the exponential envelope ends at sqrt(T).
  function wallSample(emitter, x, front, back, result, pressure) {
    var sample = pressure ? emitter.pressAt : emitter.dispAt;
    if (x < front) {
      return sample(x) + (pressure ? 1 : -1) * Math.sqrt(result.R) * sample(2 * front - x);
    }
    if (x <= back) {
      var depth = (x - front) / (back - front);
      return sample(x) * Math.sqrt(1 - result.R) *
        Math.pow(result.T / (1 - result.R), depth / 2);
    }
    return sample(x) * Math.sqrt(result.T);
  }

  function magnification(transmitted) {
    var choices = [1, 2, 5, 10, 20, 50, 100, 200];
    var factor = 1;
    for (var i = 0; i < choices.length; i += 1) {
      if (choices[i] * Math.sqrt(transmitted) <= 0.5) { factor = choices[i]; }
    }
    return factor;
  }

  function magnifierLabel(factor) {
    if (factor === 1) { return 'Far side drawn at true size.'; }
    if (factor === 200) { return 'Far side drawn 200x larger (the maximum).'; }
    return 'Far side drawn ' + factor + 'x larger.';
  }

  // Shared wall view for Absorption and Transmission. Static labels, meters,
  // and energy shares redraw on a control change, not inside the frame loop.
  function createWallView(container, absorption) {
    var canvas = SoundSim.ui.simCanvas(container);
    var emitter = createEmitter(34300 / 400);
    var tube = null;
    var result, state, front, back, factor = 1;
    var speed = 0, width = 0;
    var FONT = '13px "Trebuchet MS", "Segoe UI", Arial, sans-serif';
    var MONO = '13px ui-monospace, Consolas, monospace';
    var ink = '#1b1b1b';

    function line(ctx, x1, y1, x2, y2) {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    function energyBar(ctx) {
      var shares = SoundSim.model.shares(result);
      var values = [result.R, result.A, result.T];
      var colors = ['#0072B2', '#D55E00', '#009E73'];
      var labels = ['Reflected', 'Absorbed', 'Transmitted'];
      var texts = [shares.text.R, shares.text.A, shares.text.T];
      var x = 25, span = canvas.w - 50;
      for (var i = 0; i < 3; i += 1) {
        var w = 2 + values[i] * (span - 6);
        ctx.save();
        ctx.beginPath(); ctx.rect(x, 183, w, 17); ctx.clip();
        if (i === 0) { ctx.fillStyle = colors[i]; ctx.fillRect(x, 183, w, 17); }
        else if (i === 1) {
          ctx.strokeStyle = colors[i];
          for (var d = -17; d < w; d += 5) { line(ctx, x + d, 200, x + d + 17, 183); }
        } else {
          ctx.strokeStyle = colors[i]; ctx.lineWidth = 3; ctx.setLineDash([5, 3]);
          line(ctx, x, 191, x + w, 191);
        }
        ctx.restore();
        ctx.strokeStyle = ink; ctx.strokeRect(x, 183, w, 17);
        var tx = 110 + i * 225;
        line(ctx, x + w / 2, 201, tx, 210);
        ctx.textAlign = 'center'; ctx.fillStyle = colors[i]; ctx.font = FONT;
        ctx.fillText(labels[i], tx, 223);
        ctx.fillStyle = ink; ctx.font = MONO; ctx.fillText(texts[i], tx, 239);
        x += w;
      }
      ctx.font = FONT; ctx.fillStyle = ink; ctx.textAlign = 'center';
      ctx.fillText('Total: 100%', canvas.w / 2, 255);
      ctx.textAlign = 'left';
    }
    function meter(ctx, x, db) {
      var top = 169, height = 61;
      ctx.fillStyle = '#ebe8df'; ctx.fillRect(x, top, 12, height);
      ctx.fillStyle = '#009E73';
      var h = state.soundOn && state.volume > 0 ? height * Math.max(0, 1 + db / 80) : 0;
      ctx.fillRect(x, top + height - h, 12, h);
      ctx.strokeStyle = ink; ctx.strokeRect(x, top, 12, height);
      ctx.font = MONO; ctx.fillStyle = ink;
      for (var v = 0; v >= -80; v -= 40) { ctx.fillText(v + ' dB', x + 17, top + height * (-v / 80) + 4); }
      ctx.fillText((db === 0 ? '0.0' : db.toFixed(1)) + ' dB', x - 10, 249);
    }
    function drawBg() {
      var ctx = canvas.ctxBg;
      ctx.clearRect(0, 0, canvas.w, canvas.h);
      ctx.font = FONT; ctx.fillStyle = '#4d4d4d'; ctx.textAlign = 'left';
      ctx.fillText('Animation: ' + (SoundSim.main.clock.speed === 1 ? '400x' : '1,600x') + ' slower than real sound', 8, 16);
      ctx.strokeStyle = ink;
      line(ctx, 50, 60, canvas.w - 12, 60); line(ctx, 50, 120, canvas.w - 12, 120);
      ctx.fillStyle = '#ebe8df';
      ctx.fillRect(tube.xOf(front), 59, tube.xOf(back) - tube.xOf(front), 62);
      ctx.strokeRect(tube.xOf(front), 59, tube.xOf(back) - tube.xOf(front), 62);
      ctx.fillStyle = ink;
      ctx.fillText(absorption ? 'Incoming sound' : 'Speaker side', 65, 40);
      ctx.textAlign = 'center';
      ctx.fillText(absorption ? 'Material' : 'Wall', (tube.xOf(front) + tube.xOf(back)) / 2, 40);
      line(ctx, (tube.xOf(front) + tube.xOf(back)) / 2, 43, (tube.xOf(front) + tube.xOf(back)) / 2, 58);
      if (absorption) {
        ctx.fillStyle = '#0072B2'; ctx.fillText('Reflected sound', 170, 144);
        ctx.strokeStyle = '#0072B2'; line(ctx, 220, 150, 100, 150);
        line(ctx, 100, 150, 107, 146); line(ctx, 100, 150, 107, 154);
        ctx.fillStyle = ink; ctx.strokeStyle = ink;
        ctx.fillText('Heat glow', tube.xOf(front) + 45, 144);
        line(ctx, tube.xOf(front) + 30, 132, tube.xOf(front) + 5, 115);
        ctx.textAlign = 'left';
        ctx.fillText('Heat glow exaggerated. Real warming is too small to feel.', 8, 173);
        if (state.showBar) { energyBar(ctx); }
      } else {
        ctx.fillText('Far side', 550, 40);
        ctx.fillText('Wall molecules pass the vibration along', canvas.w / 2, 143);
        line(ctx, canvas.w / 2, 130, tube.xOf(front) + 4, 112);
        ctx.textAlign = 'left';
        meter(ctx, 155, 0); meter(ctx, 505, -result.TLeff);
        ctx.font = FONT;
        ctx.textAlign = 'center';
        ctx.fillText('relative to the sound', 350, 184);
        ctx.fillText('arriving at the wall', 350, 202);
        ctx.textAlign = 'left';
        // Head on the selected listening side.
        var hx = state.listen === 'near' ? 95 : 455;
        ctx.beginPath(); ctx.arc(hx, 226, 8, 0, Math.PI * 2); ctx.stroke();
        line(ctx, hx - 12, 251, hx - 6, 237); line(ctx, hx - 6, 237, hx + 6, 237);
        line(ctx, hx + 6, 237, hx + 12, 251);
      }
      ctx.textAlign = 'left'; ctx.font = FONT;
      ctx.fillStyle = '#ebe8df'; ctx.fillRect(8, 75, 24, 30); ctx.strokeRect(8, 75, 24, 30);
      canvas.needsBg = false;
    }
    var api = {
      emitter: emitter,
      configure: function (nextState, nextResult) {
        state = nextState; result = nextResult;
        front = absorption ? 144 : 120;
        back = front + state.thickness;
        factor = !absorption && state.magnify ? magnification(result.T) : 1;
        emitter.set(state.pitch / 400, state.soundOn ? 0.95 * Math.sqrt(state.volume / 100) : 0);
        canvas.needsBg = true;
        return factor;
      },
      reset: function () { emitter.reset(); canvas.resize(); width = 0; },
      advance: function (dt) { emitter.advance(dt); },
      draw: function () {
        if (!canvas.w) { return; }
        if (width !== canvas.w) {
          width = canvas.w;
          tube = createTube({ left: 50, right: canvas.w - 12, top: 61, bottom: 119,
            lengthCm: 240, cols: 220, extraCols: 12, rows: 7 });
          canvas.needsBg = true;
        }
        if (speed !== SoundSim.main.clock.speed) { speed = SoundSim.main.clock.speed; canvas.needsBg = true; }
        if (canvas.needsBg) { drawBg(); }
        var ctx = canvas.ctx;
        ctx.clearRect(0, 0, canvas.w, canvas.h);
        // Low-opacity solid heat bands: local energy loss, no decorative blur.
        if (absorption && state.showGlow) {
          var ratio = result.T / (1 - result.R);
          var peakPressure = Math.abs(emitter.pressAt(front));
          for (var j = 0; j < 12; j += 1) {
            var a = j / 12, b = (j + 1) / 12;
            var loss = (1 - result.R) * (Math.pow(ratio, a) - Math.pow(ratio, b));
            ctx.fillStyle = '#D55E00'; ctx.globalAlpha = Math.min(0.4, loss * 8 * peakPressure);
            ctx.fillRect(tube.xOf(front + state.thickness * a), 60, state.thickness * tube.pxPerCm / 12 + 0.5, 60);
          }
          ctx.globalAlpha = 1;
        }
        for (var i = 0; i < tube.cols; i += 1) {
          var x = tube.colCm[i];
          tube.disp[i] = wallSample(emitter, x, front, back, result, false) * (x > back ? factor : 1);
        }
        tube.drawDots(ctx, '#3d4651', canvas.w - 12);
        // Extra material rows make the solid visibly denser, with a small
        // vertical thermal motion driven by the local loss of wave energy.
        ctx.fillStyle = '#3d4651'; ctx.beginPath();
        for (i = 0; i < tube.cols; i += 1) {
          x = tube.colCm[i];
          if (x < front || x > back) { continue; }
          var depth = (x - front) / (back - front);
          var jitter = Math.abs(emitter.pressAt(x)) * result.A * Math.pow(result.T / (1 - result.R), depth) * 2;
          for (j = 0; j < 6; j += 1) {
            ctx.rect(tube.xOf(x + tube.disp[i]) - 1, 67 + j * 8 + jitter * Math.sin(emitter.time * 25 + i + j), 2, 2);
          }
        }
        ctx.fill();
        var dx = Math.max(36, 50 + emitter.dispAt(0) * tube.pxPerCm);
        ctx.strokeStyle = ink; ctx.fillStyle = '#ebe8df'; ctx.beginPath();
        ctx.moveTo(32, 80); ctx.lineTo(dx, 64); ctx.lineTo(dx, 116); ctx.lineTo(32, 100); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    };
    return api;
  }

  return { createEmitter: createEmitter, createTube: createTube, wallSample: wallSample,
    magnification: magnification, magnifierLabel: magnifierLabel, createWallView: createWallView };
})();
