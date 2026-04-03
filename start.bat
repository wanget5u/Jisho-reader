@echo off
:: Open the web UI
start "" "frontend/index.html"
:: Run the Python server using 'pythonw' (windowless python)
start "" pythonw backend/clipboard_server.py
