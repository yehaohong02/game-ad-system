from fastapi import APIRouter
from pydantic import BaseModel, Field
from src.ai.commander import Commander, EXPERTS

router = APIRouter()

_commander = Commander()


class ChatRequest(BaseModel):
    module: str
    message: str
    data: dict = Field(default_factory=dict)


class AlertRequest(BaseModel):
    module: str
    data: dict


@router.post("/chat")
def ai_chat(req: ChatRequest):
    data = {**req.data, "user_message": req.message}
    result = _commander.dispatch(req.module, data, "analyze")
    return {"response": result}


@router.post("/alert-check")
def alert_check(req: AlertRequest):
    result = _commander.dispatch(req.module, req.data, "alert")
    return {"alert": result}


@router.get("/experts")
def list_experts():
    return {"data": [{"module": k, "name": v.name} for k, v in EXPERTS.items()]}
