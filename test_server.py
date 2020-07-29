#!/usr/bin/python3
from http import server

server_address = ('', 8000)
httpd = server.HTTPServer(server_address, server.SimpleHTTPRequestHandler)
httpd.serve_forever()
