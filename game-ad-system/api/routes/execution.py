from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/execution", tags=["执行闭环"])


class AgentQuery(BaseModel):
    """Agent查询请求"""
    query: str = Field(..., description="用户指令", examples=["暂停ROI低于0.5的广告"])


class AgentResponse(BaseModel):
    """Agent执行结果"""
    result: str


class BidUpdateRequest(BaseModel):
    """出价更新请求"""
    ad_id: str = Field(..., description="广告ID")
    new_bid: float = Field(..., description="新出价", gt=0)
    current_bid: float = Field(0.0, description="当前出价")


@router.get("/health", summary="模块健康检查")
def health():
    """检查执行闭环模块是否正常运行"""
    return {"status": "ok", "module": "execution"}


@router.post("/agent/run", summary="运行Agent", response_model=AgentResponse)
def run_agent(query: AgentQuery):
    """
    执行Agent推理并返回决策结果

    Agent会根据用户指令，结合当前数据和规则，做出广告操作决策

    - **query**: 用户指令，如 "暂停ROI低于0.5的广告"

    Returns:
        Agent的决策结果和执行计划
    """
    from src.execution.agent.executor import AdExecutorAgent
    agent = AdExecutorAgent()
    result = agent.run(query.query)
    return {"result": result}


@router.post("/update-bid", summary="更新出价")
def update_bid(req: BidUpdateRequest):
    """
    更新广告出价

    经过安全层校验后执行出价调整

    - **ad_id**: 广告ID
    - **new_bid**: 新出价（必须大于0）
    - **current_bid**: 当前出价（用于安全校验）

    Returns:
        操作结果，包含成功/失败状态和消息
    """
    from src.execution.tools.update_bid import update_bid as _update_bid
    result = _update_bid(req.ad_id, req.new_bid, req.current_bid)
    return result
