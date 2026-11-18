#!/usr/bin/env python3
"""
Prerana Assistive Learning Platform - Multi-Network Server
Enables cross-device access across Wi-Fi, Ethernet, LAN, and Mobile Networks.
"""

import sys
import os
import json
import socket
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

def get_primary_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

def get_all_ips():
    ips = []
    try:
        hostname = socket.gethostname()
        for ip in socket.gethostbyname_ex(hostname)[2]:
            if not ip.startswith('127.'):
                ips.append(ip)
    except Exception:
        pass
    primary = get_primary_ip()
    if primary not in ips and primary != '127.0.0.1':
        ips.insert(0, primary)
    return ips

class NetworkRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def do_GET(self):
        if self.path == '/api/network-info':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            info = {
                'primary_ip': get_primary_ip(),
                'all_ips': get_all_ips(),
                'port': PORT,
                'network_url': f"http://{get_primary_ip()}:{PORT}",
                'local_url': f"http://localhost:{PORT}"
            }
            self.wfile.write(json.dumps(info).encode('utf-8'))
            return

        return super().do_GET()

def start_server():
    primary_ip = get_primary_ip()
    all_ips = get_all_ips()

    server_address = ('0.0.0.0', PORT)
    try:
        httpd = HTTPServer(server_address, NetworkRequestHandler)
    except OSError as e:
        print(f"\n[!] Error binding to port {PORT}: {e}")
        print("    Another server might already be running on port 8000.")
        sys.exit(1)

    print("=" * 68)
    print("  PRERANA SPECIAL EDUCATION LEARNING PLATFORM - NETWORK HOST")
    print("=" * 68)
    print("\n[+] The server is running and accessible on multiple networks:")
    print(f"\n  💻 On THIS Computer:")
    print(f"     👉 http://localhost:{PORT}")
    print(f"     👉 http://127.0.0.1:{PORT}")

    print(f"\n  📱 On MOBILE PHONES & TABLETS (Same Wi-Fi or LAN):")
    print(f"     👉 http://{primary_ip}:{PORT}")

    if len(all_ips) > 1:
        print("\n  🌐 Additional Network Interfaces (Ethernet / Secondary Wi-Fi):")
        for ip in all_ips:
            if ip != primary_ip:
                print(f"     • http://{ip}:{PORT}")

    print("\n" + "-" * 68)
    print("  📶 HOW TO CONNECT OTHER DEVICES:")
    print(f"  1. Ensure your phone/tablet is connected to the SAME Wi-Fi or router.")
    print(f"  2. Open Chrome/Safari on your phone and type: http://{primary_ip}:{PORT}")
    print(f"  3. Tap 'Install App' or 'Add to Home Screen' to use it offline!")
    print("-" * 68)
    print("\nPress Ctrl+C at any time to stop the server.\n")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[+] Server stopped successfully.")
        httpd.server_close()

if __name__ == '__main__':
    start_server()
