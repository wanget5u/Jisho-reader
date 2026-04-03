@echo off
:: Open the web UI
start "" "index.html"
:: Run the Python server using 'pythonw' (windowless python)
start "" pythonw clipboard_server.py
