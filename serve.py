"""
Dev server for Escape Protocol.
Identical to `python -m http.server 8000` but sends
Cache-Control: no-store on every response so the browser
always fetches the latest file from disk.

Usage:
    python serve.py          # runs on port 8000
    python serve.py 9000     # runs on a custom port
"""

import sys
import http.server
import socketserver

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        # Cleaner output — only log non-304 responses
        if args and str(args[1]) != "304":
            super().log_message(fmt, *args)


with socketserver.TCPServer(("", PORT), NoCacheHandler) as httpd:
    print(f"Escape Protocol dev server running at http://localhost:{PORT}")
    print("Press Ctrl+C to stop.\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
