/* Materials and the reflect / absorb / transmit model (CLAUDE.md section 7).
   No DOM. Runnable in Node. */
(function (root) {
  'use strict';

  // Teaching values, not measurements.
  // R: reflected share at the front face.
  // tlRef: transmission loss in dB at 500 Hz and thickness tRef (cm).
  // sT: extra dB per doubling of thickness. sF: extra dB per doubling of pitch.
  var MATERIALS = {
    concrete: { name: 'Concrete', R: 0.97, tlRef: 45, tRef: 10, tMin: 5, tMax: 30, step: 1, sT: 6, sF: 5 },
    wood: { name: 'Wood', R: 0.85, tlRef: 22, tRef: 4, tMin: 1, tMax: 10, step: 0.5, sT: 5, sF: 5 },
    glass: { name: 'Glass', R: 0.95, tlRef: 30, tRef: 1, tMin: 0.5, tMax: 3, step: 0.1, sT: 5, sF: 5 },
    foam: { name: 'Foam', R: 0.15, tlRef: 6, tRef: 5, tMin: 1, tMax: 15, step: 0.5, sT: 3, sF: 4 },
    curtain: { name: 'Curtain', R: 0.30, tlRef: 4, tRef: 1, tMin: 0.5, tMax: 3, step: 0.1, sT: 3, sF: 3 }
  };

  var model = { MATERIALS: MATERIALS };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = model;
  } else {
    root.SoundSim = root.SoundSim || {};
    root.SoundSim.model = model;
  }
})(this);
