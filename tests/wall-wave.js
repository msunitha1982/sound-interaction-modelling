/* Run with node tests/wall-wave.js. No packages required. */
'use strict';
var assert = require('node:assert/strict');
var vm = require('node:vm');
var fs = require('node:fs');
var context = { SoundSim: {} };
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname, '../js/wave1d.js'), 'utf8'), context);
var wave = context.SoundSim.wave1d;
var model = require('../js/model.js');
var source = { dispAt: function () { return 1; }, pressAt: function () { return 1; } };
function near(actual, expected) { assert.ok(Math.abs(actual - expected) < 1e-9, actual + ' != ' + expected); }
Object.keys(model.MATERIALS).forEach(function (key) {
  var m = model.MATERIALS[key];
  [m.tMin, m.tRef, m.tMax].forEach(function (t) {
    [150, 500, 2000].forEach(function (f) {
      var result = model.compute([{ material: key, thickness: t }], f);
      near(wave.wallSample(source, 119, 120, 120 + t, result, false), 1 - Math.sqrt(result.R));
      near(wave.wallSample(source, 119, 120, 120 + t, result, true), 1 + Math.sqrt(result.R));
      var entering = wave.wallSample(source, 120, 120, 120 + t, result, false);
      var exiting = wave.wallSample(source, 120 + t, 120, 120 + t, result, false);
      near(entering * entering - exiting * exiting, result.A);
      near(exiting * exiting, result.T);
      near(wave.wallSample(source, 239, 120, 120 + t, result, false), Math.sqrt(result.T));
      var factor = wave.magnification(result.T);
      assert.ok(factor === 1 || factor * Math.sqrt(result.T) <= 0.5);
    });
  });
});
assert.equal(wave.magnification(1e-9), 200);
assert.equal(wave.magnification(0.5), 1);
var emitter = wave.createEmitter(34300 / 400);
emitter.set(500 / 400, 0.5);
emitter.advance(0.5);
near(emitter.dispAt(100), 0); // the wave has not reached 100 cm yet
emitter.advance(1);
assert.notEqual(emitter.dispAt(100), 0);
emitter.reset();
near(emitter.dispAt(0), 0);
console.log('Wall wave checks passed: 45 material/thickness/frequency combinations, energy loss, reflection sign, magnification, delayed propagation and reset.');
