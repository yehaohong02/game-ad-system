from pydantic import BaseModel


class AdAction(BaseModel):
    action: str
    ad_id: str = ""
    ad_set_id: str = ""
    creative_id: str = ""
    headline: str = ""
    body_text: str = ""
    new_bid: float = 0.0
    date_from: str = ""
    date_to: str = ""


class AdActionResult(BaseModel):
    success: bool
    action: str
    ad_id: str = ""
    message: str = ""
    data: dict = {}
