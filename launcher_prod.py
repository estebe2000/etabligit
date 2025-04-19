#!/usr/bin/env python3
"""
Production launcher for L'Établi application.
This script starts both the API and UI services on production ports.
"""

import os
import signal
import subprocess
import sys
import time
import argparse
from dotenv import load_dotenv
import threading
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("launcher_prod")

# Load environment variables from .env file
load_dotenv()

# Production configuration
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = 8099  # Production API port
FLASK_HOST = os.getenv("FLASK_HOST", "0.0.0.0")
FLASK_PORT = 5099  # Production UI port
FLASK_DEBUG = False  # Disable debug mode in production

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

def start_api(host=API_HOST, port=API_PORT):
    """Start the FastAPI backend service in production mode."""
    global api_process
    
    logger.info(f"Starting API service on {host}:{port}...")
    api_cmd = [
        sys.executable, "-m", "uvicorn", "main:app", 
        "--host", host, 
        "--port", str(port)
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

def start_ui(host=FLASK_HOST, port=FLASK_PORT, debug=FLASK_DEBUG):
    """Start the Flask UI service in production mode."""
    global ui_process
    
    logger.info(f"Starting UI service on {host}:{port}...")
    
    # Create a temporary script to run Flask with the correct port
    temp_script_path = "run_flask_prod.py"
    with open(temp_script_path, "w") as f:
        f.write(f"""
import os
os.environ['FLASK_APP'] = 'ui_app.py'
os.environ['FLASK_DEBUG'] = '{"true" if debug else "false"}'
os.environ['FLASK_HOST'] = '{host}'
os.environ['FLASK_PORT'] = '{port}'

from ui_app import app

if __name__ == '__main__':
    app.run(host='{host}', port={port}, debug={str(debug).lower()})
""")
    
    ui_cmd = [
        sys.executable, temp_script_path
    ]
    
    env = os.environ.copy()
    
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

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Launch L'Établi API and/or UI services.")
    parser.add_argument("--api-only", action="store_true", help="Start only the API service")
    parser.add_argument("--ui-only", action="store_true", help="Start only the UI service")
    parser.add_argument("--api-host", help=f"API host (default: {API_HOST})")
    parser.add_argument("--api-port", type=int, help=f"API port (default: {API_PORT})")
    parser.add_argument("--ui-host", help=f"UI host (default: {FLASK_HOST})")
    parser.add_argument("--ui-port", type=int, help=f"UI port (default: {FLASK_PORT})")
    parser.add_argument("--no-debug", action="store_true", help="Disable Flask debug mode")
    
    return parser.parse_args()

def main():
    """Main entry point for the production launcher."""
    args = parse_arguments()
    
    # Override defaults with command line arguments if provided
    api_host = args.api_host if args.api_host else API_HOST
    api_port = args.api_port if args.api_port else API_PORT
    ui_host = args.ui_host if args.ui_host else FLASK_HOST
    ui_port = args.ui_port if args.ui_port else FLASK_PORT
    flask_debug = not args.no_debug and FLASK_DEBUG
    
    logger.info("Starting L'Établi in PRODUCTION mode")
    logger.info(f"API will run on {api_host}:{api_port}")
    logger.info(f"UI will run on {ui_host}:{ui_port}")
    
    # Register signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        # Start services based on command line arguments
        if not args.ui_only:
            if not start_api(host=api_host, port=api_port):
                logger.error("Failed to start API service")
                stop_services()
                return 1
        
        if not args.api_only:
            if not start_ui(host=ui_host, port=ui_port, debug=flask_debug):
                logger.error("Failed to start UI service")
                stop_services()
                return 1
        
        # Keep the main thread alive
        logger.info("All services started successfully in PRODUCTION mode. Press Ctrl+C to stop.")
        while True:
            # Check if processes are still running
            if api_process and api_process.poll() is not None:
                logger.error("API service has stopped unexpectedly")
                stop_services()
                return 1
            
            if ui_process and ui_process.poll() is not None:
                logger.error("UI service has stopped unexpectedly")
                stop_services()
                return 1
            
            time.sleep(1)
    
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt")
    finally:
        stop_services()
        # Clean up temporary script
        if os.path.exists("run_flask_prod.py"):
            try:
                os.remove("run_flask_prod.py")
            except:
                pass
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
