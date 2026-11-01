# Kickoff prompt for Claude Code

Paste everything below the line into Claude Code, in a new empty project folder that already contains CLAUDE.md and scene-navigation.md. If you have them, put screenshots of PhET's Sound Waves and Waves Intro simulations in a `reference/` folder first.

---

You are building an educational simulation for 8th graders about sound reflection, absorption, and transmission. Read CLAUDE.md and scene-navigation.md in full before writing any code. They are the spec. CLAUDE.md wins on technical and UI rules; scene-navigation.md wins on scene content and on-screen text. If anything is unclear or two rules conflict, ask me instead of guessing.

The most important thing to understand: this is a lesson, not a pretty visual. Every element must help a student understand sound. Anything that only looks cool gets cut.

Two things I care about most:
1. It must look like a real science-education tool in the style of PhET (flat, dense, labeled, panels on the right, Reset All at bottom right, scene tabs at the bottom) and must not look AI-generated at all. The ban list in CLAUDE.md section 5 is strict.
2. It must run smoothly on old school Chromebooks. Plain HTML, CSS, and vanilla JS. No frameworks, no build step, no packages, no web fonts, no external requests. It must open by double-clicking index.html, so use classic script tags, not ES modules.

If `reference/` contains PhET screenshots, study them and match their layout conventions. Do not copy any PhET logo, artwork, icons, sounds, or code.

## How to work

Build in the stages below. Stop after each stage and report. Do not start the next stage until I say to continue.

**Stage 0: Plan, no code.** In about five sentences, restate the purpose and the two priorities above in your own words. List the files you will create (use the layout in CLAUDE.md section 3). List any questions or conflicts you found in the docs. Wait for my answer.

**Stage 1: Skeleton.** index.html, style.css, main.js, ui.js. Scaled fixed-aspect stage, title strip, empty sim area, caption bar, Think panel, right column, footer strip (Normal/Slow, Play/Pause, Step, Reset All, About the numbers), bottom nav bar with six tabs, hash routing, keyboard tab movement, placeholder scene modules. No simulation yet.

**Stage 2: Model and audio.** model.js with the material table and the R/A/T calculation, including the Node self-check (R + A + T = 1, no NaN, all values in [0, 1] across every control range). audio.js with Tone, Buzz, Clap, gain ramps, and the transmission chain. Run the self-check and show me the output.

**Stage 3: Shared 1D renderer and Scene 1.** wave1d.js, the tracer molecule, ruler, probe, pressure graph, caption logic, the Predict, Run, Result flow in the Think panel, and the checkmark.

**Stage 4: Scene 4 (Transmission), then Scene 3 (Absorption).** Reuse wave1d.js and the energy bar. Heat glow, far-side magnify, level meters, listen-side switch.

**Stage 5: Scene 2 (Reflection).** Image-source method, ring wavefronts, ray and normal, angle labels, draggable speaker and listener, tilting wall, echo audio at the real delay. Skip the optional magnifier inset unless I ask.

**Stage 6: Scene 5 (Put it together) and Scene 6 (Summary).** Two-layer wall, the three challenges with live conditions, the Summary page with print stylesheet.

**Stage 7: Polish pass.** Test at 1366x768 and 1024x600, test with 4x CPU throttling, check every control at both extremes, check Reset All and tab switching in every scene, and re-run the ban-list check across the whole app.

## After each stage

1. Open the page in a browser and look at it (screenshots at 1366x768 and 1024x600).
2. Check it against the ban list and the writing rules in CLAUDE.md and fix every violation you find before reporting.
3. Check that the on-screen text matches scene-navigation.md word for word.
4. Report in five lines or fewer: what works, what you changed from the docs and why, and anything you want me to decide.

## Do not

- Add features, scenes, settings, sounds, mascots, themes, dark mode, scoring, or saved data that are not in the docs.
- Install any dependency.
- Use emoji, gradients, shadows, glows, or web fonts anywhere.
- Write em dashes or exclamation points in on-screen text.
- Leave dead code or unused files.

A teacher should be able to open the page, click a tab, and use it with no instructions. A student should be able to say what sound is, and what happens when it meets a surface, after one class period.
