# AI Analysis Engine — Underground Mine Rescue Rover

Laptop-only, demo-ready build of the four AI components from the team's
architecture document (Section 7). Nothing here needs the rover, real sensors,
or a network connection after first setup.

| Phase | Component | Status |
|------|-----------|--------|
| 0 | Environment & smoke tests | ✅ done (audio + mic + display + webcam + detector) |
| 1 | Live distress-sound detection | ✅ done |
| 2 | Survivor detection (simulated thermal) | ✅ done |
| 3 | Gas trend forecasting | ✅ done |
| 4 | Structural shape-tracking (simulated LiDAR) | ✅ done |

---

## One-time setup

```bat
cd "C:\Users\Amogh N Koushik\OneDrive\Desktop\SIH 2026\ai_analysis_engine"
python -m venv .venv
.venv\Scripts\pip install torch --index-url https://download.pytorch.org/whl/cpu
.venv\Scripts\pip install -r requirements.txt
```

First run also downloads the models automatically, then caches them (no
internet needed afterwards):
- audio model ~350 MB → `%USERPROFILE%\.cache\huggingface`
- YOLO weights ~6 MB → `ai_analysis_engine\yolov8n.pt`

---

## Phase 0 — smoke test

```bat
.venv\Scripts\python -m phase0_setup.smoke_test
```

Confirms, one line each: audio model loads (527 classes), microphone captures
real samples, a display window can open, the webcam returns a frame, the YOLO
detector loads and runs. `--list-devices` shows mic indices; `--camera N`
picks a webcam; `--skip-camera` runs the audio-only subset.

Last run on this laptop: **all 5 PASS**, mic = *SteelSeries Sonar – Microphone*,
webcam 640×480.

---

## Phase 1 — live distress-sound detection

```bat
.venv\Scripts\python -m phase1_distress_sound.distress_detector
```

A large always-on window turns red, prints **"⚠ DISTRESS SIGNAL DETECTED"**, and
beeps on any of **three** triggers:

