@echo off
REM Survivor detection on a simulated thermal feed (Phase 2). Pass flags through:
REM   run_phase2.bat --fullscreen
REM   run_phase2.bat --camera 1
cd /d "%~dp0"
".venv\Scripts\python.exe" -m phase2_survivor_detection.survivor_detector %*
