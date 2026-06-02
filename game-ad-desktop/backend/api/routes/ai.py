from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from src.ai.commander import Commander, EXPERTS

router = APIRouter()

_commander = None


def _get_commander():
    global _commander
    if _commander is None:
        try:
            _commander = Commander()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Commander init failed: {e}")
    return _commander


class ChatRequest(BaseModel):
    module: str
    message: str
    data: dict = Field(default_factory=dict)


class AlertRequest(BaseModel):
    module: str
    data: dict


@router.post("/chat")
def ai_chat(req: ChatRequest):
    try:
        data = {**req.data, "user_message": req.message}
        result = _get_commander().dispatch(req.module, data, "analyze")
        return {"response": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/alert-check")
def alert_check(req: AlertRequest):
    try:
        result = _get_commander().dispatch(req.module, req.data, "alert")
        return {"alert": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/experts")
def list_experts():
    return {"data": [{"module": k, "name": v.name} for k, v in EXPERTS.items()]}