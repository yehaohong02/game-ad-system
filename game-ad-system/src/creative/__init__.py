def __getattr__(name):
    if name == "tagger":
        from src.creative import tagger
        return tagger
    elif name == "analyzer":
        from src.creative import analyzer
        return analyzer
    elif name == "schemas":
        from src.creative import schemas
        return schemas
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

__all__ = [
    "tagger",
    "analyzer",
    "schemas",
]