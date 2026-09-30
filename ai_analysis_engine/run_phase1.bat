@echo off
REM Live distress-sound detection (Phase 1). Pass extra flags through, e.g.:
REM   run_phase1.bat --fullscreen
REM   run_phase1.bat --device 1 --threshold 0.5
cd /d "%~dp0"
".venv\Scripts\python.exe" -m phase1_distress_sound.distress_detector %*
