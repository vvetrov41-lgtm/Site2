# Optional real voice recordings

Every sound in the film is synthesised by default. Any sound can be replaced by
a real recording (best: someone making the noises with their mouth, phone mic
is fine). Drop a mono or stereo `.wav` here and add its name to `manifest.json`,
e.g. `["ooh", "wee", "giggle"]`. Trim silence at the start; the file starts
exactly on the cue.

| File | Moment | What to record |
|---|---|---|
| `hum.wav` | client walks in (0:00) | cheerful "doo-dee-doo-doo", ~1.3 s |
| `coo.wav` | client waves (0:02.5) | small "oo-ee!", ~0.4 s |
| `ting.wav` | phone appears (0:04.2) | "ting!", ~0.3 s |
| `mmm.wav` | Kristina thinks (0:07.8, 0:19.4) | low thinking "mmmm...", ~1 s |
| `m.wav` | the serious nod (0:09.0, 0:20.7) | short serious "m!", ~0.15 s |
| `brr.wav` | tattoo machine (0:10.7 ...) | lip trill "brrrrrrr", 2.5 s or longer (cut automatically) |
| `pop.wav` | machine stops (0:18.8) | small "p!" |
| `yawn.wav` | client yawns (0:17.3) | tiny yawn, ~0.8 s |
| `ooh.wav` | client sees the tattoo (0:26.5) | "oooooh!", ~1.1 s |
| `wee.wav` | arms up (0:27.5, 0:31.5) | "weeeee!", ~0.8 s |
| `giggle.wav` | celebration | short giggle, ~0.6 s |
| `hehe.wav` | Kristina finally smiles (0:31.4) | low "hehe", ~0.4 s |
| `twinkle.wav` | sparkles | any tiny "ting-a-ling" |

Re-export the MP4 afterwards: `node tools/render.cjs --all --mp4 --out export`.
