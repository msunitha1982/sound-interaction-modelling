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

  return { createEmitter: createEmitter, createTube: createTube };
})();
