# Scenes and Navigation

Companion to CLAUDE.md. This file is the source of truth for scene content and on-screen text. Text in quotes is copy to use as written. Anything in {braces} is filled from live state.

Conventions used throughout this file:
- {TL} always means the effective transmission loss TL_eff from CLAUDE.md section 7, so dB and % always agree.
- Percentages and dB values are shown to one decimal place.
- Time windows ("at least 6 s", "within the last 4 s") are real seconds while playing (CLAUDE.md section 4). They take the same wall-clock time in Normal and Slow.
- Every "Volume" slider is 0 to 100%, default 50%, step 1.
- Every "Thickness" slider uses the chosen material's range and step from CLAUDE.md section 7, and resets to that material's t_ref when the material changes.

## 1. Navigation rules

- Six tabs in the bottom nav bar, in this order: 1 What is sound?, 2 Reflection, 3 Absorption, 4 Transmission, 5 Put it together, 6 Summary.
- Free navigation. Nothing is locked. A student can open any tab first, in any order, any number of times.
- Opening on page load: tab 1. Deep links by URL hash: `#1` to `#6` (also `#sound`, `#reflection`, `#absorption`, `#transmission`, `#together`, `#summary`). The hash updates when the tab changes, and changing the hash switches the tab. This lets a teacher link straight to one scene.
- Entering a scene always starts from that scene's clean defaults. Leaving a scene stops all audio immediately. No "are you sure" prompts.
- Because scenes can be opened first, every scene is self-contained: it has its own "Ideas you'll need" panel so a student who skips scene 1 still has the vocabulary.
- Tabs are `<button role="tab">`. Left and right arrow keys move between tabs. The selected tab has a thicker top border and a filled background. No glow.
- Progress marks: a small square checkbox drawn in SVG on each of tabs 1 to 5, empty or checked. In memory only. No scores, no percentages, no congratulation text. The marks are informational and never gate anything.
- Footer: speed toggle (Normal / Slow), Play/Pause, Step, Reset All, and an "About the numbers" button. On the Summary tab, only "About the numbers" is shown.

## 2. Scene template

Every scene screen has the same parts in the same places (see CLAUDE.md section 4):

1. Title strip: scene title and goal question.
2. Sim area with labeled parts.
3. Caption bar: live text from state.
4. Think panel with three stages:
   - PREDICT: "Predict" heading, the question, 2 to 4 options as radio buttons (or small diagrams), and a button "Record prediction". The sim is usable while this shows.
   - RUN: after recording, the panel shows "Prediction recorded." and one instruction for the student (for example "Turn the sound on and watch the tracer molecule.").
   - RESULT: appears automatically when the scene's reveal trigger happens. Shows the result text, then "Your prediction matches the result." or "Your prediction does not match the result.", then the key idea in a bordered box titled "Key idea".
5. "Ideas you'll need" panel in the right column (2 to 3 short lines, collapsible, open by default).
6. Controls and tools in the right column.

Checkmark rule for scenes 1 to 5: prediction recorded, reveal trigger reached, and the scene's key action done (stated per scene). If a student never records a prediction, the sim still works fully; they just do not get the mark and do not see the RESULT box until they do.

## 3. Scene 1: What is sound?

Tab preview: a speaker and a row of dots.

**Goal question:** "What actually travels when sound moves through air?"

**Ideas you'll need:**
- "Air is made of molecules."
- "Compression: a region where molecules are closer together than normal."
- "Rarefaction: a region where molecules are farther apart than normal."

**View:** a horizontal tube of air (side view), speaker cone at the left end. The tube runs off the right edge of the sim area with no end wall drawn, so nothing implies reflection, and no reflection is simulated. About 220 columns by 7 rows of dots (1D motion: all dots in a column share one displacement). The visible tube represents 240 cm. Labels with leader lines: "Speaker", "Compression", "Rarefaction", "Wavelength" (bracket between two compressions, shown when the measuring tape is not in use), "Tracer molecule". The tracer is one highlighted molecule (tracer color, outlined) 100 cm from the speaker, with a thin dotted vertical line marking its starting position.

