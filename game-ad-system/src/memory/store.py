import chromadb
import os
from pathlib import Path

from src.memory.schemas import CampaignCase

# Use an absolute path based on the project root to avoid working-directory issues
CHROMA_DB_PATH = os.environ.get("CHROMA_DB_PATH", os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "chroma_data"))
COLLECTION_NAME = "campaign_memory"


class MemoryStore:
    def __init__(self, db_path: str = CHROMA_DB_PATH):
        self.client = chromadb.PersistentClient(path=db_path)
        self.collection = self.client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )

    def save_case(self, case: CampaignCase) -> None:
        document = case.to_document()
        metadata = case.to_metadata()

        self.collection.add(
            documents=[document],
            metadatas=[metadata],
            ids=[case.campaign_id],
        )

    def save_cases(self, cases: list[CampaignCase]) -> None:
        if not cases:
            return

        documents = [c.to_document() for c in cases]
        metadatas = [c.to_metadata() for c in cases]
        ids = [c.campaign_id for c in cases]

        self.collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids,
        )