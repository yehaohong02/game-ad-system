def __getattr__(name):
    if name == "data":
        from src import data
        return data
    elif name == "creative":
        from src import creative
        return creative
    elif name == "execution":
        from src import execution
        return execution
    elif name == "memory":
        from src import memory
        return memory
    elif name == "safety":
        from src import safety
        return safety
    elif name == "shared":
        from src import shared
        return shared
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

__all__ = [
    "data",
    "creative",
    "execution",
    "memory",
    "safety",
    "shared",
]