"""语义检索历史案例"""
from src.shared.db.chromadb_client import get_collection
import json


def retrieve_similar(query: str, top_k: int = 5) -> list[dict]:
    collection = get_collection()
    results = collection.query(query_texts=[query], n_results=top_k)
    cases = []
    if results and results["documents"]:
        for i, doc in enumerate(results["documents"][0]):
            try:
                case = json.loads(doc)
            except json.JSONDecodeError:
                case = {"summary": doc}
            case["distance"] = results["distances"][0][i] if results.get("distances") else 0
            cases.append(case)
    return cases
