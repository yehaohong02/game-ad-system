"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html

from api.routes import ai, creative, data, execution, memory, platform, reports

app = FastAPI(
    title="游戏买量智能投放系统",
    description="基于 AI 的游戏广告买量全链路管理平台，集成数据诊断、创意洞察、智能执行、安全防护、记忆沉淀五大模块。",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
    openapi_tags=[
        {"name": "data", "description": "数据诊断 — 数据查询、异常检测、指标分析"},
        {"name": "creative", "description": "创意洞察 — 素材排名、元素分析、创意推荐"},
        {"name": "execution", "description": "智能执行 — Agent 运行、规则管理、操作日志"},
        {"name": "memory", "description": "记忆沉淀 — 案例存储、语义检索、经验总结"},
        {"name": "platform", "description": "平台数据 — 素材爬取、排行榜、交叉验证"},
        {"name": "reports", "description": "报告生成 — 日报、周报自动生成"},
        {"name": "ai", "description": "AI 专家 — 多专家对话、告警检查、模型配置"},
        {"name": "system", "description": "系统管理 — 健康检查、服务状态"},
    ],
)

# CORS middleware for frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api prefix
app.include_router(data.router, prefix="/api/data", tags=["data"])
app.include_router(creative.router, prefix="/api/creative", tags=["creative"])
app.include_router(execution.router, prefix="/api/execution", tags=["execution"])
app.include_router(memory.router, prefix="/api/memory", tags=["memory"])
app.include_router(platform.router, prefix="/api/platform", tags=["platform"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])


@app.get("/api/health", tags=["system"], summary="健康检查")
def health_check() -> dict:
    """检查服务运行状态。"""
    return {"status": "ok", "version": "1.0.0"}


@app.get("/docs", include_in_schema=False)
def custom_swagger_ui():
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=f"{app.title} — 接口文档",
        swagger_favicon_url="https://fastapi.tiangolo.com/img/favicon.png",
        swagger_ui_parameters={
            "defaultModelsExpandDepth": -1,
            "docExpansion": "none",
            "theme": "dark",
        },
    )


@app.get("/redoc", include_in_schema=False)
def custom_redoc():
    return get_redoc_html(
        openapi_url=app.openapi_url,
        title=f"{app.title} — 接口文档",
        redoc_favicon_url="https://fastapi.tiangolo.com/img/favicon.png",
    )