**Controls (right column):**
- Panel "Sound": button "Sound: Off / On", slider "Pitch" 150 to 2000 Hz (default 500, step 10), slider "Volume" 0 to 100% (default 50).
- Panel "Show": checkboxes "Tracer molecule" (on), "Compression and rarefaction labels" (on), "Pressure graph" (off).
- Tools tray: Measuring tape, Probe.
- Note under the Sound panel: "Headphones work best."

**Source type:** Tone (sine). No source selector in this scene.

**Caption bar (first match wins):**
1. Sound off: "The speaker is off. The molecules are evenly spaced. Turn the sound on."
2. Sound on, measuring tape on the tube: "Measuring tape reads {measured} cm between two compressions. Wavelength = speed of sound / pitch = 34,300 cm/s / {f} Hz = {lambda} cm."
3. Pitch changed within the last 4 s: "Pitch {f} Hz: {f} compressions pass any point each second. Wavelength is {lambda} cm. Higher pitch means shorter wavelength."
4. Volume changed within the last 4 s: "Volume {v}%: the molecules move farther back and forth, so compressions are denser and rarefactions are thinner."
5. Otherwise, sound on: "The compressions travel to the right. The tracer molecule moves back and forth and stays near its starting position."

**Predict:** "The tracer molecule is 100 cm from the speaker. When sound passes it, what will the tracer molecule do?"
- A: "Travel with the wave to the far end of the tube."
- B: "Move back and forth around the same spot."
- C: "Travel back toward the speaker."

Correct: B.

**Reveal trigger:** sound has been on for at least 6 s (real seconds while playing) with the tracer visible.

**Result text:** "The tracer molecule returned to its starting position on every cycle. The compressions kept moving to the right, but the air did not flow down the tube."

**Key idea:** "Sound is a disturbance that travels through a material. The molecules only move back and forth around one place and pass the disturbance to their neighbors. Pitch is how many compressions pass each second. Volume is how far the molecules move."

**Key action for the checkmark:** pitch changed at least once while sound is on.

**Extras:** "Animation: 400x slower than real sound" in the sim corner (1,600x in Slow). Pressure graph: plots pressure against position under the tube, peaks lined up under the compressions. Probe: strip chart of pressure against time at its position.

## 4. Scene 2: Reflection

Tab preview: a ring hitting a wall.

**Goal question:** "What happens when sound hits a hard surface?"

**Ideas you'll need:**
- "A wavefront is the leading edge of a sound spreading out from its source."
- "The normal is a line at right angles to the wall."
- "An echo is sound that has bounced off a surface and arrives late."

**View:** top-down room, 30 m by 18 m, drawn to scale with a scale bar. One flat wall (concrete) on the right side that can tilt. It is the only reflecting surface; the other edges of the room are only the border of the map and reflect nothing. Corner label: "Animation: 40x slower than real sound" (160x in Slow). A draggable speaker (flat shape, label "Speaker") and a draggable listener (flat circle, label "Listener"). Pressing the clap button sends out a ring wavefront from the speaker (gray, ink). When it reaches the wall, a reflected wavefront appears as a ring centered on the image point, clipped to the room side (reflected color). When the Show ray option is on: incident ray from speaker to the wall hit point, dashed normal line, reflected ray from the hit point toward the listener, with angle arcs labeled "Angle of incidence {a} degrees" and "Angle of reflection {b} degrees", values to one decimal.

**Controls:**
- Panel "Sound": button "Play clap", slider "Wall angle" -30 to +30 degrees (default 0, step 1).
- Panel "Show": checkboxes "Ray and normal" (on), "Reflected wavefronts" (on).
- Panel "Readouts" (monospace): "Direct path: {d} m", "Reflected path: {r} m", "Echo delay: {ms} ms".
- Drag the speaker and the listener directly in the sim area (cursor changes; both have a visible grab outline).

**Source type:** Clap only.

