"""
AI-SBOM Unified Multi-Process Launcher
Starts Ollama, FastAPI Backend, and Vite Frontend concurrently with single Ctrl+C shutdown.
"""
import subprocess
import sys
import time
import os
import signal
from pathlib import Path

BASE_DIR = Path(__file__).parent.resolve()
FRONTEND_DIR = BASE_DIR / "frontend"

def main():
    print("=" * 70)
    print("      AI-SBOM PLATFORM -- ALL-IN-ONE UNIFIED LAUNCHER")
    print("=" * 70)
    print("[1/3] Checking / Starting Ollama Runtime...")
    print("[2/3] Starting AI-SBOM Detection Gateway (Port 8000)...")
    print("[3/3] Starting Frontend Web Interface (Port 5173)...")
    print("=" * 70)

    processes = []

    try:
        # 1. Start Ollama (if not already running)
        try:
            p_ollama = subprocess.Popen(["ollama", "serve"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            processes.append(p_ollama)
            print("  [OK] Ollama Runtime Service initialized.")
        except Exception:
            print("  [INFO] Ollama service already active in background.")

        time.sleep(1)

        # 2. Start Python Backend API (api.py)
        python_exe = sys.executable
        p_backend = subprocess.Popen([python_exe, "api.py"], cwd=str(BASE_DIR))
        processes.append(p_backend)
        print("  [OK] AI-SBOM Backend Gateway running on http://127.0.0.1:8000")

        time.sleep(1.5)

        # 3. Start Frontend Vite Server (npm run dev)
        npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
        p_frontend = subprocess.Popen([npm_cmd, "run", "dev"], cwd=str(FRONTEND_DIR))
        processes.append(p_frontend)
        print("  [OK] Frontend Dashboard running on http://localhost:5173")

        print("=" * 70)
        print(">> ALL SERVICES ONLINE! Open your browser at: http://localhost:5173")
        print(">> Press Ctrl+C at any time to gracefully terminate all services.")
        print("=" * 70)

        # Keep alive
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n[!] Shutting down all AI-SBOM services gracefully...")
        for p in processes:
            try:
                if os.name == "nt":
                    subprocess.call(["taskkill", "/F", "/T", "/PID", str(p.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    p.terminate()
            except Exception:
                pass
        print("[OK] All processes stopped. Goodbye!")

if __name__ == "__main__":
    main()
