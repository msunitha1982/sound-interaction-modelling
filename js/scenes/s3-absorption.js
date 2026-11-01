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
      showGlow: true,
      showBar: true
    };
  }

  var state = defaults();
  var c = {};

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
    goal: 'Where does the sound’s energy go when it hits a soft material?',
    preview: preview,
    hasCheck: true,

    init: function (root) {
      var L = ui.sceneLayout(root, scene);

      c.ideas = ui.ideasPanel([
        'Energy is not created or destroyed. It changes form.',
        'Absorbed means the energy goes into the material.',
        'Thermal energy is the energy of molecules jiggling. More thermal energy means warmer.'
      ]);

      var mat = ui.panel('Material');
      c.material = ui.materialPicker({
        keys: ['concrete', 'wood', 'curtain', 'foam'],
        value: state.material,
        thickness: state.thickness,
        columns: 2,
        ariaLabel: 'Material',
        onMaterial: function (k, t) { state.material = k; state.thickness = t; },
        onThickness: function (t) { state.thickness = t; }
      });
      mat.body.appendChild(c.material.radios);
      mat.body.appendChild(c.material.thickness);

      var sound = ui.panel('Sound');
      c.sound = ui.toggleButton({ offLabel: 'Sound: Off', onLabel: 'Sound: On', onChange: function (on) { state.soundOn = on; } });
      c.clap = ui.button('Play clap', function () {});
      c.pitch = ui.slider({ label: 'Pitch', min: 150, max: 2000, step: 10, value: state.pitch, unit: 'Hz', onInput: function (v) { state.pitch = v; } });
      c.volume = ui.slider({ label: 'Volume', min: 0, max: 100, step: 1, value: state.volume, unit: '%', onInput: function (v) { state.volume = v; } });
      sound.body.appendChild(ui.el('div', { className: 'row' }, [c.sound.el, c.clap]));
      sound.body.appendChild(c.pitch.el);
      sound.body.appendChild(c.volume.el);

      var show = ui.panel('Show');
      c.glow = ui.checkbox({ label: 'Heat glow', checked: state.showGlow, onChange: function (v) { state.showGlow = v; } });
      c.bar = ui.checkbox({ label: 'Energy bar', checked: state.showBar, onChange: function (v) { state.showBar = v; } });
      show.body.appendChild(c.glow.el);
      show.body.appendChild(c.bar.el);

      L.colA.appendChild(c.ideas.root);
      L.colA.appendChild(mat.root);
      L.colB.appendChild(sound.root);
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
