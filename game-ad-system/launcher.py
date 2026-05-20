"""
游戏买量系统启动器
双击运行后自动启动 FastAPI 服务并打开浏览器
"""
import sys
import os
import webbrowser
import threading
import time


def get_resource_path(relative_path):
    """获取打包后的资源路径"""
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, relative_path)
    return os.path.join(os.path.abspath(os.path.dirname(__file__)), relative_path)


def setup_env():
    """设置环境，确保模块能找到"""
    base_dir = os.path.dirname(os.path.abspath(sys.executable if getattr(sys, 'frozen', False) else __file__))
    os.chdir(base_dir)

    # 如果 .env 不存在，从 .env.example 复制
    env_path = os.path.join(base_dir, ".env")
    example_path = os.path.join(base_dir, ".env.example")
    if not os.path.exists(env_path) and os.path.exists(example_path):
        import shutil
        shutil.copy2(example_path, env_path)
        print(f"[INFO] 已从 .env.example 创建 .env 文件，请配置后重启")


def open_browser():
    """延迟3秒后打开浏览器"""
    time.sleep(3)
    webbrowser.open("http://localhost:8000/docs")


def main():
    setup_env()

    print("=" * 60)
    print("  游戏买量系统 · 多Agent工厂")
    print("=" * 60)
    print()
    print("  服务地址: http://localhost:8000")
    print("  API文档:  http://localhost:8000/docs")
    print()
    print("  按 Ctrl+C 停止服务")
    print("=" * 60)
    print()

    # 在后台线程中打开浏览器
    browser_thread = threading.Thread(target=open_browser, daemon=True)
    browser_thread.start()

    # 启动 FastAPI 服务
    import uvicorn
    from api.main import app

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
    )


if __name__ == "__main__":
    main()
