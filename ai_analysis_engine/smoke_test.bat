@echo off
REM Phase 0 smoke test: audio model + microphone + live display.
cd /d "%~dp0"
".venv\Scripts\python.exe" -m phase0_setup.smoke_test %*
