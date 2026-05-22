from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
from typing import Optional
import tempfile, os

router = APIRouter(prefix="/manager", tags=["管理者模式"])


@router.get("/health", summary="模块健康检查")
def health():
    return {"status": "ok", "module": "manager"}


@router.get("/designers", summary="获取设计师列表及聚合指标")
def get_designers():
    """返回所有设计师的聚合数据。前端通过 materialData store 按设计师分组计算，此接口供未来后端计算使用。"""
    return {"data": [], "message": "前端直接使用 materialData store 计算"}


@router.get("/designers/{name}", summary="获取单个设计师详情")
def get_designer_detail(name: str):
    """返回指定设计师的详细数据"""
    return {"data": {"name": name, "materials": []}}


@router.post("/upload-excel", summary="上传Excel素材数据文件")
async def upload_excel(file: UploadFile = File(...)):
    """上传Excel文件（.xlsx/.xls/.csv），解析并返回JSON数据。

    支持的列格式:
    - 素材ID, 预览链接, 游戏名称, 设计师, 媒体, 花费, 展示量, CPM, 点击数, CPC, CTR,
      播放次数, 播放2s, 播放6s, 播放25%, 播放50%, 播放75%, 播放100%
    """
    try:
        import pandas as pd
        import json

        suffix = os.path.splitext(file.filename or "")[1].lower()
        content = await file.read()

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        if suffix == '.csv':
            df = pd.read_csv(tmp_path, encoding='utf-8-sig')
        else:
            df = pd.read_excel(tmp_path, header=1)

        os.unlink(tmp_path)

        # Standardize columns
        cols_needed = df.columns.tolist()[:24]
        col_names = [
            'materialId', 'preview', 'game', 'designer', 'media',
            'spend', 'impressions', 'cpm', 'clicks', 'cpc', 'ctr',
            'playCount', 'play2s', 'play6s', 'play25', 'play50', 'play75', 'play100',
            'play2sRate', 'play6sRate', 'play25Rate', 'play50Rate', 'play75Rate', 'play100Rate'
        ]
        df.columns = col_names[:len(df.columns)]

        # Filter valid rows
        df = df[df['materialId'].notna() & (df['materialId'].astype(str) != '合计')]
        df = df[df['materialId'].apply(lambda x: str(x).replace('.','').replace('-','').isdigit())]

        # Build records
        num_fields = ['spend','impressions','cpm','clicks','cpc','ctr','playCount',
                      'play2s','play6s','play25','play50','play75','play100',
                      'play2sRate','play6sRate','play25Rate','play50Rate','play75Rate','play100Rate']
        records = []
        for _, row in df.iterrows():
            rec = {
                'key': str(row.get('materialId', '')),
                'materialId': str(row.get('materialId', '')),
                'category': str(row.get('game', '')),
                'game': str(row.get('game', '')),
                'designer': str(row.get('designer', '')),
                'media': str(row.get('media', '')),
                'preview': str(row.get('preview', '')),
                'country': '', 'platform': '', 'status': '',
                'installs': 0, 'cpi': 0, 'roas': 0,
            }
            for f in num_fields:
                v = row.get(f)
                rec[f] = float(v) if pd.notna(v) else 0
            records.append(rec)

        return {
            "success": True,
            "count": len(records),
            "data": records,
            "fileName": file.filename,
        }

    except Exception as e:
        return {
            "success": False,
            "message": f"解析失败: {str(e)}",
            "data": [],
        }
