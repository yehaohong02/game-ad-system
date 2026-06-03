"""
Phase 0 数据验证实验 API

提供端点运行实验，验证"标签+行为特征能否预测 ROAS 排名"。
"""

from fastapi import APIRouter, Query
from pydantic import BaseModel

router = APIRouter(prefix="/experiment", tags=["实验"])


class ExperimentResponse(BaseModel):
    status: str
    message: str | None = None
    recommendation: str | None = None
    data: dict | None = None


@router.post("/phase0", summary="运行 Phase 0 数据验证实验", response_model=ExperimentResponse)
async def run_phase0(account_id: str = Query(default="default", description="账户 ID")):
    """
    运行 Phase 0 数据验证实验

    核心问题：从素材标签 + 行为特征能否预测 ROAS 排名？

    实验步骤：
    1. 特征重要性分析（Spearman 相关系数）
    2. 公式命中率回测（加权匹配 + 独立样本 t 检验）
    3. 排名可预测性评估（Spearman ρ + NDCG）

    Returns:
        包含 Go/No-Go 建议、特征重要性、公式回测结果的完整报告
    """
    try:
        from src.creative.experiment import Phase0Experiment
        from src.creative.feature_matrix import FeatureVector, build_feature_vector

        # 获取素材标签数据（从 JSON 文件）
        import json
        from pathlib import Path

        tags_dir = Path("output/creative_tags")
        if not tags_dir.exists():
            return ExperimentResponse(
                status="no_data",
                message="未找到标签数据，请先运行打标流水线",
                recommendation="no-go",
            )

        # 加载所有标签文件
        creative_tags_list = []
        for f in tags_dir.glob("*.json"):
            with open(f, "r", encoding="utf-8") as fh:
                creative_tags_list.append(json.load(fh))

        if not creative_tags_list:
            return ExperimentResponse(
                status="no_data",
                message="标签数据为空",
                recommendation="no-go",
            )

        # 构建特征向量（注意：这里没有 MaterialRecord 行为数据，只用标签特征）
        # 实际使用时需要通过 /features/merge 端点合并数据
        formulas = [
            {"id": "f1", "name": "末世生存+建造经营", "tags": ["建造", "经营", "末世", "生存"]},
            {"id": "f2", "name": "真人剧情+游戏混剪", "tags": ["真人", "剧情", "混剪"]},
            {"id": "f3", "name": "解压治愈+放松逃离", "tags": ["解压", "治愈", "放松"]},
            {"id": "f4", "name": "突发事件+快速响应", "tags": ["技巧", "逆境", "反击"]},
            {"id": "f5", "name": "真人出镜+技巧展示", "tags": ["真人", "技巧", "展示"]},
            {"id": "f6", "name": "新角色/新玩法首发", "tags": ["剧情", "沉浸", "首发"]},
            {"id": "f7", "name": "短平快+高频测试", "tags": ["解压", "轻松", "测试"]},
        ]

        # 构建特征向量（简化版：只有标签特征，没有行为特征和 ROAS）
        vectors = []
        for tags in creative_tags_list:
            vectors.append(FeatureVector(
                material_id=tags.get("video_id", "unknown"),
                features={f"scene_{k}": v for k, v in tags.get("scene_scores", {}).items()},
                roas=tags.get("roas"),  # 如果标签文件中有 ROAS 数据
            ))

        experiment = Phase0Experiment(vectors, formulas)
        result = experiment.run_full_experiment()

        return ExperimentResponse(
            status=result.get("status", "error"),
            recommendation=result.get("recommendation"),
            data=result,
        )

    except ImportError as e:
        return ExperimentResponse(
            status="dependency_error",
            message=f"缺少依赖: {e}",
            recommendation="no-go",
        )
    except Exception as e:
        return ExperimentResponse(
            status="error",
            message=str(e),
            recommendation="no-go",
        )