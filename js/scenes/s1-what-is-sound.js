/* Scene 1: What is sound? */
(function (S) {
  'use strict';
  var ui = S.ui;

  function defaults() {
    return {
      soundOn: false,
      pitch: 500,
      volume: 50,
      showTracer: true,
      showLabels: true,
      showGraph: false
    };
  }

  var state = defaults();
  var c = {}; // controls

  // Dots bunch up (compressions) and spread out (rarefactions).
  var dotsX = [14, 16, 17.5, 19, 21, 24, 27.5, 30.5, 32, 33.5, 35, 37, 40];
  var preview = '<svg class="tab-preview" width="44" height="30" viewBox="0 0 44 30" aria-hidden="true">' +
    '<rect x="2" y="11" width="4" height="8" fill="#ebe8df" stroke="#1b1b1b"/>' +
    '<path d="M6 11 L10 7 L10 23 L6 19 Z" fill="#ebe8df" stroke="#1b1b1b"/>' +
    dotsX.map(function (x) { return '<circle cx="' + x + '" cy="15" r="1.1" fill="#3d4651"/>'; }).join('') +
    '</svg>';

  // Simple hand-drawn tool icons for the tray.
  var tapeIcon = '<svg width="26" height="20" viewBox="0 0 26 20" aria-hidden="true">' +
    '<rect x="1.5" y="3.5" width="13" height="13" rx="2" fill="#ebe8df" stroke="#1b1b1b"/>' +
    '<circle cx="8" cy="10" r="3" fill="none" stroke="#1b1b1b"/>' +
    '<path d="M14.5 13.5 H24.5" stroke="#1b1b1b" stroke-width="2"/>' +
    '<path d="M24.5 11 V16" stroke="#1b1b1b"/></svg>';
  var probeIcon = '<svg width="26" height="20" viewBox="0 0 26 20" aria-hidden="true">' +
    '<circle cx="8" cy="10" r="6" fill="#ffffff" stroke="#1b1b1b"/>' +
    '<path d="M8 6 V14 M4 10 H12" stroke="#1b1b1b" stroke-width="0.8"/>' +
    '<path d="M14 10 H25" stroke="#1b1b1b" stroke-width="2"/></svg>';

  function tool(label, icon) {
    var b = ui.el('button', { type: 'button', className: 'btn tool' });
    b.innerHTML = icon + '<span>' + label + '</span>';
    return b;
  }

  function sync() {
    c.sound.set(state.soundOn);
    c.pitch.set(state.pitch);
    c.volume.set(state.volume);
    c.tracer.set(state.showTracer);
    c.labels.set(state.showLabels);
    c.graph.set(state.showGraph);
    c.ideas.reset();
  }

  var scene = {
    number: 1,
    slug: 'sound',
    tabLabel: 'What is sound?',
    title: 'What is sound?',
    goal: 'What actually travels when sound moves through air?',
    preview: preview,
    hasCheck: true,

    init: function (root) {
      var L = ui.sceneLayout(root, scene);

      c.ideas = ui.ideasPanel([
        'Air is made of molecules.',
        'Compression: a region where molecules are closer together than normal.',
        'Rarefaction: a region where molecules are farther apart than normal.'
      ]);

      var sound = ui.panel('Sound');
      c.sound = ui.toggleButton({ offLabel: 'Sound: Off', onLabel: 'Sound: On', onChange: function (on) { state.soundOn = on; } });
      c.pitch = ui.slider({ label: 'Pitch', min: 150, max: 2000, step: 10, value: state.pitch, unit: 'Hz', onInput: function (v) { state.pitch = v; } });
      c.volume = ui.slider({ label: 'Volume', min: 0, max: 100, step: 1, value: state.volume, unit: '%', onInput: function (v) { state.volume = v; } });
      sound.body.appendChild(c.sound.el);
      sound.body.appendChild(c.pitch.el);
      sound.body.appendChild(c.volume.el);

      var show = ui.panel('Show');
      c.tracer = ui.checkbox({ label: 'Tracer molecule', checked: state.showTracer, onChange: function (v) { state.showTracer = v; } });
      c.labels = ui.checkbox({ label: 'Compression and rarefaction labels', checked: state.showLabels, onChange: function (v) { state.showLabels = v; } });
      c.graph = ui.checkbox({ label: 'Pressure graph', checked: state.showGraph, onChange: function (v) { state.showGraph = v; } });
      show.body.appendChild(c.tracer.el);
      show.body.appendChild(c.labels.el);
      show.body.appendChild(c.graph.el);

      var tools = ui.panel('Tools');
      tools.body.appendChild(ui.el('div', { className: 'tray' }, [tool('Measuring tape', tapeIcon), tool('Probe', probeIcon)]));

      L.colA.appendChild(c.ideas.root);
      L.colA.appendChild(sound.root);
      L.colA.appendChild(ui.note('Headphones work best.'));
      L.colB.appendChild(show.root);
      L.colB.appendChild(tools.root);
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
