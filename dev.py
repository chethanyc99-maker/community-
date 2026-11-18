"""
dev.py - Development server with live auto-reload for Prerana.
Watches HTML, CSS, JS, and Python files.
Automatically refreshes the browser and restarts when code changes.
"""

import os
import sys
from pathlib import Path

# Automatically ensure current directory is the project root
BASE_DIR = Path(__file__).resolve().parent
os.chdir(BASE_DIR)
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from livereload import Server
from app import app

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print("=" * 68)
    print("  PRERANA LIVE DEVELOPMENT SERVER (AUTO-RELOAD ACTIVE)")
    print("  Watching: index.html, styles/*, scripts/*, *.py")
    print(f"  Open in browser: http://localhost:{port}")
    print("=" * 68)

    server = Server(app.wsgi_app)
    server.watch(str(BASE_DIR / "index.html"))
    server.watch(str(BASE_DIR / "styles" / "*.*"))
    server.watch(str(BASE_DIR / "scripts" / "*.*"))
    server.watch(str(BASE_DIR / "scripts" / "modules" / "*.*"))
    server.watch(str(BASE_DIR / "*.py"))
    server.serve(port=port, host="0.0.0.0", debug=True)
