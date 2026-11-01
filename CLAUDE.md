# Sound Simulation: Reflection, Absorption, Transmission

## 1. Purpose (read this first)

This is an educational tool for 8th graders. It is a lesson, not a visual toy. A student who uses it for one class period (about 45 minutes) should be able to explain, in their own words:

1. Sound is a disturbance that travels through a material. The molecules move back and forth around one place and pass the disturbance along. They do not travel with the wave.
2. When sound meets a surface, its energy is split three ways: reflected, absorbed, transmitted. The three shares always add up to 100%.
3. What changes the split: the material, its thickness, and the pitch of the sound.

Context: a teacher assigns this for one day and provides their own short follow-up activity. Do not build worksheets, quizzes, scores, grading, logins, or teacher dashboards. The content supports NGSS MS-PS4-2 (develop and use a model to describe that waves are reflected, absorbed, or transmitted through various materials).

The test for everything: does it help a student understand? If removing an animation, color, label, or sound would not make something harder to understand, remove it. Do not add features that are not in these docs. Ask first.

Priority order when things conflict: (1) correct science, (2) clarity, (3) runs well on weak hardware, (4) engagement. Engagement comes from cause and effect (move a slider, see and hear the change immediately), predictions, and challenges. It never comes from decoration.

## 2. Docs

- CLAUDE.md (this file): purpose, technical rules, UI rules, model, audio.
- scene-navigation.md: the six tabs, navigation behavior, and exact content for each scene (goal question, controls, captions, predictions, key ideas, checkmark rules).
- kickoff-prompt.md: the staged build plan (Stage 0 to Stage 7) and the checks and report required after each stage.

If they conflict, CLAUDE.md wins on technical and UI rules, scene-navigation.md wins on scene content. If something is unclear, ask. Do not guess. Every decision the owner makes is written back into these docs so they stay the source of truth.

## 3. Tech constraints

