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
    elif name == "feature_extractor":
        from src.creative import feature_extractor
        return feature_extractor
    elif name == "feature_matrix":
        from src.creative import feature_matrix
        return feature_matrix
    elif name == "experiment":
        from src.creative import experiment
        return experiment
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

__all__ = [
    "tagger",
    "analyzer",
    "schemas",
    "feature_extractor",
    "feature_matrix",
    "experiment",
]