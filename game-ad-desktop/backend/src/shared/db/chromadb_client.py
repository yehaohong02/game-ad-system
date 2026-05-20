"""ChromaDB client singleton and collection helper."""

from __future__ import annotations

import chromadb

from src.shared.config import get_settings

_client: chromadb.HttpClient | None = None


def get_chromadb() -> chromadb.HttpClient:
    """Return a singleton ChromaDB HttpClient."""
    global _client
    if _client is None:
        settings = get_settings()
        _client = chromadb.HttpClient(
            host=settings.chromadb_host,
            port=settings.chromadb_port,
        )
    return _client


def get_collection(name: str | None = None) -> chromadb.Collection:
    """Return a ChromaDB collection (defaults to config collection name)."""
    settings = get_settings()
    collection_name = name or settings.chromadb_collection
    client = get_chromadb()
    return client.get_or_create_collection(name=collection_name)
