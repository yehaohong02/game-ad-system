"""
Excel 素材表分析 API

支持导入设计师素材表 Excel，快速预览分析结果。
"""

import json
import io
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import pandas as pd
import numpy as np

router = APIRouter(prefix="/excel", tags=["Excel分析"])


class MaterialSummary(BaseModel):
    """素材汇总数据"""
    total_count: int
    category_count: int
    total_spend: float
    total_impressions: int
    total_clicks: int
    avg_ctr: float
    avg_cpm: float


class CategoryStats(BaseModel):
    """游戏分类统计"""
    category: str
    material_count: int
    total_spend: float
    total_impressions: int
    total_clicks: int
    avg_ctr: float


class TopMaterial(BaseModel):
    """Top素材"""
    material_id: str
    category: str
    spend: float
    impressions: int
    clicks: int
    ctr: float
    preview_img: str = ""
    video_url: str = ""


class FunnelStage(BaseModel):
    """漏斗阶段"""
    stage: str
    count: int
    rate: float


class CorrelationInsight(BaseModel):
    """相关性洞察"""
    metric1: str
    metric2: str
    correlation: float
    insight: str


class ExcelAnalysisResult(BaseModel):
    """Excel分析结果"""
    summary: MaterialSummary
    category_stats: list[CategoryStats]
    top_spend: list[TopMaterial]
    top_ctr: list[TopMaterial]
    bottom_ctr: list[TopMaterial]
    funnel: list[FunnelStage]
    insights: list[str]


def parse_excel(file_bytes: bytes) -> pd.DataFrame:
    """解析Excel文件"""
    df = pd.read_excel(io.BytesIO(file_bytes), header=None)

    # 提取表头（第二行）
    header_row = df.iloc[1].tolist()
    # 数据从第3行开始
    data_df = df.iloc[2:].copy()
    data_df.columns = header_row

    # 去掉汇总行和空行
    data_df = data_df[data_df['素材ID'] != '汇总'].reset_index(drop=True)
    data_df = data_df.dropna(subset=['素材ID']).reset_index(drop=True)

    # 转换数值列
    numeric_cols = ['素材花费', '素材展示数', '素材千次展示成本', '素材点击数', '素材点击成本',
                    '素材点击率', '播放次数', '播放2s次数', '播放6s次数',
                    '播放25%次数', '播放50%次数', '播放75%次数', '播放100%次数',
                    '2s播放率', '6s播放率', '25%播放率', '50%播放率', '75%播放率', '100%播放率']

    for col in numeric_cols:
        if col in data_df.columns:
            data_df[col] = pd.to_numeric(data_df[col], errors='coerce')

    return data_df


def extract_preview_urls(link_str: str) -> tuple[str, str]:
    """从预览链接JSON中提取图片和视频URL"""
    try:
        data = json.loads(str(link_str))
        return data.get('_PREVIEW_', ''), data.get('url', '')
    except:
        return '', ''


