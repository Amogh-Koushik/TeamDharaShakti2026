"""
Phase 1 tuning knobs.

There are three ways an ALERT can fire, in priority order:
  1. SPOKEN KEYWORD  - offline speech recognition hears "help" / "mayday" / ...
     This is the main trigger and is very specific (a loud clap or loud music
     will NOT set it off - only the actual word).
  2. DISTRESS SOUND  - the AudioSet model labels the audio "Screaming",
     "Crying, sobbing", etc. above a confidence threshold (covers wordless
     screams / sobbing).
  3. LOUDNESS burst  - optional, OFF by default because any loud vocal sound
     trips it.

Label strings must match the model's own AudioSet names exactly. Dump the full
list any time with:
    python -m phase1_distress_sound.distress_detector --labels
"""

# --- audio capture ---------------------------------------------------------
INPUT_SAMPLE_RATE = 16_000   # mic capture rate (Hz). 16 kHz mono = what the model wants.

# Software gain applied to every captured sample before anything else.
# 1.0 = off. Only raise this AFTER disabling the mic's Windows "enhancements"
# (see README). Raising gain while the mic's AGC is on just amplifies normal
# speech too and causes false alerts - it cannot separate a shout from talking.
INPUT_GAIN = 1.0
WINDOW_SECONDS = 2.0         # length of the rolling audio window fed to the model
# Classify a fresh window this often. One inference measured ~0.7-0.9 s on this
# laptop CPU, so a hop below ~0.7 just means "run back-to-back as fast as
# possible" (fine for a short demo, pins one core). 0.6 leaves a little headroom.
HOP_SECONDS = 0.6

# --- distress logic ------------------------------------------------------
# Any of these labels, at or above DISTRESS_THRESHOLD, raises the ALERT state.
DISTRESS_LABELS = {
    "Screaming",
    "Shout",
    "Yell",
    "Bellow",
    "Battle cry",
    "Children shouting",
    "Crying, sobbing",
    "Baby cry, infant cry",
    "Whimper",
    "Wail, moan",
    "Groan",
    # "Gasp",   # enable if you want it; can false-trigger on a sharp breath near the mic
}

# A distress label must reach this probability (0.0 - 1.0) to trigger.
# AudioSet probs are independent sigmoids: a clear shout typically lands 0.4 - 0.8.
# Raise this if the room's background chatter false-triggers; lower it if real
# shouts are missed.
DISTRESS_THRESHOLD = 0.40

# Number of consecutive triggering windows required before ALERT fires (debounce).
#   1 = fire on the first window that crosses the threshold (most responsive)
#   2 = require ~1 s of sustained distress at the default hop (fewer false alarms)
CONSECUTIVE_HITS_TO_ALERT = 1

# --- spoken-keyword trigger  (offline speech recognition, Vosk) -----------
# The MAIN trigger: an ALERT fires when the recogniser hears one of these words
# or phrases. Specific - loud noise / music / clapping will not trip it.
KEYWORD_ENABLED = True
KEYWORDS = {
    "help", "help me", "someone help", "mayday", "save me", "emergency",
}
# "" = auto-download the small English model (~40 MB, once, cached in your user
# profile). Or set an absolute path to an unzipped Vosk model folder.
KEYWORD_MODEL_PATH = ""
# A recognised keyword must reach this per-word confidence (0-1) to fire.
# This is the main guard against random background speech tripping the alert.
# Raise toward 0.9 if you still get false triggers; lower to ~0.6 if a real
# yelled "HELP" is being missed.
KEYWORD_MIN_CONF = 0.80
# Optional: also require the spoken word to be at least this loud (RMS).
# 0.0 = accept any volume.
KEYWORD_MIN_RMS = 0.0
# How long the keyword alert stays latched after the last time it was heard (s).
KEYWORD_HOLD_SECONDS = 3.0

# --- loudness fallback ------------------------------------------------------
# Any loud vocal burst -> ALERT, even if it's not a recognised word or a
# model-labelled scream. OFF by default: it also fires on loud talking / music.
LOUDNESS_TRIGGER_ENABLED = False
LOUDNESS_RMS_RATIO = 3.0      # window loudness vs the rolling quiet baseline
LOUDNESS_MIN_RMS = 0.05       # absolute floor. With mic enhancements OFF, normal
                             # speech is ~0.02 and a real yell clears 0.05 easily.
                             # This gate is what stops normal talk triggering.
LOUDNESS_VOCAL_LABELS = {    # the burst must still look vocal (not a door slam)
    "Speech", "Male speech, man speaking", "Female speech, woman speaking",
    "Child speech, kid speaking", "Conversation", "Narration, monologue",
    "Shout", "Yell", "Screaming", "Bellow", "Children shouting",
}

# Once ALERT fires, keep it on screen at least this long after the last trigger.
# Stops a short shout from flashing past during the demo.
ALERT_HOLD_SECONDS = 4.0

# --- display -----------------------------------------------------------
AUDIBLE_BEEP_ON_ALERT = True   # Windows system beep the moment ALERT fires
SHOW_TOP_N = 6                 # how many ranked labels to list on screen
START_FULLSCREEN = False       # True for the presentation; Esc always exits / F toggles
