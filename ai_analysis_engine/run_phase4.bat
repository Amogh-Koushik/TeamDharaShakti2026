@echo off
REM Structural shape-tracking / simulated LiDAR comparison (Phase 4).
REM   run_phase4.bat --headless 8
cd /d "%~dp0"
".venv\Scripts\python.exe" -m phase4_structural_shape.shape_tracker %*
