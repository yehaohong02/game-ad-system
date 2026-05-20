from fastapi import FastAPI
from api.routes import data, creative, execution, memory

app = FastAPI(
    title="游戏买量系统 API",
    description="""
## 游戏广告买量自动化系统

基于多Agent架构的智能广告投放系统，包含以下核心模块：

### 🧠 DATA（数据诊断）
- 数据管道：Meta Ads、AppsFlyer 数据采集
- 异常检测：自动识别异常指标
- 数据存储：ClickHouse 数据仓库

### 🎨 CREATIVE（创意洞察）
- 素材打标：CLIP 视觉分析 + Whisper 语音转文字
- 元素排序：关联效果分析，输出高潜元素

### ⚡ EXECUTION（执行闭环）
- Agent 推理：基于 LangChain 的决策引擎
- 广告操作：创建、调价、暂停广告

### 🛡️ SAFETY（安全防护）
- 预算锁：防止超烧
- 熔断器：异常自动暂停
- 操作校验：多层安全检查

### 💾 MEMORY（记忆沉淀）
- 案例存储：ChromaDB 向量数据库
- 智能检索：相似案例推荐
- 经验总结：LLM 自动生成摘要
""",
    version="0.1.0",
    contact={
        "name": "游戏买量团队",
        "email": "team@example.com",
    },
    license_info={
        "name": "MIT",
    },
)

app.include_router(data.router)
app.include_router(creative.router)
app.include_router(execution.router)
app.include_router(memory.router)


@app.get("/health", tags=["system"])
def health():
    """
    系统健康检查

    Returns:
        dict: 系统状态
    """
    return {"status": "ok", "version": "0.1.0"}
