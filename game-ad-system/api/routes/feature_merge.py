"""
特征合并 API

将 CreativeTags（标签特征）+ MaterialRecord（行为特征）合并为 30 维特征向量，
用于 Phase 0 实验和后续的预测系统。
"""

from fastapi import APIRouter, Query
from pydantic import BaseModel

router = APIRouter(prefix="/features", tags=["特征"])


class FeatureMergeResponse(BaseModel):
    count: int
    feature_names: list[str]
    message: str | None = None
    vectors: list[dict] | None = None


@router.get("/merge", summary="合并标签特征与行为特征", response_model=FeatureMergeResponse)
async def merge_features(account_id: str = Query(default="default", description="账户 ID")):
    """
    合并 CreativeTags + MaterialRecord → 30 维特征向量

    数据来源：
    - CreativeTags: 从 output/creative_tags/ 目录加载 JSON 文件
    - MaterialRecord: 从 ClickHouse 查询投放数据

    Returns:
        包含 feature_names 和 vectors 的特征矩阵
    """
    try:
        import json
        from pathlib import Path
        from src.creative.feature_matrix import FEATURE_NAMES, FeatureVector, build_feature_vector
        from src.creative.analyzer.performance_fetcher import fetch_creative_performance

        # 1. 加载 CreativeTags
        tags_dir = Path("output/creative_tags")
        if not tags_dir.exists():
            return FeatureMergeResponse(
                count=0,
                feature_names=FEATURE_NAMES,
                message="未找到标签数据目录 output/creative_tags/",
            )

        tags_index: dict[str, dict] = {}
        for f in tags_dir.glob("*.json"):
            with open(f, "r", encoding="utf-8") as fh:
                data = json.load(fh)
                tags_index[data.get("video_id", f.stem)] = data

        if not tags_index:
            return FeatureMergeResponse(
                count=0,
                feature_names=FEATURE_NAMES,
                message="标签数据为空",
            )

        # 2. 获取投放表现数据（ROAS/CTR/IPM）
        from datetime import date
        perf_data = fetch_creative_performance(date.today())
        perf_index = {p["creative_id"]: p for p in perf_data}

        # 3. 合并特征
        vectors = []
        for video_id, tags in tags_index.items():
            perf = perf_index.get(video_id, {})

            # 构建一个模拟的 MaterialRecord（如果没有真实行为数据）
            material_record = {
                "playCount": 1,  # 避免除零
                "play2s": 0, "play6s": 0, "play25": 0,
                "play50": 0, "play75": 0, "play100": 0,
                "ctr": perf.get("ctr", 0),
                "cpm": 0, "cpc": 0,
            }

            vector = build_feature_vector(
                creative_tags=tags,
                material_record=material_record,
                material_id=video_id,
                roas=perf.get("roas"),
            )
            vectors.append({
                "material_id": vector.material_id,
                "features": vector.features,
                "roas": vector.roas,
            })

        return FeatureMergeResponse(
            count=len(vectors),
            feature_names=FEATURE_NAMES,
            vectors=vectors,
        )

    except ImportError as e:
        return FeatureMergeResponse(
            count=0,
            feature_names=[],
            message=f"缺少依赖: {e}",
        )
    except Exception as e:
        return FeatureMergeResponse(
            count=0,
            feature_names=[],
            message=f"错误: {e}",
        )