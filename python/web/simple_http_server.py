#!/usr/bin/env python3
"""
Simple HTTP Server 
A simple Hello World type app which can serve on port 8000. Optionally, a different port can be passed.

The code was inspired by: https://gist.github.com/davidbgk/b10113c3779b8388e96e6d0c44e03a74created as part of an exercise via the Google IT Automation with Python course.

This script creates a minimal HTTP server that displays:
1. A "Hello Cloud" message
2. The server's hostname
3. The server's IP address

It demonstrates basic networking concepts, HTTP server implementation,
and system information retrieval in Python.

Usage:
  python3 simple_http_server.py [port]

  If port is not provided, the server will run on the default port (8000)
"""

import http
import http.server
import socket
import socketserver
import sys

# Default TCP port for the server
DEFAULT_PORT = 8000

class Handler(http.server.SimpleHTTPRequestHandler):
    """
    Custom HTTP request handler that returns system information
    for any GET request.
    """
    def do_GET(self):
        """
        Handle GET requests by returning a response with system information.
        
        This overrides the default GET handler to provide custom information
        instead of serving files.
        """
        # Send a 200 OK response
        self.send_response(http.HTTPStatus.OK)
        self.end_headers()
        
        # Send the greeting message
        self.wfile.write(b'Hello Cloud')
        
        # Get and send system information
        hostname = socket.gethostname()
        host_ip = socket.gethostbyname(hostname)
        
        self.wfile.write(
            '\n\nHostname: {} \nIP Address: {}'.format(
                hostname, host_ip).encode())


def main(argv):
    """
    Main function that sets up and starts the HTTP server.
    
    Args:
        argv: Command-line arguments, with optional port number
    """
    # Use provided port or default
    port = DEFAULT_PORT
    if len(argv) > 1:
        port = int(argv[1])

    # Create and start the server
    web_server = socketserver.TCPServer(('', port), Handler)
    print("Listening for connections on port {}".format(port))
    
    try:
        # Keep the server running until interrupted
        web_server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        web_server.server_close()


if __name__ == "__main__":
    main(sys.argv)