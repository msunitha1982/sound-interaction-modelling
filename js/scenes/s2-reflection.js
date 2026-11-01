/* Scene 2: Reflection */
(function (S) {
  'use strict';
  var ui = S.ui;

  function defaults() {
    return {
      wallAngle: 0,
      showRay: true,
      showFronts: true
    };
  }

  var state = defaults();
  var c = {};

  var preview = '<svg class="tab-preview" width="44" height="30" viewBox="0 0 44 30" aria-hidden="true">' +
    '<path d="M36 3 V27" stroke="#1b1b1b" stroke-width="3"/>' +
    '<path d="M24.5 4.5 A16 16 0 0 1 24.5 25.5" fill="none" stroke="#1b1b1b"/>' +
    '<path d="M34 8 A12 12 0 0 0 34 22" fill="none" stroke="#0072B2" stroke-width="1.5"/>' +
    '<circle cx="9" cy="15" r="2" fill="#1b1b1b"/></svg>';

  function sync() {
    c.angle.set(state.wallAngle);
    c.ray.set(state.showRay);
    c.fronts.set(state.showFronts);
    c.ideas.reset();
  }

  var scene = {
    number: 2,
    slug: 'reflection',
    tabLabel: 'Reflection',
    title: 'Reflection',
    goal: 'What happens when sound hits a hard surface?',
    preview: preview,
    hasCheck: true,

    init: function (root) {
      var L = ui.sceneLayout(root, scene);

      c.ideas = ui.ideasPanel([
        'A wavefront is the leading edge of a sound spreading out from its source.',
        'The normal is a line at right angles to the wall.',
        'An echo is sound that has bounced off a surface and arrives late.'
      ]);

      var sound = ui.panel('Sound');
      c.clap = ui.button('Play clap', function () {});
      c.angle = ui.slider({ label: 'Wall angle', min: -30, max: 30, step: 1, value: state.wallAngle, unit: 'degrees', onInput: function (v) { state.wallAngle = v; } });
      sound.body.appendChild(c.clap);
      sound.body.appendChild(c.angle.el);

      var show = ui.panel('Show');
      c.ray = ui.checkbox({ label: 'Ray and normal', checked: state.showRay, onChange: function (v) { state.showRay = v; } });
      c.fronts = ui.checkbox({ label: 'Reflected wavefronts', checked: state.showFronts, onChange: function (v) { state.showFronts = v; } });
      show.body.appendChild(c.ray.el);
      show.body.appendChild(c.fronts.el);

      var readouts = ui.panel('Readouts');
      c.direct = ui.el('div', { className: 'readout', text: 'Direct path:' });
      c.reflected = ui.el('div', { className: 'readout', text: 'Reflected path:' });
      c.delay = ui.el('div', { className: 'readout', text: 'Echo delay:' });
      readouts.body.appendChild(c.direct);
      readouts.body.appendChild(c.reflected);
      readouts.body.appendChild(c.delay);

      L.colA.appendChild(c.ideas.root);
      L.colA.appendChild(sound.root);
      L.colB.appendChild(show.root);
      L.colB.appendChild(readouts.root);
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