1. **Spoken keyword** *(main trigger)* — offline speech recognition
   ([Vosk](https://alphacephei.com/vosk/), small English model, ~40 MB
   auto-downloaded once) hears **"help"**, "mayday", "save me", "emergency", …
   Specific: a loud clap, loud music or loud talking will **not** trip it —
   only the actual word. Edit the list in `config.py` → `KEYWORDS`.
2. **Distress sound** — the AudioSet model (`MIT/ast-finetuned-audioset-10-10-0.4593`,
   AST, 527 classes, pretrained) labels the audio `Screaming`, `Crying, sobbing`,
   etc. above `DISTRESS_THRESHOLD`. Covers wordless screams / sobbing.
3. **Loudness burst** — any loud vocal burst. **Off by default**
   (`LOUDNESS_TRIGGER_ENABLED`) because loud talking/music also trips it.

The on-screen readout shows the live transcript so you can see what the
recogniser is hearing.

### Debugging what the mic / model / recogniser actually hear

```bat
.venv\Scripts\python -m phase1_distress_sound.debug_listen --device 2 --seconds 8
```

Records while you shout `HELP`, saves the clip to `assets\`, then prints: the
clip level, the **KEYWORD PATH** transcript + whether it would fire, the ranked
AudioSet labels per window, and the loudness ratios. `--wav <file>` re-analyses
a saved clip; `--scan-devices` ranks every input by captured loudness.

### Options

| Flag | Purpose |
|------|---------|
| `--device N` | use microphone index N (use in the real room) |
| `--no-keyword` | disable the spoken-"help" trigger (sound model only) |
| `--list-devices` | list microphones, then exit |
| `--threshold 0.5` | override the distress-**sound** confidence threshold |
| `--fullscreen` | start full screen (Esc exits, F toggles) |
| `--labels` | print all 527 labels and which count as distress |
| `--ui-only` | run the display on fake data — no model, no mic (layout check) |

### Tuning — all in one place

`phase1_distress_sound/config.py`:

- `KEYWORDS` — the words/phrases that fire the alert (add your own)
- `KEYWORD_MIN_RMS` — require the spoken word to be at least this loud (`0.0` = any)
- `KEYWORD_ENABLED` — turn the speech trigger off entirely
- `DISTRESS_LABELS` / `DISTRESS_THRESHOLD` — the AudioSet sound path
- `LOUDNESS_TRIGGER_ENABLED` — the "any loud vocal burst" path (default off)
- `INPUT_GAIN` — software mic boost; only raise **after** disabling mic enhancements
- `ALERT_HOLD_SECONDS`, `CONSECUTIVE_HITS_TO_ALERT` — debounce / how long red stays up

While running, the console prints one line per window
(`TOP=… DISTRESS=… KW=… rms=…`) so you can see which path fired.

### Phase 1 acceptance criteria — how to verify

1. Run `debug_listen --device N` and shout **"HELP"** — the `KEYWORD PATH`
   line must say *would FIRE*. If the transcript is garbled, get louder /
   closer, disable the mic's Windows enhancements, or add the mis-heard word
   to `KEYWORDS`.
2. Run the live app. Talk normally / play music near it — the alert must
   **not** fire. Then shout **"HELP"** — the screen flips to red within ~1 s
   and shows `HEARD: "help"`.
3. Also test a wordless scream — the AudioSet path (`Screaming`) should catch
   it; lower `DISTRESS_THRESHOLD` toward `0.3` if it's marginal.
4. Use `--fullscreen`; check it's readable from where the judges stand.

### Microphone notes (important)

- Pick a **real** mic with `--device N` — the Windows default is often a
  virtual device (SteelSeries Sonar, "Stereo Mix") that captures near silence.
  The app prints a `MIC LOOKS SILENT` banner + device list on startup if so.
- Laptop mic arrays (Intel Smart Sound) often run **AGC / noise suppression**
  that flattens a scream down to speaking level. Turn off *all* mic
  enhancements: `mmsys.cpl` → Recording → your mic → Properties → Advanced +
  Enhancements tab; and Win11 Settings → Sound → device → Audio enhancements = Off.
- `debug_listen --scan-devices` records a burst from every input while you
  clap+shout and ranks them, so you can find the one that hears you loudest.
- Most reliable for a demo: a **wired headset / USB mic**.

---

## Phase 2 — survivor detection (simulated thermal feed)

```bat
.venv\Scripts\python -m phase2_survivor_detection.survivor_detector
```

The webcam feed, recoloured to look like a thermal camera, with a pretrained
person detector drawing a **POSSIBLE SURVIVOR** box around anyone in frame and
a banner that flips to a red **POSSIBLE SURVIVOR DETECTED** alert. A permanent
caption on screen states it is a stand-in for the rover's FLIR thermal camera,
which is not integrated yet — the detection logic underneath is real.

**Detector:** Ultralytics **YOLOv8n**, pretrained on COCO, "person" class only.
Runs on a background thread so the video never stutters.

### Keys (window focused) / flags

| Key | | Flag | |
|-----|--|------|--|
| `q` / `Esc` | quit | `--camera N` | webcam index |
| `f` | fullscreen | `--fullscreen` | start full screen |
| `c` | cycle thermal colour map | `--no-detect` | feed only, no detector |
| `p` | pause | `--check` | grab one frame, print size, exit |
| `h` | show/hide HUD | | |

### Tuning — `phase2_survivor_detection/config.py`

- `CAM_INDEX`, `FRAME_WIDTH/HEIGHT` — camera and capture size
- `CONF_THRESHOLD` — min person confidence (default `0.35`; lower = more sensitive)
- `DETECT_EVERY_N_FRAMES`, `DETECT_IMGSZ` — speed/accuracy knobs
- `COLORMAPS` — thermal palettes cycled with `c` (INFERNO default)
- `SIM_CAPTION` — the permanent "this is simulated" caption text

### Measured on this laptop

- Detector load: ~2 s (one time). Weights auto-download once (~6 MB).
- Inference: **~27 ms/frame** on CPU → detection is effectively instant
- Display ~20 fps (full webcam rate); person boxes at 0.8+ confidence on a
  reference image — **live, not choppy**

### Phase 2 acceptance criteria — how to verify

1. Run it, step into frame from the side. The box + label must appear within a
   frame or two, and the banner must flip to red. Step out — it clears.
2. Move around; the box should track you without long lag or heavy flicker.
3. Confirm the **SIMULATED THERMAL FEED** caption is readable and always
   visible (never needs to be said out loud). Use `--fullscreen` for the demo.
4. If the wrong camera opens, quit and pass `--camera 1` (or `2`).

---

## Phase 3 — gas trend forecasting (simulated sensor)

```bat
.venv\Scripts\python -m phase3_gas_forecast.gas_forecaster
```

Three live charts — **CO, methane, oxygen** — drifting near a safe baseline.
Press **SPACE** (or click **TRIGGER GAS EVENT**) and a hazard develops on cue:
CO and methane climb, oxygen falls. For each gas the panel shows a smoothed
value, its rate of change, and a **T- MM:SS countdown to the safety threshold**,
computed from the current slope — plus a dotted projection line on the chart
running from "now" to the point it will cross. No dataset; the stream is
generated by the script.

### Keys / buttons

| Key | |
|-----|--|
| `SPACE` / `d` | trigger the gas event (also the on-screen button) |
| `r` | reset to a calm baseline (also a button) |
| `[` / `]` | make the developing hazard slower / faster |
| `q` | quit |

### Tuning — `phase3_gas_forecast/config.py`

- `GASES` — per gas: `baseline`, `noise`, `threshold`, `direction`
  (`above` = danger on rise, `below` = danger on fall), `hazard_rate`
- `MOVING_AVG_SECONDS` / `SLOPE_FIT_SECONDS` — smoothing and rate-fit windows
- `MIN_SLOPE_FOR_ETA` — rate below which a countdown is suppressed as noise
- `HAZARD_MULTIPLIER` — starting hazard speed (also the `[` `]` keys)

### Verify without the GUI

```bat
.venv\Scripts\python -m phase3_gas_forecast.gas_forecaster --headless 45
.venv\Scripts\python -m phase3_gas_forecast.gas_forecaster --snapshot assets\p3.png
```

Headless prints a per-second table: baseline stays flat (`SAFE`, slope ≈ 0),
then after the auto-trigger every countdown **shrinks smoothly** toward
`THRESHOLD CROSSED`. Reference image: `assets/phase3_dashboard_reference.png`.

### Phase 3 acceptance criteria — how to verify

1. Before triggering: all three traces look calm and flat, status
   **MONITORING – ALL SAFE**, no countdowns showing.
2. Press SPACE: within a second or two the traces bend, status goes
   **HAZARD DEVELOPING**, and `T- MM:SS` countdowns appear.
3. Watch a countdown: it should shrink steadily (not jump around) and the
   dotted projection line should track toward the red threshold, reaching it
   about when the countdown hits zero, then flip to **THRESHOLD CROSSED**.
4. `r` resets; `]` speeds the hazard up if you want a faster demo.

---

## Phase 4 — structural shape-tracking (simulated LiDAR)

```bat
.venv\Scripts\python -m phase4_structural_shape.shape_tracker
```

The **T1 vs T2** tunnel cross-section comparison from the architecture document.
A baseline outline (T1, green) and a later scan (T2, amber) are overlaid; where
T2 has moved inward past the safety limit the arc is highlighted **bold red**
with a filled wedge and deviation whiskers, an arrow labels the location
(roof / wall / floor), and the banner reads **ROOF SAG / NARROWING DETECTED**.
The right side shows deviation vs. position around the tunnel and a numeric
summary. Both scans are generated by the script — no dataset.

### Keys / buttons

| Key | |
|-----|--|
| `SPACE` / `r` | new later scan — fresh random comparison (also a button) |
| `s` | force a clear roof sag — guaranteed flag, for the demo (also a button) |
| `[` / `]` | decrease / increase the deformation depth |
| `w` | toggle the deviation whiskers |
| `q` | quit |

### Tuning — `phase4_structural_shape/config.py`

- `DEV_THRESHOLD_M` — inward movement that trips the flag (default `0.10` m)
- `DEFORM_DEPTH_RANGE` / `DEFORM_WIDTH_RANGE` — random sag size per regenerate
- `SAFE_SCAN_PROBABILITY` — chance a regenerate is noise-only (no real sag)
- `DEFORM_REGIONS` — where sags appear and how likely each is (roof-weighted)
- `BASE_RADIUS`, `ROOF_RISE` — the tunnel outline shape; `SCAN_NOISE_M` — LiDAR jitter

### Verify without / before the GUI

```bat
.venv\Scripts\python -m phase4_structural_shape.shape_tracker --headless 10
.venv\Scripts\python -m phase4_structural_shape.shape_tracker --snapshot assets\p4.png
```

Headless regenerates N comparisons and prints each: injected deform vs. measured
`max_dev`, the flag decision, and the located region. Noise-only scans read
≈1–2 cm (well under the 10 cm limit); forcing a sag always flags.
Reference image: `assets/phase4_shape_reference.png`.

### Phase 4 acceptance criteria — how to verify

1. Press SPACE a few times. Most scans show T1/T2 nearly on top of each other
   (**STRUCTURE WITHIN TOLERANCE**, green); some show a clear inward bulge on
   T2, highlighted red, with the **ROOF SAG / NARROWING DETECTED** banner.
2. The highlight must be obvious from a few feet away — bold red arc + wedge,
   not a faint colour change. Press `s` to guarantee one for the live demo.
3. Regenerating repeatedly must stay reliable (no crash, flag appears/clears
   correctly). `[` / `]` change how deep the sag goes.
4. Confirm the **SIMULATED SCAN COMPARISON** caption is always visible.

---

## Folder layout

```
ai_analysis_engine/
  requirements.txt
  run_phase1.bat  run_phase2.bat  run_phase3.bat  run_phase4.bat  smoke_test.bat
  yolov8n.pt                    # YOLO weights (auto-downloaded once)
  shared/
    audio_model.py              # AST / AudioSet classifier wrapper  (Phase 1)
    person_detector.py          # YOLO person-detector wrapper        (Phase 2)
  phase0_setup/
    smoke_test.py               # audio + mic + display + webcam + detector
  phase1_distress_sound/     config.py  distress_detector.py
  phase2_survivor_detection/ config.py  survivor_detector.py
  phase3_gas_forecast/       config.py  gas_forecaster.py
  phase4_structural_shape/   config.py  shape_tracker.py
  assets/                       # reference renders + backup recordings (Phase 6)
```
