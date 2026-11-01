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
      magnify: true
    };
  }

  var state = defaults();
  var c = {};

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
        onMaterial: function (k, t) { state.material = k; state.thickness = t; },
        onThickness: function (t) { state.thickness = t; }
      });
      wall.body.appendChild(c.material.radios);
      wall.body.appendChild(c.material.thickness);

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
      sound.body.appendChild(c.sound.el);
      sound.body.appendChild(c.source.el);
      sound.body.appendChild(c.pitch.el);
      sound.body.appendChild(c.volume.el);

      var listen = ui.panel('Listen');
      c.listen = ui.radioGroup({
        label: 'Listen on:',
        options: [{ value: 'near', label: 'Speaker side' }, { value: 'far', label: 'Far side' }],
        value: state.listen,
        onChange: function (v) { state.listen = v; }
      });
      listen.body.appendChild(c.listen.el);

      var show = ui.panel('Show');
      c.magnify = ui.checkbox({ label: 'Magnify far side', checked: state.magnify, onChange: function (v) { state.magnify = v; } });
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
