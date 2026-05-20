import re
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

_SAFE_NAME = re.compile(r"^[a-zA-Z0-9_\-]+$")


def _validate_param(v: str, name: str) -> str:
    if not _SAFE_NAME.match(v):
        raise HTTPException(status_code=400, detail=f"Invalid {name}")
    return v


@router.get("/creatives")
def get_platform_creatives(platform: str = Query("guangdada")):
    from src.shared.db.clickhouse import get_clickhouse
    client = get_clickhouse()
    platform = _validate_param(platform, "platform")
    rows = client.query(f"""
        SELECT * FROM platform_creatives
        WHERE platform = '{platform}'
        ORDER BY scraped_at DESC LIMIT 100
    """)
    return {"data": [dict(zip(rows.column_names, r)) for r in rows.result_rows]}


@router.get("/rankings")
def get_platform_rankings(type: str = Query("weekly")):
    from src.shared.db.clickhouse import get_clickhouse
    client = get_clickhouse()
    type = _validate_param(type, "type")
    rows = client.query(f"""
        SELECT * FROM platform_rankings
        WHERE ranking_type = '{type}'
        ORDER BY ranking_date DESC LIMIT 50
    """)
    return {"data": [dict(zip(rows.column_names, r)) for r in rows.result_rows]}


@router.post("/cross-validate")
def cross_validate_endpoint():
    from src.platform.analyzers.cross_validator import cross_validate as do_cross_validate
    from src.shared.db.clickhouse import get_clickhouse
    client = get_clickhouse()

    platform_rows = client.query("""
        SELECT creative_id, platform, scraped_at FROM platform_creatives
        ORDER BY scraped_at DESC LIMIT 500
    """)
    platform_creatives = [dict(zip(platform_rows.column_names, r)) for r in platform_rows.result_rows]

    internal_rows = client.query("""
        SELECT creative_id, avg(roi) as avg_roas, avg(ctr) as avg_ctr
        FROM ads_performance WHERE creative_id != ''
        GROUP BY creative_id
    """)
    internal_performance = [dict(zip(internal_rows.column_names, r)) for r in internal_rows.result_rows]

    result = do_cross_validate(platform_creatives, internal_performance)
    return {"data": result}


class PlatformConfigCreate(BaseModel):
    id: str
    name: str
    url: str
    selectors: dict = {}


class AnalyzePageRequest(BaseModel):
    html: str
    url: str


class ScrapedDataStore(BaseModel):
    platform_id: str
    data_type: str
    data: list


@router.get("/configs")
def get_platform_configs():
    from src.shared.db.clickhouse import get_clickhouse
    client = get_clickhouse()
    rows = client.query("SELECT id, name, url, selectors, created_at FROM platform_configs ORDER BY created_at DESC")
    return {"data": [dict(zip(rows.column_names, r)) for r in rows.result_rows]}


@router.post("/configs")
def create_platform_config(req: PlatformConfigCreate):
    from src.shared.db.clickhouse import get_clickhouse
    import json
    client = get_clickhouse()
    client.insert(
        "platform_configs",
        [[req.id, req.name, req.url, json.dumps(req.selectors, ensure_ascii=False)]],
        column_names=["id", "name", "url", "selectors"],
    )
    return {"success": True}


@router.delete("/configs/{config_id}")
def delete_platform_config(config_id: str):
    _validate_param(config_id, "config_id")
    from src.shared.db.clickhouse import get_clickhouse
    client = get_clickhouse()
    client.command(f"DELETE FROM platform_configs WHERE id = '{config_id}'")
    return {"success": True}


@router.post("/analyze-page")
def analyze_page(req: AnalyzePageRequest):
    from src.ai.experts.page_analyzer import PageAnalyzerExpert
    expert = PageAnalyzerExpert()
    result = expert.analyze_page(req.html, req.url)
    return {"data": result}


@router.post("/scraped-data")
def store_scraped_data(req: ScrapedDataStore):
    from src.shared.db.clickhouse import get_clickhouse
    import json
    client = get_clickhouse()
    client.insert(
        "platform_scraped_data",
        [[req.platform_id, req.data_type, json.dumps(req.data, ensure_ascii=False)]],
        column_names=["platform_id", "data_type", "data"],
    )
    return {"success": True}


@router.get("/scraped-data/{platform_id}")
def get_scraped_data(platform_id: str, data_type: str = Query("creatives")):
    _validate_param(platform_id, "platform_id")
    from src.shared.db.clickhouse import get_clickhouse
    client = get_clickhouse()
    rows = client.query(f"""
        SELECT data, scraped_at FROM platform_scraped_data
        WHERE platform_id = '{platform_id}' AND data_type = '{data_type}'
        ORDER BY scraped_at DESC LIMIT 1
    """)
    if rows.result_rows:
        import json
        data = json.loads(rows.result_rows[0][0])
        return {"data": data, "scraped_at": rows.result_rows[0][1]}
    return {"data": [], "scraped_at": None}