- Plain HTML, CSS, vanilla JavaScript. No framework, no build step, no npm packages, no CDN, no web fonts, no external requests of any kind.
- Must work when index.html is opened by double-click (file://) and must work offline once loaded. Therefore: classic `<script>` tags, NOT ES modules; no fetch() of local files; all data lives in JS files. Use one global namespace (`SoundSim`).
- Static hosting only (GitHub Pages). No backend, no accounts, no cookies, no localStorage, no analytics. Progress checkmarks live in memory and reset on reload.
- Canvas 2D. One canvas per sim area, plus a separate static-background canvas that is drawn once and redrawn only on resize or state change.
- Target hardware: school Chromebooks several years old. Test with Chrome DevTools CPU throttling at 4x slowdown; it should stay smooth (aim for 30 fps or better). Budget: about 1,500 to 2,500 molecule dots on screen at once.
- Performance habits that cost nothing: no object allocation inside the frame loop; Float32Array for positions; cap devicePixelRatio at 1.5; pause the loop when the tab is hidden; do not redraw static layers every frame.
- Keep the physics analytic (see section 7). Do not write a PDE or collision solver.
- Basic accessibility only: real `<button>` and `<input>` elements, a label on every control, visible focus outline, arrow-key movement between tabs. Do not build heavy accessibility tooling.

File layout:

```
CLAUDE.md, scene-navigation.md, kickoff-prompt.md   project docs
index.html
css/style.css
js/model.js        materials and the reflect/absorb/transmit calculation (no DOM; runnable in Node)
js/audio.js        Web Audio
js/ui.js           sliders, radios, checkboxes, panels, tools tray, energy bar, level meter
js/wave1d.js       shared 1D molecule-tube renderer
js/main.js         stage scaling, tab navigation, hash routing, frame loop
js/scenes/s1-what-is-sound.js
js/scenes/s2-reflection.js
js/scenes/s3-absorption.js
js/scenes/s4-transmission.js
js/scenes/s5-put-it-together.js
js/scenes/s6-summary.js
reference/         screenshots from the owner (PhET Sound Waves, Waves Intro); not shipped
```

## 4. Stage and layout (PhET conventions)

Mirror PhET's conventions, not its assets. Do not copy PhET's logo, icons, sounds, code, or artwork. If `reference/` has screenshots, match their conventions.

- Fixed-aspect stage of about 1024 x 618 stage units, scaled uniformly to fit the window, centered on a flat neutral page color. Design in stage units. Typical screens: 1366x768 and 1280x720.
- Regions (approximate; adjust after looking at screenshots; shrink the sim area before shrinking text):
  - Title strip, top left (about 700 x 52): scene title and, beneath it, the goal question.
  - Sim area, left (about 700 x 340).
  - Caption bar directly under the sim area (700 x 40): one or two plain sentences that update live.
  - Think panel under the caption bar (700 x about 90): prediction, then result, then key idea. One slot whose content changes as the student progresses.
  - Right column (about 300 wide): "Ideas you'll need" panel (collapsible, open by default), then control panels, then the tools tray (Scene 1 only).
  - Fitting the right column: lay radio groups out in 2 or 3 columns and put short controls side by side where possible. If a column still does not fit, shrink the sim area and widen the right column. Never shrink text below the minimum and never scroll the right column.
  - Summary tab: the page uses the whole area above the footer, in two columns, and scrolls inside the stage if it does not fit. On that tab the footer shows only "About the numbers"; the speed toggle, Play/Pause, Step, and Reset All are hidden.
  - Footer strip (about 36 tall), above the nav bar: speed toggle (Normal / Slow) at left, Play/Pause and Step at center, Reset All at right.
  - Nav bar (about 48 tall) at the bottom: one tab per scene, left to right, with a small hand-drawn SVG preview in each tab.
- Controls follow PhET habits: sliders show min and max at the ends and the current value with units; radio buttons for either/or; checkboxes for show/hide; titled panels with a thin border; draggable tools picked up from a tray.
- Reset All returns the current scene to its clean defaults (controls, tool positions, prediction state). It does not clear checkmarks. No confirmation dialog.
- Play/Pause freezes simulation time and audio. Step advances animation time by 1/20 s while paused.
- Speed toggle: Normal and Slow. Slow runs the animation 4 times slower than Normal. Normal is 400x slower than real sound (40x in Scene 2); Slow is 1,600x (160x in Scene 2). Scene 2 uses its own factor because at 400x a clap would take about a minute to cross the 30 m room.
- Scene timers (reveal triggers such as "6 s", and the "last 4 s" caption windows) count real seconds while playing, not slowed animation time, so they take the same wall-clock time in Normal and Slow. They do not advance while paused or on Step. Probe charts and other plots of the wave use animation time.
- Minimum text size is 13 stage units. Body is 14.

## 5. Visual style

Identity: a flat, dense, functional science-lab look, like a good textbook figure or a PhET screen. Quiet UI, all color reserved for the simulation itself.

Tokens (CSS variables):

```
--ink:        #1b1b1b
--ink-2:      #4d4d4d
--page:       #cfcdc4    (behind the stage)
--stage:      #f6f4ee
--sim:        #ffffff
--panel:      #ebe8df
--panel-edge: #8c887a
--rule:       #b5b1a3
--reflected:  #0072B2    solid
--absorbed:   #D55E00    diagonal hatching
--transmitted:#009E73    dashed
--molecule:   #3d4651
--tracer:     #CC79A7    (with 1.5px ink outline)
```

- One color per outcome, identical in every scene, always paired with its pattern (solid / hatched / dashed) so it works for colorblind students and black-and-white printouts. Heat glow uses the absorbed color at low opacity.
- Fonts (system stacks only): headings Georgia, "Times New Roman", serif. Body "Trebuchet MS", "Segoe UI", Roboto, Arial, sans-serif. Numbers and readouts ui-monospace, Consolas, Menlo, "DejaVu Sans Mono", monospace. Scene title 20, goal question 16 (serif), panel titles 14 bold.
- Corner radius 0 to 3 px. 1 px borders. Flat fills. Buttons are rectangles with a 1 px border; hover darkens the fill; pressed state inverts it.
- Diagram labels look like a textbook figure: thin leader lines, small text, aligned. Every part is labeled with its real name: compression, rarefaction, wavelength, tracer molecule, reflected, absorbed, transmitted, normal, angle of incidence, angle of reflection.
- Icons: none, or a few simple hand-built SVG shapes (speaker, listener, magnifier). No icon packs. No emoji anywhere.
- Motion: only the simulation moves. No UI transitions, entrance animations, hover animations, or ambient motion.

### Ban list (this must not look AI-generated)

Never use: gradients; box-shadow, text-shadow, drop-shadow, glow, blur, backdrop-filter, glassmorphism; purple, indigo, or neon accents; dark mode; pill-shaped buttons or radius above 4 px; card grids; hero sections; centered body text; emoji; stock icon sets; progress rings; confetti, stars, badges, trophies, or celebration toasts; decorative background shapes or patterns; Inter, Poppins, or other web fonts; tooltips on everything; sparkle or "magic" language; animated number counters.

After each stage, open the page, look at it, and list every ban-list violation you find. Fix them before reporting.

## 6. Writing rules for on-screen text

Plain teacher voice. Short declarative sentences. Present tense. Units on every number (Hz, dB, cm, m, ms, %, degrees).

- No exclamation points. No em dashes. No emoji. No "Let's", "dive in", "explore", "unlock", "discover", "journey", "magic", "awesome", "Great job".
- Feedback is neutral and informative: "Prediction recorded." "Your prediction matches the result." "Your prediction does not match the result. The tracer molecule returned to its starting position." Never praise, never scold.
- Define each term once, where it first appears, then use it consistently.
- Sentence case for labels and buttons ("Reset All" is the one exception, matching PhET).

## 7. The model

All three outcomes come from one function in model.js. Everything on screen and everything heard is computed from it. Sliders must change the result live.

Inputs: layer list (1 or 2 layers; each has material and thickness in cm), pitch f in Hz (150 to 2000).

Per layer, with thickness t and reference thickness t_ref:

```
TL_layer(dB) = TL_ref + s_t * log2(t / t_ref) + s_f * log2(f / 500)
```

Whole wall:

```
R = R_front                      (reflected share, from the first layer facing the speaker)
TL = sum of TL_layer over layers (at least 0.5 dB)
T = min( 10^(-TL/10), 1 - R )    (transmitted share)
A = 1 - R - T                    (absorbed share, becomes thermal energy)
```

R + A + T must equal 1 exactly. Display rounding: round R and T to one decimal place, then show A as 100 minus both so the displayed numbers always total 100.0%. Show values under 0.1% as "<0.1%".

Effective transmission loss: `TL_eff = -10 * log10(T)`. When T is capped at 1 - R, the summed TL no longer matches T, so every dB readout, level meter, caption, challenge condition, and audio setting uses TL_eff. The summed TL is used only to compute T. This keeps the dB values and the percentages consistent. dB values are shown to one decimal place. Wherever these docs write {TL} in on-screen text, it means TL_eff.

Starting material table (teaching values, tune so qualitative ordering holds and challenges stay passable; they are NOT measurements and the UI says so):

| Material | R | TL_ref (dB at 500 Hz) | t_ref (cm) | Thickness range (cm) | Slider step (cm) | s_t (dB per doubling) | s_f (dB per doubling of pitch) |
|---|---|---|---|---|---|---|---|
| Concrete | 0.97 | 45 | 10 | 5 to 30 | 1 | 6 | 5 |
| Wood | 0.85 | 22 | 4 | 1 to 10 | 0.5 | 5 | 5 |
| Glass | 0.95 | 30 | 1 | 0.5 to 3 | 0.1 | 5 | 5 |
| Foam | 0.15 | 6 | 5 | 1 to 15 | 0.5 | 3 | 4 |
| Curtain | 0.30 | 4 | 1 | 0.5 to 3 | 0.1 | 3 | 3 |

Defaults: each material starts at its t_ref. Choosing a different material resets the thickness slider to that material's t_ref and range.

Wave field for the 1D scenes (no solver, just superposed traveling waves). Pitch f, wavelength lambda = 34300 / f in cm. Incident wave amplitude A0 (set by volume).
- Before the wall: incident wave plus a reflected wave of amplitude A0 * sqrt(R) traveling the other way.
- Inside a layer: amplitude falls off exponentially so that the energy leaving equals the energy that entered times T / (1 - R). The local rate of energy loss drives the heat glow brightness.
- After the wall: a transmitted wave of amplitude A0 * sqrt(T).

Scene 2 (2D) uses the image-source method: reflect the speaker across the wall line to get the image point. Reflected path length = distance from the image point to the listener. Angle of incidence equals angle of reflection by construction. Draw the reflected wavefront as a ring centered on the image point, clipped to the room side of the wall.

Speed of sound: 343 m/s. Echo delay (ms) = (reflected path - direct path) / 343 * 1000.

Write `node js/model.js`-runnable self-checks: R + A + T = 1 within 1e-9, no NaN, and T, A, R all in [0, 1] across the full range of every control.

## 8. Audio

Web Audio API only. No audio files. Audio is started by the first button click (browser rule); every scene has a visible Sound On/Off control.

- Source types: Tone (sine at the pitch), Buzz (sawtooth at the pitch, rich in harmonics so muffling is audible), Clap (60 ms noise burst, band-limited).
- Keep pitch in 150 to 2000 Hz so it is audible on small speakers. Show a note recommending headphones in Scene 1.
- Master gain is capped at a comfortable level. Ramp gain over 20 ms on every change and on start and stop to avoid clicks. Stop all audio immediately when leaving a scene or when the tab is hidden.
- Reflection: direct clap with amplitude scaled by 1 / direct path, then the echo at the real delay with amplitude scaled by sqrt(R) / reflected path.
- Absorption: the echo amplitude is sqrt(R) times the direct amplitude, so soft materials give a clearly quieter echo.
- Transmission: far-side sound uses a low-pass filter and a gain, both computed from TL_eff. Starting values: cutoff = clamp(8000 * 10^(-TL_eff/40), 1.2 * pitch, 8000) Hz; gain = max(10^(-0.6 * TL_eff / 20), 0.01) times the near-side gain. The 0.6 factor compresses the range so a 45 dB reduction stays quiet but audible on a laptop. Tune by ear and keep the on-screen note that audio is compressed.
- Every sound has a matching visual cue (level meter or waveform) so it works in a noisy room or for a student who cannot hear it.

## 9. Honesty notes (must be visible in the UI)

A button labeled "About the numbers" (in the footer on every tab, including Summary) opens a plain text box. The Summary tab also prints the same text. The box text, as written:

- "The animation is slowed down. Normal view is about 400 times slower than real sound. Slow view is about 1,600 times slower. In the room scene, Normal view is 40 times slower and Slow view is 160 times slower. The current factor is always shown in a corner of the sim area."
- "Molecule motion is exaggerated so it can be seen. Real air molecules move far less in a sound wave."
- "The heat glow is exaggerated. The warming caused by ordinary sound is far too small to feel."
- "On the far side of a wall, the wave is drawn larger when Magnify far side is on, so it can be seen. The label shows how much larger, up to 200 times."
- "Material values are simplified teaching values, not measurements. Real walls depend on more things, such as how they are built, gaps, and pitch in more detail."
- "Audio levels are compressed so very quiet sounds can still be heard."
- "In the room scene, distances and echo delays are real. Only the animation is slowed."

## 10. Shared components

- Energy bar: one horizontal stacked bar, always in the order Reflected, Absorbed, Transmitted, always the outcome colors and patterns. Percentages in monospace under each segment with a leader line when a segment is too narrow. A segment never shrinks below 2 px so a tiny transmitted share is still visible. Caption under the bar: "Total: 100%".
- Level meter: vertical bar with dB scale, labeled "relative to the sound arriving at the wall".
- Tools tray (Scene 1 only): Measuring tape and Probe icons in a titled panel. Dragging a tool out places it in the sim; dragging it back (or Reset All) returns it. The measuring tape works like PhET's: drag its body to move it and drag its end to stretch it. It reads its own length in cm, to the nearest cm, so a student who lines it up with two compressions measures the wavelength. The probe shows a small strip chart of pressure against time at the spot where it sits, covering the last 3 s of animation time.
- Far-side magnifier (Scenes 4 and 5): the far-side wave is drawn N times larger. N is the largest value from 1, 2, 5, 10, 20, 50, 100, 200 that keeps the drawn far-side wave no taller than half the incoming wave. N never exceeds 200. Label: "Far side drawn {N}x larger." When the cap applies (the wave would need more than 200x to reach half height): "Far side drawn 200x larger (the maximum)." When N is 1: "Far side drawn at true size."
- Pressure graph (optional checkbox in Scene 1): pressure against position, aligned under the tube so peaks sit directly under the compressions.
- Caption bar: text is generated from the current state, never canned. See scene-navigation.md for templates.
- Think panel: PREDICT, then RUN, then RESULT. The sim is fully usable at every step; the panel never blocks anything.

## 11. Code conventions

- Each scene exposes `init(root)`, `enter()`, `leave()`, `update(dt)`, `draw()`, `reset()`. `leave()` stops audio. `enter()` resets to defaults.
- Simulation time advances by `dt * speedFactor` only while playing (speedFactor 1 in Normal, 0.25 in Slow). Clamp dt to 50 ms so a slow frame never causes a jump. Scenes receive both values as `update(dt, simDt)`: `dt` is real seconds (for scene timers, see section 4) and `simDt` is animation seconds. Step calls `update(0, 1/20)`.
- Keep scene state in one object per scene so Reset All is a single call.
- Comments explain the physics where it is not obvious. No dead code, no unused features.

## 12. Definition of done (per scene)

- Matches its section in scene-navigation.md exactly, including text.
- Every control changes both what is seen and what is heard, live, at its extremes, without errors.
- Reset All works. Leaving the scene stops audio. Entering it starts clean.
- Passes the ban-list check. Looks right at 1366x768 and 1024x600.
- Smooth with 4x CPU throttling.