**Caption bar:**
1. Before any clap: "Press Play clap. Drag the speaker, the listener, or tilt the wall and clap again."
2. After a clap, delay under 100 ms: "The reflected sound arrives {ms} ms after the direct sound. This is too short to hear as a separate echo."
3. After a clap, delay 100 ms or more: "The reflected sound arrives {ms} ms after the direct sound. Delays longer than about 100 ms are usually heard as a separate echo."
4. If the reflected ray does not reach the room side where the listener is (listener behind the wall line), or the reflection point falls off the end of the wall: "The wall is not between the speaker and the listener's side. No reflection reaches the listener."

**Predict:** "A clap leaves the speaker and hits the wall at the marked point. Which arrow shows the direction of the reflected sound?"
- A: arrow straight back toward the speaker.
- B: arrow leaving at the same angle on the other side of the normal.
- C: arrow running along the wall.

Each option is a small flat diagram of the wall, the normal, the incoming ray, and the candidate arrow. Correct: B.

**Reveal trigger:** the first clap with Ray and normal on.

**Result text:** "The reflected sound left the wall at {b} degrees from the normal. The sound arrived at {a} degrees. The angles are equal."

**Key idea:** "When sound hits a hard surface, most of it is reflected. The angle of reflection equals the angle of incidence, both measured from the normal. An echo is reflected sound that arrives late enough to be heard as a separate sound."

**Key action for the checkmark:** speaker, listener, or wall angle changed at least once, then a clap.

**Audio:** the direct clap scaled by 1 / direct path, then the echo at the real delay in ms, with the echo amplitude scaled by sqrt(R) and by 1 / reflected path. Wall is concrete, R = 0.97. Distances are real; the animation is slowed (label shown).

**Stretch (include only if time allows):** a magnifier circle at the hit point showing a small 1D molecule row along the ray, reusing wave1d.js with a fully reflecting end, labeled "Molecules at the wall".

## 5. Scene 3: Absorption

Tab preview: a wave fading into a hatched block.

**Goal question:** "Where does the sound's energy go when it hits a soft material?"

**Ideas you'll need:**
- "Energy is not created or destroyed. It changes form."
- "Absorbed means the energy goes into the material."
- "Thermal energy is the energy of molecules jiggling. More thermal energy means warmer."

**View:** the 1D molecule tube from scene 1 with a material block (hatched pattern for the absorbed color is used in the legend, the block itself drawn with denser dots) at about 60% along the tube, speaker on the left. Visible labels: "Incoming sound", "Reflected sound" (reflected color), "Material", "Heat glow". Inside the material the molecules jitter with an amplitude that falls off with depth, and a glow (absorbed color, low opacity) is strongest where the wave loses the most energy. Below the tube: the energy bar.

**Controls:**
- Panel "Material": radio buttons Concrete, Wood, Curtain, Foam (default Wood). Slider "Thickness" in cm with the range of the chosen material.
- Panel "Sound": button "Sound: Off / On" (continuous tone), button "Play clap" (clap and its echo), slider "Pitch" 150 to 2000 Hz (default 500), slider "Volume".
- Panel "Show": checkboxes "Heat glow" (on), "Energy bar" (on).

**Caption bar:**
1. Before any sound: "Choose a material, then turn the sound on or play a clap."
2. Otherwise: "{material}, {t} cm: {R}% reflected, {A}% absorbed, {T}% transmitted." Then, if A is at least 40%: "Much of the sound energy is turned into thermal energy inside the material." Else if R is at least 80%: "This surface is hard and dense, so most of the sound bounces back."

**Predict:** "You clap in front of each material. Which material gives the quietest echo?"
- Concrete, Wood, Curtain, Foam as radio buttons.

Correct: Foam.

**Reveal trigger:** the student has played the clap with at least two different materials.

**Result text:** "Echo strength (percent of sound energy reflected) for the materials you tried: {list of material: R%}. Foam reflected the least."  (If foam was not tried, replace the last sentence with "Try foam to compare.")

