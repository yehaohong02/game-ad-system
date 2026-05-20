from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/creative", tags=["创意洞察"])


class ElementRanking(BaseModel):
    element: str
    score: float
    frequency: int


class RankingsResponse(BaseModel):
    data: list[dict]


@router.get("/health", summary="模块健康检查")
def health():
    """检查创意洞察模块是否正常运行"""
    return {"status": "ok", "module": "creative"}


@router.get("/rankings", summary="获取素材元素排名", response_model=RankingsResponse)
def get_element_rankings():
    """
    获取素材元素的效果排名

    分析历史广告素材，按效果指标对创意元素进行排序

    Returns:
        包含元素名称、效果分数、出现频次的排名列表
    """
    from src.creative.analyzer.element_ranker import rank_elements
    rankings = rank_elements({})
    return {"data": [r.model_dump() for r in rankings]}
