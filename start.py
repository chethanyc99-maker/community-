"""
start.py - One-click launcher for Prerana Assistive Learning Platform.
Can be double-clicked directly from Windows File Explorer.
"""
import os
import sys
import time
import threading
import webbrowser
from pathlib import Path

# Automatically ensure current directory is the project root
BASE_DIR = Path(__file__).resolve().parent
os.chdir(BASE_DIR)
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

def open_browser():
    time.sleep(1.5)
    webbrowser.open("http://localhost:5000")

def main():
    print("=" * 64)
    print("  Starting Prerana Special Education Learning Tool")
    print("  Integrated Flask + MySQL Platform (Port 5000)")
    print("  Local URL: http://localhost:5000")
    print("=" * 64)
    print("\nOpening your default web browser...\n")

    threading.Thread(target=open_browser, daemon=True).start()

    try:
        from app import app
        app.run(host="0.0.0.0", port=5000, debug=False)
    except Exception as e:
        print(f"\n[Error starting Prerana]: {e}")
        input("\nPress Enter to exit...")

if __name__ == "__main__":
    main()
