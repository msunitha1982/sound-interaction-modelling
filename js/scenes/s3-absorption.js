/* Scene 3: Absorption */
(function (S) {
  'use strict';
  var ui = S.ui;
  var M = S.model.MATERIALS;

  function defaults() {
    return {
      material: 'wood',
      thickness: M.wood.tRef,
      soundOn: false,
      pitch: 500,
      volume: 50,
      clapped: false, clapAge: 99, tried: {}, thicknessChanged: false,
      showGlow: true,
      showBar: true
    };
  }

  var state = defaults();
  var c = {};
  var view, think, result, voice = null;

  function stopVoice() { if (voice) { voice.stop(); voice = null; } }
  function checkDone() {
    if (think.revealed() && state.thicknessChanged) { S.main.markDone(3); }
  }
  function refresh() {
    result = S.model.compute([{ material: state.material, thickness: state.thickness }], state.pitch);
    view.configure(state, result);
    if (state.soundOn) {
      if (voice) { voice.set({ freq: state.pitch, gain: state.volume / 100 }); }
      else { voice = S.audio.startVoice({ type: 'sine', freq: state.pitch, gain: state.volume / 100 }); }
    } else { stopVoice(); }
    var text = '';
    if (state.soundOn || state.clapped) {
      var shares = S.model.shares(result);
      text = M[state.material].name + ', ' + state.thickness + ' cm: ' + shares.text.R + ' reflected, ' +
        shares.text.A + ' absorbed, ' + shares.text.T + ' transmitted.';
      if (result.A >= 0.4) { text += ' Much of the sound energy is turned into thermal energy inside the material.'; }
      else if (result.R >= 0.8) { text += ' This surface is hard and dense, so most of the sound bounces back.'; }
    }
    ui.setCaption(c.caption, text);
    checkDone();
  }
  function clap() {
    if (!S.main.clock.playing || state.volume === 0) { return; }
    S.audio.clap({ gain: state.volume / 100 });
    S.audio.clap({ gain: state.volume / 100 * Math.sqrt(result.R), delay: 0.15 });
    state.clapped = true;
    state.clapAge = 0;
    if (think.recorded() && !think.revealed()) {
      state.tried[state.material] = S.model.shares(result).text.R;
      var keys = Object.keys(state.tried);
      if (keys.length >= 2) {
        think.reveal('Echo strength (percent of sound energy reflected) for the materials you tried: ' +
          keys.map(function (k) { return M[k].name + ': ' + state.tried[k]; }).join(', ') + '. ' +
          (state.tried.foam ? 'Foam reflected the least.' : 'Try foam to compare.'));
      }
    }
    refresh();
    // refresh updates all readouts, then the packet temporarily drives the emitter.
    if (!state.soundOn) { view.emitter.set(state.pitch / 400, 0.95 * Math.sqrt(state.volume / 100)); }
  }


  var preview = '<svg class="tab-preview" width="44" height="30" viewBox="0 0 44 30" aria-hidden="true">' +
    '<defs><pattern id="pv3-hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
    '<path d="M0 0 V4" stroke="#D55E00" stroke-width="1.4"/></pattern></defs>' +
    '<path d="M2 15 Q5 5 8 15 T14 15 T20 15 T26 15" fill="none" stroke="#1b1b1b" stroke-width="1.3"/>' +
    '<path d="M26 15 Q28 12 30 15 T34 15 T38 15" fill="none" stroke="#1b1b1b" stroke-width="0.8"/>' +
    '<rect x="26.5" y="4.5" width="15" height="21" fill="url(#pv3-hatch)" stroke="#1b1b1b"/></svg>';

  function sync() {
    c.material.set(state.material, state.thickness);
    c.sound.set(state.soundOn);
    c.pitch.set(state.pitch);
    c.volume.set(state.volume);
    c.glow.set(state.showGlow);
    c.bar.set(state.showBar);
    c.ideas.reset();
  }

  var scene = {
    number: 3,
    slug: 'absorption',
    tabLabel: 'Absorption',
    title: 'Absorption',
    goal: "Where does the sound's energy go when it hits a soft material?",
    preview: preview,
    hasCheck: true,

    init: function (root) {
      var L = ui.sceneLayout(root, scene);
      c.caption = L.caption;
      view = S.wave1d.createWallView(L.sim, true);
      think = ui.thinkPanel(L.think, {
        question: 'You clap in front of each material. Which material gives the quietest echo?',
        options: ['concrete', 'wood', 'curtain', 'foam'].map(function (k) { return { value: k, label: M[k].name }; }),
        correct: 'foam', runText: 'Play the clap with at least two different materials.',
        mainIdea: 'Absorbed sound energy does not disappear. It is converted to thermal energy in the material. Soft, porous materials absorb much of the sound that enters them and reflect little. Hard, dense materials reflect most of it.',
        onChange: checkDone
      });

      c.ideas = ui.ideasPanel([
        'Energy is not created or destroyed. It changes form.',
        'Absorbed means the energy goes into the material.',
        'Thermal energy is the energy of molecules jiggling. More thermal energy means warmer.',
        'Frequency is how many waves pass each second, in hertz (Hz). We hear it as pitch. Amplitude is the size of the wave. We hear it as loudness.'
      ]);

      var mat = ui.panel('Material');
      c.material = ui.materialPicker({
        keys: ['concrete', 'wood', 'curtain', 'foam'],
        value: state.material,
        thickness: state.thickness,
        columns: 2,
        ariaLabel: 'Material',
        onMaterial: function (k, t) { state.material = k; state.thickness = t; refresh(); },
        onThickness: function (t) { state.thickness = t; state.thicknessChanged = true; refresh(); }
      });
      mat.body.appendChild(c.material.radios);
      mat.body.appendChild(c.material.thickness);

      var sound = ui.panel('Sound');
      c.sound = ui.toggleButton({ offLabel: 'Sound: Off', onLabel: 'Sound: On', onChange: function (on) { state.soundOn = on; refresh(); } });
      c.clap = ui.button('Play clap', clap);
      c.pitch = ui.slider({ label: 'Frequency', min: 150, max: 2000, step: 10, value: state.pitch, unit: 'Hz', onInput: function (v) { state.pitch = v; refresh(); } });
      c.volume = ui.slider({ label: 'Amplitude', min: 0, max: 100, step: 1, value: state.volume, unit: '%', onInput: function (v) { state.volume = v; refresh(); } });
      sound.body.appendChild(ui.el('div', { className: 'row' }, [c.sound.el, c.clap]));
      sound.body.appendChild(c.pitch.el);
      sound.body.appendChild(c.volume.el);

      var show = ui.panel('Show');
      c.glow = ui.checkbox({ label: 'Heat glow', checked: state.showGlow, onChange: function (v) { state.showGlow = v; refresh(); } });
      c.bar = ui.checkbox({ label: 'Energy bar', checked: state.showBar, onChange: function (v) { state.showBar = v; refresh(); } });
      show.body.appendChild(c.glow.el);
      show.body.appendChild(c.bar.el);

      L.colA.appendChild(c.ideas.root);
      L.colA.appendChild(mat.root);
      L.colB.appendChild(sound.root);
      L.colB.appendChild(show.root);
    },

    enter: function () { scene.reset(); },
    leave: function () { stopVoice(); S.audio.stopAll(); },
    update: function (dt, simDt) {
      // A finite tone packet gives every clap a visible traveling disturbance.
      // Its 0.15 s visual duration is animation time; audio delay stays real.
      view.advance(simDt);
      state.clapAge += simDt;
      if (!state.soundOn && state.clapAge >= 0.15) { view.emitter.set(state.pitch / 400, 0); }
    },
    draw: function () { view.draw(); },
    reset: function () {
      stopVoice();
      S.audio.stopAll();
      state = defaults();
      view.reset();
      think.reset();
      sync();
      refresh();
    }
  };

  S.scenes.push(scene);
})(window.SoundSim);
