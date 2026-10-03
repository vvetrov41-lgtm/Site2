# "Serious Flower" — production plan

A ~35 s vertical (1080×1920) crayon-style cartoon, drawn 100 % in code and
played in the browser at 12 drawings per second.

The attached reference is used only for art direction (crayon texture,
wobbly black outlines, chibi proportions, cute faces, soft palette, sparse
props, white paper). Nothing is copied from its layout, and no text from it
appears anywhere. The film itself contains no written text at all.

---

## 1. Technical architecture

**Choice: HTML5 Canvas 2D + plain ES modules, no dependencies.**

| Need | Canvas 2D | SVG |
|---|---|---|
| Crayon grain, scribble fills, paper tooth | native (patterns, clip, composite ops) | needs filters, slow on mobile |
| Full redraw 12×/s with new wobble | cheap: one immediate-mode pass | rebuilding/patching hundreds of DOM nodes |
| Deterministic frame export (PNG → MP4) | `toDataURL` per frame | needs rasterising anyway |
| Exact 1080×1920 composition | fixed backing store, CSS scales it | fine |

SVG would only win for crisp vector UI, which is exactly the look we must
avoid. A hybrid is not worth the complexity. Dev UI is plain DOM on top of
the canvas, so it can never leak into rendered frames.

```
kristina-cartoon/
  index.html               player  (?dev = review tools, ?render = export hooks)
  src/config.js            size, fps, palette, safe area
  src/core/rng.js          seeded hash + value noise (no Math.random anywhere)
  src/core/pencil.js       hand-drawn line system: wobble, marker strokes, crayon fills
  src/core/paper.js        paper + crayon grain textures, final compositing
  src/core/anim.js         pose-to-pose helpers (keys, holds, stepped zoom), IK
  src/characters/rig.js    shared body rig: torso, limbs (2-bone IK), hands, legs (stand/walk/sit)
  src/characters/faces.js  expression library for both characters
  src/characters/kristina.js / client.js   style sheets: hair, clothes, tattoos
  src/props/studio.js      chair, stool, trolley, lamps, plant, frames, mirror, floor
  src/props/items.js       phone, tattoo machine, flower (shared by phone screen + tattoo)
  src/fx/effects.js        hearts, stars, sparkles, notes, bursts, nod arcs, vibration zigzags
  src/scenes/*.js          8 scenes, each = { name, len, draw(localFrame) }
  src/timeline.js          scene order, frame → scene lookup
  src/audio/synth.js       formant "mouth" voice synth (Web Audio)
  src/audio/cues.js        sound cue timeline (in frames)
  src/audio/engine.js      live scheduling + offline WAV render
  src/app/player.js        12 fps clock (audio clock when sound is on)
  src/app/devtools.js      play/pause/replay/scrub/scene jump/wobble/safe-area
  src/main.js              wiring for play / dev / render modes
  tools/render.cjs         headless Chromium → PNG frames + WAV → MP4 (ffmpeg)
```

## 2–3. Storyboard and exact durations

12 fps; 1 frame = 83.3 ms. Total **412 frames = 34.33 s** (after the timing pass).

| # | Scene | Frames | Time | Shot |
|---|---|---|---|---|
| 1 | Arrival | 0–41 (42) | 00:00.0–00:03.5 | wide studio |
| 2 | The flower | 42–83 (42) | 00:03.5–00:07.0 | medium two-shot |
| 3 | Serious nod #1 | 84–125 (42) | 00:07.0–00:10.5 | Kristina close-up, slight push-in |
| 4a | Tattooing — setup | 126–155 (30) | 00:10.5–00:13.0 | medium wide, both seated |
| 4b | Tattooing — insert | 156–203 (48) | 00:13.0–00:17.0 | arm close-up, flower appears |
| 4c | Tattooing — last touch | 204–223 (20) | 00:17.0–00:18.67 | same as 4a (camera 1.12×) |
| 5 | Serious nod #2 | 224–265 (42) | 00:18.67–00:22.17 | identical framing to scene 3 |
| 6 | The mirror | 266–309 (44) | 00:22.17–00:25.83 | wide, slow push-in |
| 7 | Reaction | 310–363 (54) | 00:25.83–00:30.33 | client waist-up |
| 8 | Happy ending | 364–411 (48) | 00:30.33–00:34.33 | two-shot, final hold |