**Key idea:** "Absorbed sound energy does not disappear. It is converted to thermal energy in the material. Soft, porous materials absorb much of the sound that enters them and reflect little. Hard, dense materials reflect most of it."

**Key action for the checkmark:** thickness changed at least once.

**Audio:** clap, then its echo about 150 ms later with amplitude sqrt(R) times the direct amplitude. Continuous tone mode plays the tone only (the visual shows the reflected wave).

**Honesty note in the sim corner:** "Heat glow exaggerated. Real warming is too small to feel."

## 6. Scene 4: Transmission

Tab preview: a wave passing through a thick block.

**Goal question:** "How much sound gets through a wall, and what changes it?"

**Ideas you'll need:**
- "Transmitted means the sound passes through the material and comes out the other side."
- "A decibel (dB) is a unit of sound level. Every 10 dB lower is about half as loud to the ear."
- "Pitch is how high or low a sound is. It is measured in hertz (Hz)."

**View:** the 1D tube with a wall at the middle. Labels: "Speaker side", "Wall", "Far side", "Wall molecules pass the vibration along" (leader to the wall region). Inside the wall the molecules are drawn denser and visibly jitter. Two vertical level meters, one on each side of the wall, in dB relative to the sound arriving at the wall (near side reads 0 dB; far side reads -{TL} dB). A small head icon on whichever side is selected under "Listen".

**Controls:**
- Panel "Wall": radio buttons Concrete, Glass, Wood, Foam, Curtain (default Concrete). Slider "Thickness" with the material's range.
- Panel "Sound": button "Sound: Off / On", radio "Source: Tone / Buzz" (default Buzz), slider "Pitch" 150 to 2000 Hz (default 500), slider "Volume".
- Panel "Listen": radio "Listen on: Speaker side / Far side" (default Far side).
- Panel "Show": checkbox "Magnify far side" (on), with the live magnifier label from CLAUDE.md section 10 ("Far side drawn {N}x larger.", capped at 200x).

**Caption bar:**
1. Before any sound: "Turn the sound on. Switch between the speaker side and the far side."
2. Otherwise: "On the far side the sound is {TL} dB quieter than at the wall. {T}% of the sound energy gets through."
3. Add when pitch changed within the last 4 s: "At {f} Hz this wall reduces the sound by {TL} dB."

**Predict:** "A student keeps the same wall and changes the pitch from 200 Hz to 2000 Hz. What happens to the sound on the far side?"
- A: "It gets louder."
- B: "It stays about the same."
- C: "It gets quieter."

Correct: C.

**Reveal trigger:** pitch has been moved across at least 1,000 Hz while the sound is on.

**Result text:** "At {f1} Hz the far side was {x1} dB below the wall. At {f2} Hz it was {x2} dB below. Higher pitches were blocked more." Here f1 is the lowest and f2 the highest pitch reached while the sound was on, and x1, x2 are the TL_eff values at those pitches.

**Key idea:** "Sound passes through a wall because the wall's own molecules vibrate and pass the disturbance along. Part of the sound is reflected and part is absorbed on the way, so less energy comes out the other side. Thicker and denser walls let less through. Low pitches pass through more easily than high pitches."

**Key action for the checkmark:** listened on both sides at least once.

**Audio:** Buzz or Tone through the transmission audio chain in CLAUDE.md section 8. Show the note "Audio range is compressed so quiet sounds stay audible." under the Listen panel.

## 7. Scene 5: Put it together

Tab preview: a wall with three arrows leaving it.

**Goal question:** "How does one wall split the sound between reflecting, absorbing, and transmitting?"

**Ideas you'll need:**
- "Every surface reflects some sound, absorbs some, and transmits some."
- "The three shares always add up to 100% of the sound energy that arrives."
- "Material, thickness, and pitch change the shares."

**View:** the 1D tube with a wall (one or two layers), the labeled incoming, reflected, and transmitted waves, the energy bar below the tube (large, the main readout), and a far-side level meter.

