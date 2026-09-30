"""
Phase 3 tuning knobs - simulated multi-gas trend forecasting.

No external data. This script generates the gas stream itself. The demo trigger
(SPACE / the on-screen button) makes the hazard develop on cue.
"""

# --- simulation timing --------------------------------------------------
TICK_SECONDS = 0.1          # simulator step
REDRAW_MS = 100            # chart refresh interval (ms)
HISTORY_SECONDS = 60       # how much past data stays on the x-axis

# --- trend estimation ------------------------------------------------
MOVING_AVG_SECONDS = 3.0    # window for the smoothed current value
SLOPE_FIT_SECONDS = 6.0     # window for the least-squares rate-of-change
MIN_SLOPE_FOR_ETA = {      # ignore rates smaller than this (per second) - noise
    "CO": 0.12,            # ppm/s
    "CH4": 0.005,          # %vol/s
    "O2": 0.006,           # %vol/s
}

# --- gas channels ---------------------------------------------------
# direction "above" = dangerous when it rises past threshold
# direction "below" = dangerous when it falls past threshold (oxygen)
GASES = {
    "CO": dict(
        label="Carbon monoxide", unit="ppm", color="#ff5c5c",
        baseline=8.0, noise=0.6, threshold=35.0, direction="above",
        y_range=(0, 60),
        hazard_rate=0.9,      # ppm/s added once the event is triggered
    ),
    "CH4": dict(
        label="Methane", unit="%vol", color="#ffb84d",
        baseline=0.30, noise=0.02, threshold=1.00, direction="above",
        y_range=(0, 1.6),
        hazard_rate=0.023,    # %vol/s
    ),
    "O2": dict(
        label="Oxygen", unit="%vol", color="#5cc8ff",
        baseline=20.9, noise=0.05, threshold=19.5, direction="below",
        y_range=(18.0, 21.6),
        hazard_rate=-0.040,   # %vol/s (falls)
    ),
}

# Multiplier applied to every hazard_rate, adjustable live with [ and ] keys.
HAZARD_MULTIPLIER = 1.0

# --- window ------------------------------------------------------
WINDOW_TITLE = "AI Analysis Engine - Gas Trend Forecasting (Phase 3)"
SIM_CAPTION = ("SIMULATED SENSOR DATA  -  stand-in for the rover's multi-gas sensor "
               "head (not yet integrated).  The forecasting logic is real.")
