/* Materials and the reflect / absorb / transmit model (CLAUDE.md section 7).
   No DOM. In the browser it sets SoundSim.model. In Node, `node js/model.js`
   runs the self-checks. */
(function (root) {
  'use strict';

  var SPEED_CM = 34300; // speed of sound in air, cm/s (343 m/s)

  // Teaching values, not measurements.
  // R: reflected share at the front face.
  // tlRef: transmission loss in dB at 500 Hz and thickness tRef (cm).
  // sT: extra dB per doubling of thickness. sF: extra dB per doubling of pitch.
  var MATERIALS = {
    concrete: { name: 'Concrete', R: 0.97, tlRef: 45, tRef: 10, tMin: 5, tMax: 30, step: 1, sT: 6, sF: 5 },
    wood: { name: 'Wood', R: 0.85, tlRef: 22, tRef: 4, tMin: 1, tMax: 10, step: 0.5, sT: 5, sF: 5 },
    glass: { name: 'Glass', R: 0.95, tlRef: 30, tRef: 1, tMin: 0.5, tMax: 3, step: 0.1, sT: 5, sF: 5 },
    foam: { name: 'Foam', R: 0.15, tlRef: 6, tRef: 5, tMin: 1, tMax: 15, step: 0.5, sT: 3, sF: 4 },
    curtain: { name: 'Curtain', R: 0.30, tlRef: 4, tRef: 1, tMin: 0.5, tMax: 3, step: 0.1, sT: 3, sF: 3 }
  };

  var PITCH_MIN = 150;
  var PITCH_MAX = 2000;

  function log2(x) { return Math.log(x) / Math.LN2; }

  function wavelengthCm(f) { return SPEED_CM / f; }

  // Transmission loss of one layer in dB. Thicker layers and higher
  // pitches lose more (mass-law-like trend).
  function layerTL(layer, f) {
    var m = MATERIALS[layer.material];
    return m.tlRef + m.sT * log2(layer.thickness / m.tRef) + m.sF * log2(f / 500);
  }

  // The one function every scene uses.
  // layers: [{material, thickness}] (1 or 2, first faces the speaker); f in Hz.
  function compute(layers, f) {
    var R = MATERIALS[layers[0].material].R;
    var layerTLs = layers.map(function (l) { return layerTL(l, f); });
    var TL = Math.max(layerTLs.reduce(function (a, b) { return a + b; }, 0), 0.5);
    var T = Math.min(Math.pow(10, -TL / 10), 1 - R);
    var A = 1 - R - T; // absorbed share becomes thermal energy
    return {
      R: R,
      A: A,
      T: T,
      layerTL: layerTLs,
      // Effective loss matches T even when T is capped at 1 - R.
      TLeff: -10 * Math.log10(T)
    };
  }

  // Percentages for display: round R and T to one decimal, then A is
  // 100 minus both so the three always total 100.0%.
  function shares(res) {
    var r = Math.round(res.R * 1000);
    var t = Math.round(res.T * 1000);
    var a = 1000 - r - t;
    function text(tenths, raw) {
      return raw > 0 && raw < 0.001 ? '<0.1%' : (tenths / 10).toFixed(1) + '%';
    }
    return {
      R: r / 10, A: a / 10, T: t / 10,
      text: { R: text(r, res.R), A: text(a, res.A), T: text(t, res.T) }
    };
  }

  function formatDb(db) { return db.toFixed(1); }

  var model = {
    SPEED_CM: SPEED_CM,
    MATERIALS: MATERIALS,
    PITCH_MIN: PITCH_MIN,
    PITCH_MAX: PITCH_MAX,
    wavelengthCm: wavelengthCm,
    compute: compute,
    shares: shares,
    formatDb: formatDb
  };

  // ---------- Self-checks (Node only) ----------

  function thicknesses(m) {
    var out = [];
    var n = Math.round((m.tMax - m.tMin) / m.step);
    for (var i = 0; i <= n; i += 1) { out.push(Math.round((m.tMin + i * m.step) * 10) / 10); }
    return out;
  }

  function selfCheck() {
    var keys = Object.keys(MATERIALS);
    var layerChoices = [];
    keys.forEach(function (k) {
      thicknesses(MATERIALS[k]).forEach(function (t) { layerChoices.push({ material: k, thickness: t }); });
    });
    var pitches = [];
    for (var f = PITCH_MIN; f <= PITCH_MAX; f += 10) { pitches.push(f); }

    var count = 0;
    var failures = [];
    var worstSum = 0;
    function check(layers, f) {
      var res = compute(layers, f);
      var s = shares(res);
      count += 1;
      var sumErr = Math.abs(res.R + res.A + res.T - 1);
      worstSum = Math.max(worstSum, sumErr);
      var bad = [];
      ['R', 'A', 'T', 'TLeff'].forEach(function (k) { if (isNaN(res[k]) || !isFinite(res[k])) { bad.push(k + ' not a number'); } });
      ['R', 'A', 'T'].forEach(function (k) { if (res[k] < -1e-12 || res[k] > 1 + 1e-12) { bad.push(k + ' out of [0, 1]'); } });
      if (sumErr > 1e-9) { bad.push('R + A + T != 1'); }
      if (Math.abs(s.R + s.A + s.T - 100) > 1e-9) { bad.push('display does not total 100.0%'); }
      if (bad.length && failures.length < 10) { failures.push(JSON.stringify(layers) + ' ' + f + ' Hz: ' + bad.join(', ')); }
    }

    layerChoices.forEach(function (l1) {
      pitches.forEach(function (f) { check([l1], f); });
      layerChoices.forEach(function (l2) {
        pitches.forEach(function (f) { check([l1, l2], f); });
      });
    });

    // Qualitative ordering and challenge passability.
    var expect = [];
    function ok(label, cond) { expect.push((cond ? 'ok    ' : 'FAIL  ') + label); if (!cond) { failures.push(label); } }
    var one = function (k, t, f) { return compute([{ material: k, thickness: t }], f); };
    var at500 = keys.map(function (k) { return { k: k, r: one(k, MATERIALS[k].tRef, 500) }; });
    ok('Foam reflects least at default thickness', at500.every(function (x) { return x.k === 'foam' || x.r.R > MATERIALS.foam.R; }));
    ok('Concrete transmits least at default thickness', at500.every(function (x) { return x.k === 'concrete' || x.r.T > one('concrete', 10, 500).T; }));
    ok('Thick concrete: reflected share is the largest', (function () { var r = one('concrete', 30, 500); return r.R > r.A && r.R > r.T; })());
    ok('Higher pitch never lets more through (all layers)', layerChoices.every(function (l) {
      for (var i = 1; i < pitches.length; i += 1) { if (compute([l], pitches[i]).TLeff < compute([l], pitches[i - 1]).TLeff - 1e-9) { return false; } }
      return true;
    }));
    ok('Thicker never lets more through (all materials, all pitches)', keys.every(function (k) {
      var ts = thicknesses(MATERIALS[k]);
      return pitches.every(function (f) {
        for (var i = 1; i < ts.length; i += 1) { if (one(k, ts[i], f).TLeff < one(k, ts[i - 1], f).TLeff - 1e-9) { return false; } }
        return true;
      });
    }));
    var c1 = one('concrete', 10, 300);
    ok('Challenge 1 passable: concrete 10 cm at 300 Hz is ' + formatDb(c1.TLeff) + ' dB quieter (need 40.0)', Number(formatDb(c1.TLeff)) >= 40);
    ok('Challenge 2 passable: foam reflects ' + shares(one('foam', 5, 500)).text.R + ' (need 20% or less)', shares(one('foam', 5, 500)).R <= 20);
    var c3 = compute([{ material: 'foam', thickness: 5 }, { material: 'concrete', thickness: 10 }], 500);
    ok('Challenge 3 passable: foam 5 cm + concrete 10 cm reflects ' + shares(c3).text.R + ', ' + formatDb(c3.TLeff) + ' dB quieter',
      shares(c3).R <= 30 && Number(formatDb(c3.TLeff)) >= 30);

    console.log('Cases checked: ' + count);
    console.log('Largest |R + A + T - 1|: ' + worstSum.toExponential(2));
    expect.forEach(function (line) { console.log(line); });
    if (failures.length) {
      console.log('FAILED:');
      failures.forEach(function (line) { console.log('  ' + line); });
      return false;
    }
    console.log('All checks passed: R + A + T = 1 within 1e-9, no NaN, all shares in [0, 1], displays total 100.0%.');
    return true;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = model;
    if (require.main === module) { process.exitCode = selfCheck() ? 0 : 1; }
  } else {
    root.SoundSim = root.SoundSim || {};
    root.SoundSim.model = model;
  }
})(this);
