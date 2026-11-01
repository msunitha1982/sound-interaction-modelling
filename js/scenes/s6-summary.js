/* Scene 6: Summary. Content is added in Stage 6. */
(function (S) {
  'use strict';
  var ui = S.ui;

  var preview = '<svg class="tab-preview" width="44" height="30" viewBox="0 0 44 30" aria-hidden="true">' +
    '<defs><pattern id="pv6-hatch" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
    '<path d="M0 0 V3" stroke="#D55E00" stroke-width="1.2"/></pattern></defs>' +
    '<rect x="4.5" y="6.5" width="35" height="4" fill="#0072B2" stroke="#1b1b1b"/>' +
    '<rect x="4.5" y="13.5" width="35" height="4" fill="url(#pv6-hatch)" stroke="#1b1b1b"/>' +
    '<path d="M5 22.5 H39" stroke="#009E73" stroke-width="3" stroke-dasharray="4 2"/></svg>';

  var scene = {
    number: 6,
    slug: 'summary',
    tabLabel: 'Summary',
    title: 'Summary',
    preview: preview,
    hasCheck: false,
    isSummary: true,

    init: function (root) {
      root.appendChild(ui.el('div', { className: 'summary-page' }, [
        ui.el('h1', { className: 'scene-title', text: scene.title })
      ]));
    },

    enter: function () {},
    leave: function () {},
    update: function () {},
    draw: function () {},
    reset: function () {}
  };

  S.scenes.push(scene);
})(window.SoundSim);