## 4. Character design spec

Shared rig (local units, feet at y=0, up is negative): total height ≈ 1000,
head radius 150 (head ≈ 1/3 of height), shoulders ±104 at y −548,
hips y −330, 2-bone arms (125 + 120) solved with IK from a hand target,
legs: stand / walk cycle (8 drawings) / sit. Front-facing bodies; head turn
is faked by sliding facial features and hair parting (children's drawing logic).

**Kristina** — see `docs/CHARACTERS.md` (authoritative, updated from the real
photo references). Pastel-pink hair with dark roots, crescent-moon forehead
tattoo, big serious eyes, slim nose, subtle lips, black oversized top.
Two looks: *intro* (loose hair, soft bangs, moon visible, pearls) in scenes
1–3, and *working* (low ponytail, black glasses, white AirPod, pink gloves)
in scenes 4–8, drawn in side profile while tattooing.
She does not smile until scene 8.

**Client** — long wavy warm light-brown hair (#c58d55) with centre parting and
two front locks over the shoulders; lilac short-sleeve tee (forearms bare for
the tattoo), light-blue wide jeans, white sneakers. Big round eyes with two
highlights, rosy cheeks, soft brows, open friendly smile.
Tattoo: on her screen-left forearm, always drawn upright for readability.

The same two rig functions draw every appearance; scenes only pass poses.

## 5. Visual grammar

- White paper (#fffdf9), visible in every shot; props are sparse outline doodles.
- Outlines: near-black marker (#231f20), 4–7 px on screen, width varies
  along the stroke, ends taper, closed shapes overshoot their start like a
  child closing a loop.
- Fills: light flat tint + zig-zag crayon scribble at a per-shape angle,
  colour sometimes slips past the outline by 1–3 px.
- Crayon grain knocked out of the whole drawing (paper tooth).
- Palette: ink black, Kristina browns/blacks, client lilac/denim/honey,
  accents pink #f47aa8, red, leaf green, sunny yellow, orange pot, greys.
- Effects are doodles: hearts, 5-point stars, 4-point sparkles, short lines.
- Camera: static; hard cuts; only stepped push-ins (nods, mirror).

## 6–7. Timeline and beats (local frames)

**1 Arrival (0–41)** — f0 Kristina already standing right, arms crossed,
deadpan (this is the hook/thumbnail). f2–26 client walks in from the left
(4-drawing steps, music notes over her head), Kristina's eyes track her.
f26–28 stop with settle. f29–41 client waves (2 drawings alternating every
3 frames); Kristina blinks once and nothing else.

**2 Flower (42–83)** — f0–4 client reaches to her pocket, f5 anticipation dip,
f6–7 phone shoots up, screen to camera (cheat), f8 "ting!" + sparkle
burst. f10 Kristina's eyes snap to the phone, f14–18 she leans in.
Phone screen ≈ 170×300 px: one coral-red five-petal flower, yellow centre,
green stem, two leaves.

**3 Nod #1 (84–125)** — close-up. f0–8 stillness, eyes on the (off-screen)
phone. f9–20 "mmmm…", eyes narrow, push-in 1.00→1.06 in 2-frame steps.
f22–23 head goes down, f24–28 hold at bottom ("m!", two small nod arcs),
f29–30 up. f31–41 she stares straight at the camera. Nothing moves.

**4a Setup (126–155)** — client in the chair (right), arm on the armrest;
Kristina on the stool (left) in side profile (ponytail, glasses, AirPod,
pink gloves), machine on the
forearm vibrating on alternate frames, "brrrr". Hanging lamp lights the arm.
Client calmly looks at the ceiling, blinks.

**4b Insert (156–203)** — huge forearm across the frame. f0–1 machine lowers,
f2–25 needle traces the outline (petals → centre → stem → leaves), f25–27
lift, f28–40 colour fills pop in part by part with the needle visiting each
part, f40–47 machine lifts, finished flower holds clean.

**4c Last touch (204–227)** — back to 4a framing; tattoo complete; tiny
client yawn (f4–11); last "brrr" until f14, then stillness.

**5 Nod #2 (228–269)** — same camera as scene 3, now in the working look
(ponytail, glasses, AirPod, pink gloves), machine raised.
f1 "p!" as the machine lifts. Then *exactly* scene 3's beat table
(same function, same frame numbers): stillness, "mmmm", push-in, nod, stare.

**6 Mirror (270–317)** — tall studio mirror on the right. f0–16 client walks
to it, f16–18 settle, f18–22 raises the tattooed arm (one in-between),
f22–47 she simply looks; reflection mirrors her; one blink; stepped
push-in starting f24; silence.

**7 Reaction (318–371)** — waist-up. f0–7 neutral hold looking at the arm.
f8 snap to "ooh" (eyes huge, O mouth, burst lines, stretch). f14–19 star
eyes. f20 arms up + hops (6-drawing hop with squash on landing), hearts
/ stars / sparkles burst at f20, f32, f44. "oooooh!", "weeee!", giggles.

**8 Ending (372–419)** — two-shot. f0–9 client hops, Kristina still deadpan,
f6 her eyes glance at the client, f10–12 corner-of-mouth twitch,
f13 she breaks: huge grin, arms up, burst; both hop out of phase;
f30–47 final hold (only line boil, sparkles twinkle, hearts drift).

## 8. Sound cue timeline (frame → cue)

The authoritative list is `src/audio/cues.js`; cues are stored per scene
(scene id + local frame) so they follow scene-length changes. Absolute frames
below are from the first draft (before the timing pass).

All sounds are synthesised "mouth noises" (formant voice + noise), no words.

| Frame | Time | Cue |
|---|---|---|
| 3 | 0.25 | "doo-dee-doo" hum while walking |
| 30 | 2.50 | small "oo-ee!" greeting coo |
| 50 | 4.17 | "ting!" phone |
| 93 | 7.75 | "mmmm…" (1.0 s) |
| 108 | 9.00 | "m!" nod |
| 128–154 | 10.67 | "brrrrr" |
| 158–181, 184–196 | 13.17 / 15.33 | "brrrrr" outline / colour |
| 204–218 | 17.00 | last "brrr" |
| 208 | 17.33 | tiny yawn |
| 229 | 19.08 | "p!" |
| 237 | 19.75 | "mmmm…" |
| 252 | 21.00 | "m!" |
| 326 | 27.17 | "oooooh!" |
| 338 | 28.17 | "weeee!" |
| 351, 361 | 29.25 / 30.08 | giggles |
| 385 | 32.08 | Kristina's low "hehe" |
| 386 | 32.17 | "weee!" + twinkle |
| 404, 410 | 33.7 / 34.2 | twinkles |

## 9. Instagram safe-area plan

- Top 0–250 px: progress bar / account header → only hair tips, wall frames.
- Bottom 1500–1920 px: caption, audio, buttons → only floor, legs, feet.
- Right column x > 950, y 1000–1700: like/comment/share → no faces, no props that matter.
- Faces, phone, tattoo, mirror reaction live inside x 80–940, y 300–1450.
- Profile grid crops to the centre 3:4 (y 240–1680): frame 0 shows
  Kristina's deadpan face inside it.
- Dev mode draws these zones as an overlay (DOM only).

## 10. The 12 fps hand-drawn system

- Film time → `frame = floor(t × 12)`. The canvas is only redrawn when that
  integer changes, so the picture can never update at display rate.
  Scene code receives integer frames; there is no sub-frame interpolation.
- Every stroke has a stable key (e.g. `k.head`, `c.hair.back`) hashed into a seed.
- Each control point gets two seeded offsets: a **static** offset (≈2.4 px,
  the drawing's permanent imperfection) and a **boil** offset (≈1.3 px)
  that picks one of 3 variants, switching every 2 frames (classic 3-drawing
  line boil at 6 Hz). Amplitudes are in screen pixels, so close-ups don't
  boil harder than wide shots.
- Outlines are polygons with seeded width variation and tapered ends.
- Fills: tint + zig-zag scribble re-seeded per boil variant; separate jitter
  from the outline (colour slips past lines a little).
- Grain pattern knocked out of the drawing, shifted per variant.
- "Wobble off" freezes the variant (static imperfection stays).
- Export holds each drawing for 2 frames of a 24 fps MP4.

## 11. Technical risks

1. Hand-built characters looking stiff or "vector" → crayon fill + boil +
   overshoot loops; review rendered frames, refine.
2. Front-facing bodies in side-ways actions (walking, seated tattooing) →
   accept children's-drawing logic, sell direction with face turn.
3. Tattoo too small on a phone → insert close-up (4b) + waist-up reaction (7).
4. Mirror reflection confusing → lighter, tinted, smaller, clipped to glass.
5. Formant-synth voices sounding robotic → keep them short, pitched up,
   breathy, low in the mix; sound is secondary.
6. Audio/visual drift → audio clock drives the frame counter when sound is on.
7. Mobile performance → ~150 shapes/frame at 12 fps only; no per-pixel work
   except one grain pattern fill.
8. Autoplay with sound is blocked → a tap-to-play icon (no text).

---

## Self-review of the first draft (and fixes applied)

| Problem found | Fix |
|---|---|
| Draft had Kristina thinking with a flower thought-bubble — too close to the reference and it explains the joke. | Removed. The joke is pure stillness + squint + nod. |
| Draft had the client put her hands on her cheeks — a pose lifted from the reference. | Replaced with ooh → star eyes → arms-up hops. |
| Nods in a front view can read as a twitch on a phone. | Nod = head drop + features slide down + lids lower + 5-frame hold at the bottom + two doodle arcs + "m!". Push-in before it frames the face. |
| Two nods drawn separately could drift apart and kill the repetition joke. | Both scenes call one `seriousNodBeat()` function with identical frame numbers and the same camera. |
| Seated tattooing wide shot can't show the flower at phone size. | Wide shot is short (2.5 s); the flower is "told" in the 4 s insert; 4c shows it finished. |
| Tattoo following forearm rotation turned sideways when arms go up. | Tattoo is always upright (child logic). Readable in every shot. |
| Too many props in the wide shot. | Scene 1: chair, lamp, 2 frames only. Plant only in scenes 6 & 8. Trolley only in 4a. |
| Constant motion in scene 4 would be tiring. | Pause between outline and colour; yawn gag; stillness at end of 4c. |
| Client's long-sleeve top in the reference would hide the tattoo. | Short sleeves. |
| Kristina's look was corrected from photos (pink hair, moon, glasses). Pink gloves + pink hair could merge with a pink tattoo flower. | Tattoo / phone flower is now coral-red with a yellow centre; gloves stay pastel pink. |
| Hair change between scenes 3 and 4 could read as a different person. | Every view keeps pink hair + dark roots + black top; front views always show the moon; the working look is introduced on the cut into the tattoo scene. |
| Wobble amplitude in local units would explode in close-ups. | All wobble/line widths computed in screen pixels. |
| Ending risked a too-short final hold. | 18-frame (1.5 s) final hold. |

## Refinement passes (after the first render)

Visual
- Phone was hidden behind Kristina's hair → phone drawn on a top layer, characters spaced apart.
- Hair-bounce formula flipped the client's locks into "wings" → fixed.
- Profile: elbow bent upwards, black-on-black arms → elbow down, lighter sleeves, bigger pink gloves, lighter machine.
- Insert: Kristina's arms read as black bars → bare wrists with doodle tattoos, glove cuffs, sleeve far back.
- Working front hair looked like a swim cap → side volume, curtain fringe, ponytail peeking behind the neck.
- Nod arcs were lost in the hair → bigger, thicker.
- Tattoo arm pointed straight up like a finger → forearm horizontal across the chest.
- Tattoo wide shot too small → 1.12× camera.
- Frame 0 had a sliver of the client at the edge → clean deadpan hook.

Timing
- 4c −4 frames (two silences in a row before the second nod dragged).
- Mirror look −4 frames (anticipation stays ~2.4 s incl. scene 7's beat).
- Sound cues made scene-relative.
