import importlib

def __getattr__(name):
    # 支持子模块访问
    submodules = ["store", "retrieve", "summarizer", "dag_sync", "schemas"]
    if name in submodules:
        return importlib.import_module(f".{name}", __name__)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

__all__ = [
    "store",
    "retrieve",
    "summarizer",
    "dag_sync",
    "schemas",
]