from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()


class SimilarRequest(BaseModel):
    objective: str
    top_k: int = Field(default=5, ge=1, le=100)


@router.post("/similar")
def search_similar(req: SimilarRequest):
    from src.memory.retrieve import retrieve_similar
    cases = retrieve_similar(req.objective, req.top_k)
    return {"data": cases}


@router.get("/stats")
def memory_stats():
    from src.shared.db.chromadb_client import get_collection
    collection = get_collection()
    return {"count": collection.count()}
