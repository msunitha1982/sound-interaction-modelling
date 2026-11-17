/* Scene 4: Transmission */
(function (S) {
  'use strict';
  var ui = S.ui;
  var M = S.model.MATERIALS;

  function defaults() {
    return {
      material: 'concrete',
      thickness: M.concrete.tRef,
      soundOn: false,
      source: 'buzz',
      pitch: 500,
      volume: 50,
      listen: 'far',
      pitchAge: 99,
      low: null, high: null, lowTL: 0, highTL: 0,
      heardNear: false, heardFar: false,
      magnify: true
    };
  }

  var state = defaults();
  var c = {};
  var view, think, result, voice = null;

  function checkDone() {
    if (think.revealed() && state.heardNear && state.heardFar) { S.main.markDone(4); }
  }
  function sampleFrequency() {
    if (!state.soundOn || state.volume === 0 || !S.main.clock.playing || !think.recorded() || think.revealed()) { return; }
    if (state.low === null || state.pitch < state.low) { state.low = state.pitch; state.lowTL = result.TLeff; }
    if (state.high === null || state.pitch > state.high) { state.high = state.pitch; state.highTL = result.TLeff; }
    if (state.high - state.low >= 1000) {
      think.reveal('At ' + state.low + ' Hz the far side was ' + state.lowTL.toFixed(1) +
        ' dB below the wall. At ' + state.high + ' Hz it was ' + state.highTL.toFixed(1) +
        ' dB below. Higher frequencies were blocked more.');
    }
  }
  function stopVoice() { if (voice) { voice.stop(); voice = null; } }
  function refresh(restart) {
    result = S.model.compute([{ material: state.material, thickness: state.thickness }], state.pitch);
    var factor = view.configure(state, result);
    c.magnifyLabel.textContent = S.wave1d.magnifierLabel(factor);
    if (restart || !state.soundOn) { stopVoice(); }
    if (state.soundOn) {
      var far = S.audio.farSide(result.TLeff, state.pitch);
      var settings = { freq: state.pitch, gain: state.volume / 100 * (state.listen === 'far' ? far.gain : 1),
        cutoff: state.listen === 'far' ? far.cutoff : 20000 };
      if (voice) { voice.set(settings); }
      else {
        settings.type = state.source === 'buzz' ? 'sawtooth' : 'sine';
        voice = S.audio.startVoice(settings);
      }
      if (state.volume > 0 && S.main.clock.playing) {
        if (state.listen === 'near') { state.heardNear = true; } else { state.heardFar = true; }
      }
    }
    sampleFrequency();
    checkDone();
    var text = state.soundOn ? 'On the far side the sound is ' + result.TLeff.toFixed(1) +
      ' dB quieter than at the wall. ' + S.model.shares(result).text.T + ' of the sound energy gets through.' : '';
    if (state.soundOn && state.pitchAge < 4) {
      text += ' At ' + state.pitch + ' Hz this wall reduces the sound by ' + result.TLeff.toFixed(1) + ' dB.';
    }
    ui.setCaption(c.caption, text);
  }
  function wallChanged() { state.low = null; state.high = null; refresh(false); }


  var preview = '<svg class="tab-preview" width="44" height="30" viewBox="0 0 44 30" aria-hidden="true">' +
    '<path d="M1 15 Q3.5 5 6 15 T11 15 T16 15" fill="none" stroke="#1b1b1b" stroke-width="1.3"/>' +
    '<rect x="16.5" y="3.5" width="11" height="23" fill="#ebe8df" stroke="#1b1b1b"/>' +
    '<path d="M28 15 Q30.5 12 33 15 T38 15 T43 15" fill="none" stroke="#009E73" stroke-width="1.3" stroke-dasharray="2 1.5"/>' +
    '</svg>';

  function sync() {
    c.material.set(state.material, state.thickness);
    c.sound.set(state.soundOn);
    c.source.set(state.source);
    c.pitch.set(state.pitch);
    c.volume.set(state.volume);
    c.listen.set(state.listen);
    c.magnify.set(state.magnify);
    c.ideas.reset();
  }

  var scene = {
    number: 4,
    slug: 'transmission',
    tabLabel: 'Transmission',
    title: 'Transmission',
    goal: 'How much sound gets through a wall, and what changes it?',
    preview: preview,
    hasCheck: true,

    init: function (root) {
      var L = ui.sceneLayout(root, scene);
      c.caption = L.caption;
      view = S.wave1d.createWallView(L.sim, false);
      think = ui.thinkPanel(L.think, {
        question: 'A student keeps the same wall and changes the frequency from 200 Hz to 2000 Hz. What happens to the sound on the far side?',
        options: [{ value: 'a', label: 'It gets louder.' }, { value: 'b', label: 'It stays about the same.' }, { value: 'c', label: 'It gets quieter.' }],
        correct: 'c', runText: 'Turn the sound on and change the frequency. Listen on both sides.',
        mainIdea: "Sound passes through a wall because the wall's own molecules vibrate and pass the disturbance along. Part of the sound is reflected and part is absorbed on the way, so less energy comes out the other side. Thicker and denser walls let less through. Low frequencies pass through more easily than high frequencies.",
        onChange: function () { sampleFrequency(); checkDone(); }
      });

      c.ideas = ui.ideasPanel([
        'Transmitted means the sound passes through the material and comes out the other side.',
        'A decibel (dB) is a unit of sound level. Every 10 dB lower is about half as loud to the ear.',
        'Frequency is how many waves pass each second, in hertz (Hz). We hear it as pitch. Amplitude is the size of the wave. We hear it as loudness.'
      ]);

      var wall = ui.panel('Wall');
      c.material = ui.materialPicker({
        keys: ['concrete', 'glass', 'wood', 'foam', 'curtain'],
        value: state.material,
        thickness: state.thickness,
        columns: 3,
        ariaLabel: 'Wall material',
        onMaterial: function (k, t) { state.material = k; state.thickness = t; wallChanged(); },
        onThickness: function (t) { state.thickness = t; wallChanged(); }
      });
      wall.body.appendChild(c.material.radios);
      wall.body.appendChild(c.material.thickness);

      var sound = ui.panel('Sound');
      c.sound = ui.toggleButton({ offLabel: 'Sound: Off', onLabel: 'Sound: On', onChange: function (on) { state.soundOn = on; refresh(false); } });
      c.source = ui.radioGroup({
        label: 'Source:',
        options: [{ value: 'tone', label: 'Tone' }, { value: 'buzz', label: 'Buzz' }],
        value: state.source,
        onChange: function (v) { state.source = v; refresh(true); }
      });
      c.pitch = ui.slider({ label: 'Frequency', min: 150, max: 2000, step: 10, value: state.pitch, unit: 'Hz', onInput: function (v) { state.pitch = v; state.pitchAge = 0; refresh(false); } });
      c.volume = ui.slider({ label: 'Amplitude', min: 0, max: 100, step: 1, value: state.volume, unit: '%', onInput: function (v) { state.volume = v; refresh(false); } });
      sound.body.appendChild(c.sound.el);
      sound.body.appendChild(c.source.el);
      sound.body.appendChild(c.pitch.el);
      sound.body.appendChild(c.volume.el);

      var listen = ui.panel('Listen');
      c.listen = ui.radioGroup({
        label: 'Listen on:',
        options: [{ value: 'near', label: 'Speaker side' }, { value: 'far', label: 'Far side' }],
        value: state.listen,
        onChange: function (v) { state.listen = v; refresh(false); }
      });
      listen.body.appendChild(c.listen.el);

      var show = ui.panel('Show');
      c.magnify = ui.checkbox({ label: 'Magnify far side', checked: state.magnify, onChange: function (v) { state.magnify = v; refresh(false); } });
      c.magnifyLabel = ui.el('div', { className: 'note' });
      show.body.appendChild(c.magnify.el);
      show.body.appendChild(c.magnifyLabel);

      L.colA.appendChild(c.ideas.root);
      L.colA.appendChild(wall.root);
      L.colA.appendChild(show.root);
      L.colB.appendChild(sound.root);
      L.colB.appendChild(listen.root);
      L.colB.appendChild(ui.note('Audio range is compressed so quiet sounds stay audible.'));
    },

    enter: function () { scene.reset(); },
    leave: function () { stopVoice(); S.audio.stopAll(); },
    update: function (dt, simDt) {
      view.advance(simDt);
      var recent = state.pitchAge < 4;
      state.pitchAge += dt;
      if (state.soundOn && state.volume > 0) {
        if (state.listen === 'near') { state.heardNear = true; } else { state.heardFar = true; }
        sampleFrequency();
        checkDone();
      }
      if (recent && state.pitchAge >= 4) { refresh(false); }
    },
    draw: function () { view.draw(); },
    reset: function () {
      stopVoice();
      S.audio.stopAll();
      state = defaults();
      view.reset();
      think.reset();
      sync();
      refresh(false);
    }
  };

  S.scenes.push(scene);
})(window.SoundSim);
