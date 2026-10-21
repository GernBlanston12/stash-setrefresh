#!/usr/bin/env python3
"""
Tiny listener that receives refresh-rate requests from the Stash plugin
and calls stash-setrefresh.sh
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import subprocess
import os

SCRIPT = os.path.expanduser("~/bin/stash-setrefresh.sh")
PORT = 8765

class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path != "/set":
            self.send_response(404)
            self._cors()
            self.end_headers()
            return

        qs = parse_qs(parsed.query)
        output = qs.get("output", [""])[0]
        resolution = qs.get("resolution", [""])[0]
        rate = qs.get("rate", [""])[0]
        scale = qs.get("scale", [""])[0]

        if not all([output, resolution, rate, scale]):
            self.send_response(400)
            self._cors()
            self.end_headers()
            self.wfile.write(b"Missing parameters")
            return

        try:
            subprocess.run(
                [SCRIPT, output, resolution, rate, scale],
                check=True,
                capture_output=True,
                text=True,
            )
            self.send_response(200)
            self._cors()
            self.end_headers()
            self.wfile.write(b"OK")
        except Exception as e:
            self.send_response(500)
            self._cors()
            self.end_headers()
            self.wfile.write(str(e).encode())

    def log_message(self, format, *args):
        pass

if __name__ == "__main__":
    print(f"Listening on http://0.0.0.0:{PORT}/set")
    HTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
