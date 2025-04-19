#!/usr/bin/env python3
"""
Unified launcher for L'Établi application.
This script can start both the API and UI services or just one of them.
"""

import argparse
import os
import signal
import subprocess
import sys
import time
from dotenv import load_dotenv
import threading
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("launcher")

# Load environment variables from .env file
load_dotenv()

# Default configuration
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
FLASK_HOST = os.getenv("FLASK_HOST", "0.0.0.0")
FLASK_PORT = int(os.getenv("FLASK_PORT", "5000"))
FLASK_DEBUG = os.getenv("FLASK_DEBUG", "True").lower() in ("true", "1", "t")

# Global variables to store process objects
api_process = None
ui_process = None

def signal_handler(sig, frame):
    """Handle termination signals to gracefully shut down all processes."""
    logger.info("Shutting down services...")
    stop_services()
    sys.exit(0)

def stop_services():
    """Stop all running services."""
    global api_process, ui_process
    
    if api_process:
        logger.info("Stopping API service...")
        api_process.terminate()
        api_process.wait(timeout=5)
        api_process = None
    
    if ui_process:
        logger.info("Stopping UI service...")
        ui_process.terminate()
        ui_process.wait(timeout=5)
        ui_process = None

def start_api():
    """Start the FastAPI backend service."""
    global api_process
    
    logger.info(f"Starting API service on {API_HOST}:{API_PORT}...")
    api_cmd = [
        sys.executable, "-m", "uvicorn", "main:app", 
        "--host", API_HOST, 
        "--port", str(API_PORT),
        "--reload"
    ]
    
    api_process = subprocess.Popen(
        api_cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True,
        bufsize=1
    )
    
    # Start a thread to read and log output
    threading.Thread(target=log_output, args=(api_process, "API"), daemon=True).start()
    
    # Wait a bit to ensure the API is up before starting UI
    time.sleep(2)
    
    return api_process.poll() is None

def start_ui():
    """Start the Flask UI service."""
    global ui_process
    
    logger.info(f"Starting UI service on {FLASK_HOST}:{FLASK_PORT}...")
    env = os.environ.copy()
    env["FLASK_APP"] = "ui_app.py"
    env["FLASK_DEBUG"] = str(FLASK_DEBUG).lower()
    
    ui_cmd = [
        sys.executable, "ui_app.py"
    ]
    
    ui_process = subprocess.Popen(
        ui_cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True,
        bufsize=1,
        env=env
    )
    
    # Start a thread to read and log output
    threading.Thread(target=log_output, args=(ui_process, "UI"), daemon=True).start()
    
    return ui_process.poll() is None

def log_output(process, prefix):
    """Read and log output from a process."""
    for line in iter(process.stdout.readline, ''):
        logger.info(f"[{prefix}] {line.rstrip()}")

def main():
    """Main entry point for the launcher."""
    # Declare globals at the beginning of the function
    global API_HOST, API_PORT, FLASK_HOST, FLASK_PORT, FLASK_DEBUG
    
    parser = argparse.ArgumentParser(description="Launch L'Établi API and/or UI services.")
    parser.add_argument("--api-only", action="store_true", help="Start only the API service")
    parser.add_argument("--ui-only", action="store_true", help="Start only the UI service")
    parser.add_argument("--api-host", help=f"API host (default: {API_HOST})")
    parser.add_argument("--api-port", type=int, help=f"API port (default: {API_PORT})")
    parser.add_argument("--ui-host", help=f"UI host (default: {FLASK_HOST})")
    parser.add_argument("--ui-port", type=int, help=f"UI port (default: {FLASK_PORT})")
    parser.add_argument("--no-debug", action="store_true", help="Disable Flask debug mode")
    
    args = parser.parse_args()
    
    # Override defaults with command-line arguments if provided
    if args.api_host:
        API_HOST = args.api_host
    if args.api_port:
        API_PORT = args.api_port
    if args.ui_host:
        FLASK_HOST = args.ui_host
    if args.ui_port:
        FLASK_PORT = args.ui_port
    if args.no_debug:
        FLASK_DEBUG = False
    
    # Register signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        # Determine which services to start
        start_api_service = not args.ui_only
        start_ui_service = not args.api_only
        
        # Start services
        if start_api_service and not start_api():
            logger.error("Failed to start API service")
            stop_services()
            return 1
        
        if start_ui_service and not start_ui():
            logger.error("Failed to start UI service")
            stop_services()
            return 1
        
        # Keep the main thread alive
        logger.info("All services started successfully. Press Ctrl+C to stop.")
        while True:
            # Check if processes are still running
            if start_api_service and api_process and api_process.poll() is not None:
                logger.error("API service has stopped unexpectedly")
                stop_services()
                return 1
            
            if start_ui_service and ui_process and ui_process.poll() is not None:
                logger.error("UI service has stopped unexpectedly")
                stop_services()
                return 1
            
            time.sleep(1)
    
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt")
    finally:
        stop_services()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
