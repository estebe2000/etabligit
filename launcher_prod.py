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

def start_api():
    """Start the FastAPI backend service in production mode."""
    global api_process
    
    logger.info(f"Starting API service on {API_HOST}:{API_PORT}...")
    api_cmd = [
        sys.executable, "-m", "uvicorn", "main:app", 
        "--host", API_HOST, 
        "--port", str(API_PORT)
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
    """Start the Flask UI service in production mode."""
    global ui_process
    
    logger.info(f"Starting UI service on {FLASK_HOST}:{FLASK_PORT}...")
    
    # Create a temporary script to run Flask with the correct port
    temp_script_path = "run_flask_prod.py"
    with open(temp_script_path, "w") as f:
        f.write(f"""
import os
os.environ['FLASK_APP'] = 'ui_app.py'
os.environ['FLASK_DEBUG'] = 'false'
os.environ['FLASK_HOST'] = '{FLASK_HOST}'
os.environ['FLASK_PORT'] = '{FLASK_PORT}'

from ui_app import app

if __name__ == '__main__':
    app.run(host='{FLASK_HOST}', port={FLASK_PORT}, debug=False)
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

def main():
    """Main entry point for the production launcher."""
    logger.info("Starting L'Établi in PRODUCTION mode")
    logger.info(f"API will run on port {API_PORT}")
    logger.info(f"UI will run on port {FLASK_PORT}")
    
    # Register signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        # Start services
        if not start_api():
            logger.error("Failed to start API service")
            stop_services()
            return 1
        
        if not start_ui():
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
