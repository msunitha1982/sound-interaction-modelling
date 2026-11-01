/* Scene 5: Put it together */
(function (S) {
  'use strict';
  var ui = S.ui;
  var M = S.model.MATERIALS;
  var KEYS = ['concrete', 'glass', 'wood', 'foam', 'curtain'];

  function defaults() {
    return {
      layer1: { material: 'wood', thickness: M.wood.tRef },
      twoLayers: false,
      layer2: { material: 'concrete', thickness: M.concrete.tRef },
      soundOn: false,
      source: 'buzz',
      pitch: 500,
      volume: 50,
      listen: 'far',
      mode: 'free',
      magnify: true
    };
  }

  var state = defaults();
  var c = {};

  var preview = '<svg class="tab-preview" width="44" height="30" viewBox="0 0 44 30" aria-hidden="true">' +
    '<defs><pattern id="pv5-hatch" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
    '<path d="M0 0 V3" stroke="#D55E00" stroke-width="1.2"/></pattern></defs>' +
    '<rect x="18.5" y="3.5" width="8" height="23" fill="url(#pv5-hatch)" stroke="#1b1b1b"/>' +
    '<path d="M2 11 H16 M13 8.5 L16 11 L13 13.5" fill="none" stroke="#1b1b1b" stroke-width="1.3"/>' +
    '<path d="M16 19 H3 M6 16.5 L3 19 L6 21.5" fill="none" stroke="#0072B2" stroke-width="1.5"/>' +
    '<path d="M29 15 H41" fill="none" stroke="#009E73" stroke-width="1.5" stroke-dasharray="2.5 1.5"/>' +
    '<path d="M38.5 12.5 L41 15 L38.5 17.5" fill="none" stroke="#009E73" stroke-width="1.5"/></svg>';

  function sync() {
    c.layer1.set(state.layer1.material, state.layer1.thickness);
    c.two.set(state.twoLayers);
    c.layer2.set(state.layer2.material, state.layer2.thickness);
    c.layer2.setDisabled(!state.twoLayers);
    c.sound.set(state.soundOn);
    c.source.set(state.source);
    c.pitch.set(state.pitch);
    c.volume.set(state.volume);
    c.listen.set(state.listen);
    c.mode.set(state.mode);
    c.magnify.set(state.magnify);
    c.ideas.reset();
  }

  var scene = {
    number: 5,
    slug: 'together',
    tabLabel: 'Put it together',
    title: 'Put it together',
    goal: 'How does one wall split the sound between reflecting, absorbing, and transmitting?',
    preview: preview,
    hasCheck: true,

    init: function (root) {
      var L = ui.sceneLayout(root, scene);

      c.ideas = ui.ideasPanel([
        'Every surface reflects some sound, absorbs some, and transmits some.',
        'The three shares always add up to 100% of the sound energy that arrives.',
        'Material, thickness, and frequency change the shares.',
        'Frequency is how many waves pass each second, in hertz (Hz). We hear it as pitch. Amplitude is the size of the wave. We hear it as loudness.'
      ]);

      // The pickers write into state.layer1 / state.layer2, which Reset All
      // replaces, so they look the layer up at call time.
      var p1 = ui.panel('Wall, layer 1 (faces the speaker)');
      c.layer1 = ui.materialPicker({
        keys: KEYS, value: state.layer1.material, thickness: state.layer1.thickness, columns: 3,
        ariaLabel: 'Layer 1 material',
        onMaterial: function (k, t) { state.layer1.material = k; state.layer1.thickness = t; },
        onThickness: function (t) { state.layer1.thickness = t; }
      });
      p1.body.appendChild(c.layer1.radios);
      p1.body.appendChild(c.layer1.thickness);

      var p2 = ui.panel('Wall, layer 2');
      c.two = ui.checkbox({
        label: 'Add second layer',
        checked: state.twoLayers,
        onChange: function (v) { state.twoLayers = v; c.layer2.setDisabled(!v); }
      });
      c.layer2 = ui.materialPicker({
        keys: KEYS, value: state.layer2.material, thickness: state.layer2.thickness, columns: 3,
        ariaLabel: 'Layer 2 material',
        onMaterial: function (k, t) { state.layer2.material = k; state.layer2.thickness = t; },
        onThickness: function (t) { state.layer2.thickness = t; }
      });
      p2.body.appendChild(c.two.el);
      p2.body.appendChild(c.layer2.radios);
      p2.body.appendChild(c.layer2.thickness);

      var sound = ui.panel('Sound');
      c.sound = ui.toggleButton({ offLabel: 'Sound: Off', onLabel: 'Sound: On', onChange: function (on) { state.soundOn = on; } });
      c.source = ui.radioGroup({
        label: 'Source:',
        options: [{ value: 'tone', label: 'Tone' }, { value: 'buzz', label: 'Buzz' }],
        value: state.source,
        onChange: function (v) { state.source = v; }
      });
      c.pitch = ui.slider({ label: 'Frequency', min: 150, max: 2000, step: 10, value: state.pitch, unit: 'Hz', onInput: function (v) { state.pitch = v; } });
      c.volume = ui.slider({ label: 'Amplitude', min: 0, max: 100, step: 1, value: state.volume, unit: '%', onInput: function (v) { state.volume = v; } });
      c.listen = ui.radioGroup({
        label: 'Listen on:',
        options: [{ value: 'near', label: 'Speaker side' }, { value: 'far', label: 'Far side' }],
        value: state.listen,
        onChange: function (v) { state.listen = v; }
      });
      sound.body.appendChild(c.sound.el);
      sound.body.appendChild(c.source.el);
      sound.body.appendChild(c.pitch.el);
      sound.body.appendChild(c.volume.el);
      sound.body.appendChild(c.listen.el);

      var mode = ui.panel('Mode');
      c.mode = ui.radioGroup({
        ariaLabel: 'Mode',
        columns: 2,
        options: [
          { value: 'free', label: 'Free play' },
          { value: 'c1', label: 'Challenge 1' },
          { value: 'c2', label: 'Challenge 2' },
          { value: 'c3', label: 'Challenge 3' }
        ],
        value: state.mode,
        onChange: function (v) { state.mode = v; }
      });
      c.checklist = ui.el('div', { className: 'checklist' });
      mode.body.appendChild(c.mode.el);
      mode.body.appendChild(c.checklist);

      var show = ui.panel('Show');
      c.magnify = ui.checkbox({ label: 'Magnify far side', checked: state.magnify, onChange: function (v) { state.magnify = v; } });
      c.magnifyLabel = ui.el('div', { className: 'note' });
      show.body.appendChild(c.magnify.el);
      show.body.appendChild(c.magnifyLabel);

      L.colA.appendChild(c.ideas.root);
      L.colA.appendChild(p1.root);
      L.colA.appendChild(p2.root);
      L.colB.appendChild(sound.root);
      L.colB.appendChild(mode.root);
      L.colB.appendChild(show.root);
    },

    enter: function () { scene.reset(); },
    leave: function () {},
    update: function () {},
    draw: function () {},
    reset: function () {
      state = defaults();
      sync();
    }
  };

  S.scenes.push(scene);
})(window.SoundSim);
