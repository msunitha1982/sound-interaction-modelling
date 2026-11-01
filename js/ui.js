/* Shared UI builders: scene layout, panels, buttons, sliders, radios,
   checkboxes. Plain DOM, no framework. Everything hangs off SoundSim. */
window.SoundSim = window.SoundSim || {};
SoundSim.scenes = SoundSim.scenes || [];

SoundSim.ui = (function () {
  'use strict';

  var idCount = 0;
  function uid(prefix) {
    idCount += 1;
    return prefix + '-' + idCount;
  }

  // el('div', {className: 'x', text: 'hi', 'aria-label': 'y'}, [child, ...])
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    var key;
    if (attrs) {
      for (key in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, key)) { continue; }
        if (key === 'text') { node.textContent = attrs[key]; }
        else if (key === 'className') { node.className = attrs[key]; }
        else { node.setAttribute(key, attrs[key]); }
      }
    }
    if (children) {
      children.forEach(function (child) {
        if (child === null || child === undefined) { return; }
        node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
      });
    }
    return node;
  }

  // The fixed regions every scene shares (CLAUDE.md section 4). The right
  // column has two sub-columns, colA and colB, filled top to bottom.
  function sceneLayout(root, scene) {
    var left = el('div', { className: 'col-left' });
    var colA = el('div', { className: 'col-sub' });
    var colB = el('div', { className: 'col-sub' });
    var right = el('div', { className: 'col-right' }, [colA, colB]);
    var titleStrip = el('div', { className: 'title-strip' }, [
      el('h1', { className: 'scene-title', text: scene.title }),
      el('p', { className: 'goal', text: scene.goal })
    ]);
    var sim = el('div', { className: 'sim-area' });
    var caption = el('div', { className: 'caption-bar', 'aria-live': 'polite' });
    var think = el('section', { className: 'think-panel', 'aria-label': 'Think' });
    left.appendChild(titleStrip);
    left.appendChild(sim);
    left.appendChild(caption);
    left.appendChild(think);
    root.appendChild(left);
    root.appendChild(right);
    return { sim: sim, caption: caption, think: think, colA: colA, colB: colB };
  }

  function panel(title) {
    var titleId = uid('panel');
    var body = el('div', { className: 'panel-body' });
    var root = el('section', { className: 'panel', 'aria-labelledby': titleId }, [
      el('h2', { className: 'panel-title', id: titleId, text: title }),
      body
    ]);
    return { root: root, body: body };
  }

  // "Ideas you'll need": collapsible, open by default.
  function ideasPanel(lines) {
    var list = el('ul', null, lines.map(function (line) { return el('li', { text: line }); }));
    var details = el('details', { className: 'panel ideas', open: '' }, [
      el('summary', { text: 'Ideas you’ll need' }),
      list
    ]);
    return {
      root: details,
      reset: function () { details.open = true; }
    };
  }

  function note(text) {
    return el('p', { className: 'note', text: text });
  }

  function button(label, onClick) {
    var b = el('button', { type: 'button', className: 'btn', text: label });
    b.addEventListener('click', onClick);
    return b;
  }

  // A button that shows its state in its label, e.g. "Sound: Off" / "Sound: On".
  // Pressed (on) state is drawn inverted.
  function toggleButton(opts) {
    var on = false;
    var b = el('button', { type: 'button', className: 'btn', 'aria-pressed': 'false' });
    function render() {
      b.textContent = on ? opts.onLabel : opts.offLabel;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    b.addEventListener('click', function () {
      on = !on;
      render();
      opts.onChange(on);
    });
    render();
    return {
      el: b,
      set: function (value) { on = !!value; render(); }
    };
  }

  function decimalsFor(step) {
    return step < 1 ? 1 : 0;
  }

  // Slider: label and live value on one line, then min, track, max.
  // opts: label, min, max, step, value, unit, onInput(value)
  function slider(opts) {
    var id = uid('slider');
    var unit = opts.unit;
    var decimals = decimalsFor(opts.step);
    var input = el('input', { type: 'range', id: id });
    var value = el('span', { className: 'slider-value' });
    var minEnd = el('span', { className: 'slider-end', 'aria-hidden': 'true' });
    var maxEnd = el('span', { className: 'slider-end', 'aria-hidden': 'true' });
    var root = el('div', { className: 'slider' }, [
      el('div', { className: 'slider-head' }, [el('label', { for: id, text: opts.label }), value]),
      el('div', { className: 'slider-track' }, [minEnd, input, maxEnd])
    ]);

    function fmt(v) {
      return Number(v).toFixed(decimals) + (unit === '%' ? '' : ' ') + unit;
    }
    function render() {
      value.textContent = fmt(input.value);
      input.setAttribute('aria-valuetext', fmt(input.value));
    }
    function setRange(min, max, step, v) {
      decimals = decimalsFor(step);
      input.min = String(min);
      input.max = String(max);
      input.step = String(step);
      input.value = String(v);
      minEnd.textContent = fmt(min);
      maxEnd.textContent = fmt(max);
      render();
    }

    input.addEventListener('input', function () {
      render();
      opts.onInput(Number(input.value));
    });
    setRange(opts.min, opts.max, opts.step, opts.value);

    return {
      el: root,
      set: function (v) { input.value = String(v); render(); },
      setRange: setRange,
      setDisabled: function (disabled) {
        input.disabled = disabled;
        root.classList.toggle('disabled', disabled);
      }
    };
  }

  // Radio group. opts: options [{value, label}], value, onChange(value),
  // and either label (shown inline before the options, e.g. "Source:")
  // or ariaLabel (when the panel title already names the group),
  // plus columns (grid) when not inline.
  function radioGroup(opts) {
    var name = uid('radio');
    var inputs = [];
    var box = el('div', { className: opts.label ? 'radios-inline' : 'radios-grid' });
    if (!opts.label) {
      box.style.gridTemplateColumns = 'repeat(' + (opts.columns || 1) + ', auto)';
      box.style.justifyContent = 'start';
    } else {
      box.appendChild(el('span', { className: 'radios-label', text: opts.label, 'aria-hidden': 'true' }));
    }
    opts.options.forEach(function (o) {
      var input = el('input', { type: 'radio', name: name, value: o.value });
      input.addEventListener('change', function () {
        if (input.checked) { opts.onChange(o.value); }
      });
      inputs.push(input);
      box.appendChild(el('label', null, [input, o.label]));
    });
    var root = el('fieldset', {
      className: 'radios',
      'aria-label': opts.label ? opts.label.replace(/:$/, '') : opts.ariaLabel
    }, [box]);

    function set(value) {
      inputs.forEach(function (input) { input.checked = input.value === value; });
    }
    set(opts.value);
    return {
      el: root,
      set: set,
      setDisabled: function (disabled) {
        inputs.forEach(function (input) { input.disabled = disabled; });
        root.classList.toggle('disabled', disabled);
      }
    };
  }

  function checkbox(opts) {
    var input = el('input', { type: 'checkbox' });
    input.checked = !!opts.checked;
    input.addEventListener('change', function () { opts.onChange(input.checked); });
    var root = el('label', { className: 'check' }, [input, opts.label]);
    return {
      el: root,
      set: function (value) { input.checked = !!value; },
      setDisabled: function (disabled) {
        input.disabled = disabled;
        root.classList.toggle('disabled', disabled);
      }
    };
  }

  // Material radio group plus its thickness slider. Choosing a material
  // resets the slider to that material's range and reference thickness.
  // opts: keys, value, thickness, columns, ariaLabel, onMaterial(key, t), onThickness(t)
  function materialPicker(opts) {
    var M = SoundSim.model.MATERIALS;
    var first = M[opts.value];
    var thick = slider({
      label: 'Thickness', min: first.tMin, max: first.tMax, step: first.step,
      value: opts.thickness, unit: 'cm', onInput: opts.onThickness
    });
    var radios = radioGroup({
      ariaLabel: opts.ariaLabel,
      columns: opts.columns,
      value: opts.value,
      options: opts.keys.map(function (k) { return { value: k, label: M[k].name }; }),
      onChange: function (k) {
        var m = M[k];
        thick.setRange(m.tMin, m.tMax, m.step, m.tRef);
        opts.onMaterial(k, m.tRef);
      }
    });
    return {
      radios: radios.el,
      thickness: thick.el,
      set: function (key, t) {
        var m = M[key];
        radios.set(key);
        thick.setRange(m.tMin, m.tMax, m.step, t);
      },
      setDisabled: function (disabled) {
        radios.setDisabled(disabled);
        thick.setDisabled(disabled);
      }
    };
  }

  // Text of the "About the numbers" box (CLAUDE.md section 9). The Summary
  // tab prints the same lines.
  var aboutLines = [
    'The animation is slowed down. Normal view is about 400 times slower than real sound. Slow view is about 1,600 times slower. In the room scene, Normal view is 40 times slower and Slow view is 160 times slower. The current factor is always shown in a corner of the sim area.',
    'Molecule motion is exaggerated so it can be seen. Real air molecules move far less in a sound wave.',
    'The heat glow is exaggerated. The warming caused by ordinary sound is far too small to feel.',
    'On the far side of a wall, the wave is drawn larger when Magnify far side is on, so it can be seen. The label shows how much larger, up to 200 times.',
    'Material values are simplified teaching values, not measurements. Real walls depend on more things, such as how they are built, gaps, and pitch in more detail.',
    'Audio levels are compressed so very quiet sounds can still be heard.',
    'In the room scene, distances and echo delays are real. Only the animation is slowed.'
  ];

  return {
    el: el,
    sceneLayout: sceneLayout,
    panel: panel,
    ideasPanel: ideasPanel,
    note: note,
    button: button,
    toggleButton: toggleButton,
    slider: slider,
    radioGroup: radioGroup,
    checkbox: checkbox,
    materialPicker: materialPicker,
    aboutLines: aboutLines
  };
})();
