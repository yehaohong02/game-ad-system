from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter()

_runner = None


class AgentRequest(BaseModel):
    query: str
    context: dict = Field(default_factory=dict)


def _get_runner():
    global _runner
    if _runner is None:
        from src.execution.agent.agent_runner import AdAgentRunner
        _runner = AdAgentRunner()
    return _runner


@router.post("/agent/run")
def run_agent(req: AgentRequest):
    try:
        result = _get_runner().run(req.query, req.context)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rules")
def get_rules():
    from src.execution.strategies.rule_engine import DEFAULT_RULES
    return {"data": [{"id": r.id, "name": r.name, "enabled": r.enabled} for r in DEFAULT_RULES]}