import uuid
import base64
from datetime import datetime
from fastapi import APIRouter, Query, UploadFile, File

router = APIRouter()


@router.post("/upload")
async def upload_creative(file: UploadFile = File(...)):
    """上传素材图片，AI自动识别标签并返回素材信息"""
    contents = await file.read()

    # 调用CLIP视觉标签器
    from src.creative.tagger.visual_tagger import tag_visual
    tags = tag_visual(contents)

    # 生成素材ID和缩略图base64
    creative_id = f"CR-{uuid.uuid4().hex[:6].upper()}"
    thumbnail_b64 = base64.b64encode(contents).decode()
    mime = file.content_type or "image/jpeg"
    thumbnail_url = f"data:{mime};base64,{thumbnail_b64}"

    creative = {
        "creative_id": creative_id,
        "type": "image",
        "thumbnail": thumbnail_url,
        "ctr": 0,
        "cpi": 0,
        "roas": 0,
        "tags": tags,
        "status": "review",
        "name": file.filename or f"上传素材 {creative_id}",
        "spend": 0,
        "installs": 0,
        "impressions": 0,
        "platform": "待分配",
        "advertiser": "User",
        "createdAt": datetime.now().strftime("%Y-%m-%d"),
        "trend": "stable",
    }

    return {"creative": creative, "tags": tags}


@router.get("/rankings")
def get_rankings(days: int = Query(7)):
    from src.creative.analyzer.performance_fetcher import fetch_creative_performance
    return {"data": fetch_creative_performance(days)}


@router.get("/elements")
def get_elements(days: int = Query(7)):
    from src.creative.analyzer.element_ranker import rank_elements
    return {"data": rank_elements(days)}


@router.post("/recommend")
def recommend_creative():
    from src.creative.analyzer.element_ranker import rank_elements
    from src.creative.recommender import generate_creative_brief
    elements = rank_elements()
    brief = generate_creative_brief(elements)
    return {"brief": brief}
