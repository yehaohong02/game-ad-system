from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/memory", tags=["记忆沉淀"])


class SimilarQuery(BaseModel):
    """相似案例查询请求"""
    objective: str = Field(..., description="活动目标", examples=["ROAS >= 0.8"])
    country: str = Field(..., description="国家代码", examples=["US", "JP"])
    platform: str = Field(..., description="平台", examples=["iOS", "Android"])
    creative_tags: list[str] = Field(default=[], description="素材标签", examples=[["真人讲解", "战斗画面"]])
    top_k: int = Field(default=3, description="返回数量", ge=1, le=10)


class SimilarCase(BaseModel):
    """相似案例"""
    campaign_id: str
    document: str
    metadata: dict
    distance: float


class SimilarResponse(BaseModel):
    """相似案例响应"""
    data: list[dict]


@router.get("/health", summary="模块健康检查")
def health():
    """检查记忆沉淀模块是否正常运行"""
    return {"status": "ok", "module": "memory"}


@router.post("/similar", summary="检索相似案例", response_model=SimilarResponse)
def find_similar(query: SimilarQuery):
    """
    检索与当前活动最相似的历史案例

    基于向量相似度匹配，返回历史投放中表现相似的案例

    - **objective**: 活动目标，如 "ROAS >= 0.8"
    - **country**: 国家代码，如 "US"
    - **platform**: 平台，如 "iOS"
    - **creative_tags**: 素材标签列表（可选）
    - **top_k**: 返回案例数量，默认3

    Returns:
        相似案例列表，包含案例ID、文档内容、元数据和相似度距离
    """
    from src.memory.retrieve import retrieve_similar_cases
    results = retrieve_similar_cases(
        objective=query.objective,
        country=query.country,
        platform=query.platform,
        creative_tags=query.creative_tags,
        top_k=query.top_k,
    )
    return {"data": results}
