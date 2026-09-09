@echo off
REM Gas trend forecasting (Phase 3). Pass flags through, e.g.:
REM   run_phase3.bat --headless 45
cd /d "%~dp0"
".venv\Scripts\python.exe" -m phase3_gas_forecast.gas_forecaster %*
