"""PyInstaller 打包 Python 后端"""
import subprocess
import sys

def build():
    subprocess.run([
        sys.executable, "-m", "PyInstaller",
        "--name", "api",
        "--onefile",
        "--add-data", "src;src",
        "--hidden-import", "uvicorn.logging",
        "--hidden-import", "uvicorn.loops",
        "--hidden-import", "uvicorn.protocols.http",
        "--hidden-import", "clickhouse_connect",
        "--hidden-import", "chromadb",
        "--console",
        "api/main.py",
    ], check=True, cwd="backend")

if __name__ == "__main__":
    build()
