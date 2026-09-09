"""
Phase 2 tuning knobs — survivor detection on a simulated thermal feed.

Everything you might change before/at the demo lives here.
"""

import os

# --- camera --------------------------------------------------------------
CAM_INDEX = 0            # which webcam (0 = default). Try 1, 2 if 0 is wrong.
FRAME_WIDTH = 640       # capture resolution — 640x480 keeps detection smooth
FRAME_HEIGHT = 480

# --- detector ----------------------------------------------------------
# Absolute path so the weights are found no matter where you launch from.
MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "yolov8n.pt")
CONF_THRESHOLD = 0.35    # min confidence for a "person" box (lower = more sensitive)
DETECT_EVERY_N_FRAMES = 2   # run YOLO every Nth frame; boxes are reused in between
DETECT_IMGSZ = 480      # inference image size (smaller = faster, less accurate)
BOX_PERSIST_FRAMES = 6  # keep drawing the last boxes this many frames after a miss
                        # (stops a single dropped frame from flickering the box off)

# --- thermal look (purely cosmetic) --------------------------------------
# OpenCV colormap names cycled with the 'c' key; first one is the default.
COLORMAPS = ["INFERNO", "JET", "HOT", "MAGMA", "TURBO"]
USE_CLAHE = True        # local contrast boost so the "thermal" image has punch
CLAHE_CLIP = 2.0
THERMAL_BLUR = 1        # 0 = off, or an odd kernel size (3, 5) for a softer look

# --- on-screen text ---------------------------------------------------
SURVIVOR_LABEL = "POSSIBLE SURVIVOR"
ALERT_TEXT = "POSSIBLE SURVIVOR DETECTED"
IDLE_TEXT = "SCANNING - NO SURVIVOR IN FRAME"
SIM_CAPTION = ("SIMULATED THERMAL FEED  -  stand-in for the rover's FLIR thermal "
               "camera (not yet integrated).  Person-detection logic is live.")

# --- window ---------------------------------------------------------
WINDOW_NAME = "AI Analysis Engine - Survivor Detection (Phase 2)"
START_FULLSCREEN = False
SHOW_HUD = True         # FPS / latency / keys overlay (toggle with 'h')