**Controls:**
- Panel "Wall, layer 1 (faces the speaker)": material radio (Concrete, Glass, Wood, Foam, Curtain), thickness slider.
- Panel "Wall, layer 2": checkbox "Add second layer", then material radio and thickness slider (disabled when unchecked). Layer 2 sits behind layer 1.
- Panel "Sound": "Sound: Off / On", "Source: Tone / Buzz", pitch slider, volume slider, "Listen on: Speaker side / Far side".
- Panel "Mode": radio "Free play / Challenge 1 / Challenge 2 / Challenge 3". The challenge checklist appears inside this panel, under the radios.
- Panel "Show": checkbox "Magnify far side" (on), with the live magnifier label from CLAUDE.md section 10, same as Scene 4.

**Challenges (each shows a checklist of conditions marked "met" or "not met", plain text, updated live, inside the Mode panel; when every condition is met the panel shows "Goal met."):**

1. "Quiet room." One layer only. Pitch fixed at 300 Hz. Conditions: "Far side at least 40 dB quieter", "Wall no thicker than 10 cm". (Intended solution: concrete at 10 cm.)
2. "Dead room." One layer only. Pitch fixed at 500 Hz. Conditions: "Reflected share 20% or less". (Intended solution: foam.)
3. "Recording booth." Two layers allowed. Pitch fixed at 500 Hz. Conditions: "Reflected share 30% or less", "Far side at least 30 dB quieter", "Total thickness 20 cm or less". (Intended solution: foam or curtain facing the speaker, plus a dense layer behind it. R comes from layer 1 only; TL adds across layers.)

In a challenge, the fixed pitch slider is disabled and shows the fixed value. In challenges 1 and 2, "Add second layer" is unchecked and disabled. Conditions are evaluated on the displayed (rounded) numbers. Switching back to Free play enables the pitch slider and the second layer again and leaves the other controls as they are.

**Caption bar:**
1. Free play: "{layer description}: {R}% reflected, {A}% absorbed, {T}% transmitted. Total 100%."
2. Challenge: the challenge title and its goal in one sentence, for example "Dead room: reduce the reflected share to 20% or less."

**Predict:** "A thick concrete wall is hit by sound. Which of the three shares is largest?"
- A: "Reflected."
- B: "Absorbed."
- C: "Transmitted."

Correct: A.

**Reveal trigger:** layer 1 set to Concrete and sound on.

**Result text:** "For {t} cm of concrete at {f} Hz: {R}% reflected, {A}% absorbed, {T}% transmitted. The reflected share is the largest."

**Key idea:** "Every surface does all three: it reflects some sound, absorbs some, and transmits some. The three always add up to 100% of the sound energy. Different materials split the energy differently, and the split also depends on thickness and pitch."

**Key action for the checkmark:** none beyond prediction and reveal. Challenge results are recorded separately for the Summary.

## 8. Scene 6: Summary

A static, printable reference page (add a print stylesheet so it prints cleanly in black and white on one page, using patterns for the three outcomes). On screen it fills the whole area above the footer in two columns and scrolls inside the stage if it does not fit. The footer shows only "About the numbers", which is this tab's About button.

Contents:

1. Title: "Summary".
2. The three outcomes, each with its swatch (color plus pattern), name, and one-sentence definition:
   - "Reflected: the sound bounces back off the surface."
   - "Absorbed: the sound energy goes into the material and becomes thermal energy."
   - "Transmitted: the sound passes through the material and comes out the other side."
3. One line: "Sound energy that arrives = reflected + absorbed + transmitted = 100%."
4. The five key ideas, one per scene, using the exact Key idea text from scenes 1 to 5.
5. "Your progress": a plain list of the five scenes with "done" or "not done", and "Challenges met: 1, 2, 3" (list only those met, or "none yet"). In memory only.
6. "About this simulation": the same text as the "About the numbers" box.
7. "For teachers": "This simulation takes about 40 minutes. Scenes can be used in any order. Link to one scene with #1 to #5. It needs no login and stores no data. The follow-up activity is up to you."

No controls on this tab other than the "About the numbers" button (in the footer) and a "Print" button (top right of the page).