def analyze_excel(df: pd.DataFrame) -> ExcelAnalysisResult:
    """分析Excel数据"""

    # 解析预览链接
    preview_data = df['预览链接'].apply(lambda x: pd.Series(extract_preview_urls(x), index=['preview_img', 'video_url']))
    df = pd.concat([df, preview_data], axis=1)

    # 1. 汇总数据
    summary = MaterialSummary(
        total_count=len(df),
        category_count=df['游戏分类'].nunique(),
        total_spend=round(df['素材花费'].sum(), 2),
        total_impressions=int(df['素材展示数'].sum()),
        total_clicks=int(df['素材点击数'].sum()),
        avg_ctr=round(df['素材点击率'].mean() * 100, 2) if not pd.isna(df['素材点击率'].mean()) else 0,
        avg_cpm=round(df['素材千次展示成本'].mean(), 2) if not pd.isna(df['素材千次展示成本'].mean()) else 0,
    )

    # 2. 分类统计
    cat_stats = df.groupby('游戏分类').agg({
        '素材ID': 'count',
        '素材花费': 'sum',
        '素材展示数': 'sum',
        '素材点击数': 'sum',
        '素材点击率': 'mean'
    }).rename(columns={'素材ID': '素材数', '素材点击率': '平均CTR'})

    category_stats = []
    for cat, row in cat_stats.iterrows():
        category_stats.append(CategoryStats(
            category=str(cat),
            material_count=int(row['素材数']),
            total_spend=round(float(row['素材花费']), 2),
            total_impressions=int(row['素材展示数']),
            total_clicks=int(row['素材点击数']),
            avg_ctr=round(float(row['平均CTR']) * 100, 2) if not pd.isna(row['平均CTR']) else 0,
        ))

    # 3. Top素材
    def get_top_materials(data: pd.DataFrame, sort_col: str, ascending: bool = False, limit: int = 10) -> list[TopMaterial]:
        sorted_df = data.sort_values(sort_col, ascending=ascending).head(limit)
        result = []
        for _, row in sorted_df.iterrows():
            result.append(TopMaterial(
                material_id=str(row['素材ID']),
                category=str(row['游戏分类']),
                spend=round(float(row['素材花费']), 2),
                impressions=int(row['素材展示数']),
                clicks=int(row['素材点击数']),
                ctr=round(float(row['素材点击率']) * 100, 2) if not pd.isna(row['素材点击率']) else 0,
                preview_img=str(row.get('preview_img', '')),
                video_url=str(row.get('video_url', '')),
            ))
        return result

    top_spend = get_top_materials(df, '素材花费')
    top_ctr = get_top_materials(df, '素材点击率')
    bottom_ctr = get_top_materials(df, '素材点击率', ascending=True)

    # 4. 播放漏斗
    funnel_cols = ['播放次数', '播放2s次数', '播放6s次数', '播放25%次数', '播放50%次数', '播放75%次数', '播放100%次数']
    funnel_avg = df[funnel_cols].mean()
    total_plays = funnel_avg['播放次数']

    funnel = []
    stage_names = ['开始播放', '播放 2s', '播放 6s', '播放 25%', '播放 50%', '播放 75%', '完播']
    for i, (col, name) in enumerate(zip(funnel_cols, stage_names)):
        count = int(funnel_avg[col])
        rate = round(count / total_plays * 100, 1) if total_plays > 0 else 0
        funnel.append(FunnelStage(stage=name, count=count, rate=rate))

    # 5. 生成洞察
    insights = []

    # CTR 分析
    if summary.avg_ctr < 1:
        insights.append(f"⚠️ 平均点击率 {summary.avg_ctr}% 偏低，建议优化素材吸引力")
    elif summary.avg_ctr > 2:
        insights.append(f"✅ 平均点击率 {summary.avg_ctr}% 表现优秀")

    # 完播率分析
    completion_rate = funnel[-1].rate
    if completion_rate < 5:
        insights.append(f"⚠️ 完播率仅 {completion_rate}%，视频前 3 秒需加强钩子")

    # 分类表现差异
    if len(category_stats) > 1:
        best_cat = max(category_stats, key=lambda x: x.avg_ctr)
        worst_cat = min(category_stats, key=lambda x: x.avg_ctr if x.avg_ctr > 0 else 999)
        if best_cat.avg_ctr > worst_cat.avg_ctr * 2:
            insights.append(f"📊 {best_cat.category} CTR ({best_cat.avg_ctr}%) 是 {worst_cat.category} ({worst_cat.avg_ctr}%) 的 {best_cat.avg_ctr/worst_cat.avg_ctr:.1f} 倍，建议重点投放")

    # 花费集中度
    top3_spend_pct = sum(m.spend for m in top_spend[:3]) / summary.total_spend * 100
    if top3_spend_pct > 50:
        insights.append(f"💰 Top 3 素材花费占比 {top3_spend_pct:.1f}%，花费较集中")

    return ExcelAnalysisResult(
        summary=summary,
        category_stats=category_stats,
        top_spend=top_spend,
        top_ctr=top_ctr,
        bottom_ctr=bottom_ctr,
        funnel=funnel,
        insights=insights,
    )


@router.post("/analyze", summary="分析Excel素材表", response_model=ExcelAnalysisResult)
async def analyze_excel_file(file: UploadFile = File(...)):
    """
    上传 Excel 素材表，快速分析预览

    支持格式：.xlsx, .xls
    """
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="请上传 Excel 文件 (.xlsx 或 .xls)")

    try:
        contents = await file.read()
        df = parse_excel(contents)
        result = analyze_excel(df)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"分析失败: {str(e)}")