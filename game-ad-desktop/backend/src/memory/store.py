"""案例存储到 ChromaDB"""
from src.shared.db.chromadb_client import get_collection
import json


def store_case(case: dict):
    collection = get_collection()
    case_id = case.get("case_id")
    if not case_id:
        raise ValueError("case_id is required")
    text = json.dumps(case, ensure_ascii=False, default=str)
    collection.upsert(
        ids=[case_id],
        documents=[text],
        metadatas=[{
            "country": case.get("country", ""),
            "platform": case.get("platform", ""),
            "roas": str(case.get("final_result", {}).get("roas", 0)),
        }],
    )
