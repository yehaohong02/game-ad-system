import importlib

def __getattr__(name):
    # 支持子模块访问
    submodules = ["clip_analyzer", "whisper_transcriber", "pipeline"]
    if name in submodules:
        return importlib.import_module(f".{name}", __name__)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

__all__ = [
    "clip_analyzer",
    "whisper_transcriber",
    "pipeline",
]