import chromadb
from src.memory.store import CHROMA_DB_PATH, COLLECTION_NAME


def retrieve_similar_cases(
    objective: str,
    country: str,
    platform: str,
    creative_tags: list[str] | None = None,
    top_k: int = 3,
) -> list[dict]:
    """检索与新活动最相似的历史案例"""
    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    collection = client.get_collection(name=COLLECTION_NAME)

    query_parts = [f"目标: {objective}", f"地区: {country}", f"平台: {platform}"]
    if creative_tags:
        query_parts.append(f"素材标签: {', '.join(creative_tags)}")
    query_text = "\n".join(query_parts)

    where_filter = {"country": country} if country else None

    result = collection.query(
        query_texts=[query_text],
        n_results=top_k,
        where=where_filter,
    )

    cases = []
    if result["ids"] and result["ids"][0]:
        for i, case_id in enumerate(result["ids"][0]):
            cases.append({
                "campaign_id": case_id,
                "document": result["documents"][0][i] if result["documents"] else "",
                "metadata": result["metadatas"][0][i] if result["metadatas"] else {},
                "distance": result["distances"][0][i] if result["distances"] else 1.0,
            })

    return cases
