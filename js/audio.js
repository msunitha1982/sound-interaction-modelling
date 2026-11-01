/* Web Audio: Tone (sine), Buzz (sawtooth), Clap (short band-limited noise
   burst), and the far-side transmission settings (CLAUDE.md section 8).
   No audio files. The context is created on the first button click. */
SoundSim.audio = (function () {
  'use strict';

  var MASTER = 0.25;      // cap on overall loudness
  var RAMP = 0.02;        // 20 ms ramps on every change, start, and stop
  var CLAP_LEN = 0.06;    // 60 ms clap
  var TYPE_GAIN = { sine: 1, sawtooth: 0.45 }; // sawtooth is much louder at equal amplitude

  var ctx = null;
  var master = null;
  var noise = null;
  var paused = false;
  var live = [];          // running voices and scheduled claps, for stopAll

  function make() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { return false; }
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = MASTER;
    master.connect(ctx.destination);
    // One white-noise buffer, reused by every clap.
    noise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * CLAP_LEN), ctx.sampleRate);
    var data = noise.getChannelData(0);
    for (var i = 0; i < data.length; i += 1) { data[i] = Math.random() * 2 - 1; }
    return true;
  }

  // Call from a click handler (browsers only allow audio after a user gesture).
  function ensure() {
    if (!ctx && !make()) { return false; }
    if (ctx.state === 'suspended' && !paused) { ctx.resume(); }
    return true;
  }

  function rampTo(param, value) {
    var now = ctx.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(value, now + RAMP);
  }

  function nyquistClamp(hz) { return Math.min(hz, ctx.sampleRate / 2 - 100); }

  function forget(item) {
    var i = live.indexOf(item);
    if (i >= 0) { live.splice(i, 1); }
  }

  // A continuous source: oscillator -> low-pass -> gain -> master.
  // opts: type ('sine' or 'sawtooth'), freq, gain (0 to 1), cutoff (Hz, optional).
  function startVoice(opts) {
    if (!ensure()) { return null; }
    var typeGain = TYPE_GAIN[opts.type];
    var osc = ctx.createOscillator();
    var lp = ctx.createBiquadFilter();
    var g = ctx.createGain();
    osc.type = opts.type;
    osc.frequency.value = opts.freq;
    lp.type = 'lowpass';
    lp.frequency.value = nyquistClamp(opts.cutoff || 20000);
    g.gain.value = 0;
    osc.connect(lp);
    lp.connect(g);
    g.connect(master);
    osc.start();
    rampTo(g.gain, opts.gain * typeGain);

    var voice = {
      set: function (o) {
        if (o.freq !== undefined) { rampTo(osc.frequency, o.freq); }
        if (o.gain !== undefined) { rampTo(g.gain, o.gain * typeGain); }
        if (o.cutoff !== undefined) { rampTo(lp.frequency, nyquistClamp(o.cutoff)); }
      },
      stop: function () {
        rampTo(g.gain, 0);
        osc.stop(ctx.currentTime + RAMP + 0.01);
        forget(voice);
      }
    };
    live.push(voice);
    return voice;
  }

  // One clap: noise burst through a band-pass, with a fast attack and a
  // decay over 60 ms. opts: gain (0 to 1), delay (s, default 0), cutoff (Hz, optional).
  function clap(opts) {
    if (!ensure()) { return; }
    var t0 = ctx.currentTime + 0.005 + (opts.delay || 0);
    var src = ctx.createBufferSource();
    var bp = ctx.createBiquadFilter();
    var lp = ctx.createBiquadFilter();
    var g = ctx.createGain();
    src.buffer = noise;
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    bp.Q.value = 0.7;
    lp.type = 'lowpass';
    lp.frequency.value = nyquistClamp(opts.cutoff || 20000);
    var peak = Math.max(opts.gain, 0.0002) * 2.5; // band-pass removes much of the noise energy
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + 0.002);
    g.gain.exponentialRampToValueAtTime(peak * 0.01, t0 + CLAP_LEN);
    src.connect(bp);
    bp.connect(lp);
    lp.connect(g);
    g.connect(master);
    src.start(t0);
    src.stop(t0 + CLAP_LEN);

    var item = {
      stop: function () {
        rampTo(g.gain, 0);
        try { src.stop(ctx.currentTime + RAMP); } catch (e) { /* already stopped */ }
        forget(item);
      }
    };
    src.onended = function () { forget(item); };
    live.push(item);
  }

  // Leaving a scene: silence everything, with a 20 ms ramp.
  function stopAll() {
    if (!ctx) { return; }
    live.slice().forEach(function (item) { item.stop(); });
  }

  // Play/Pause and a hidden tab freeze audio: fade the master out, then
  // suspend the context; resume and fade back in.
  function setPaused(p) {
    paused = p;
    if (!ctx) { return; }
    if (p) {
      rampTo(master.gain, 0);
      window.setTimeout(function () { if (paused) { ctx.suspend(); } }, RAMP * 1000 + 10);
    } else {
      ctx.resume().then(function () { if (!paused) { rampTo(master.gain, MASTER); } });
    }
  }

  // Far-side sound through a wall, from the effective transmission loss.
  // The 0.6 factor compresses the range so a 45 dB wall stays audible.
  function farSide(tlEff, pitch) {
    var cutoff = Math.min(Math.max(8000 * Math.pow(10, -tlEff / 40), 1.2 * pitch), 8000);
    var gain = Math.max(Math.pow(10, -0.6 * tlEff / 20), 0.01);
    return { cutoff: cutoff, gain: gain };
  }

  return {
    ensure: ensure,
    startVoice: startVoice,
    clap: clap,
    stopAll: stopAll,
    setPaused: setPaused,
    farSide: farSide
  };
})();
