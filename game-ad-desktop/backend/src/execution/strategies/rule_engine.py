"""优化规则引擎"""
from dataclasses import dataclass
from typing import Callable


@dataclass
class Rule:
    id: str
    name: str
    condition: Callable[[dict], bool]
    action: str
    enabled: bool = True


DEFAULT_RULES = [
    Rule(
        id="R1",
        name="低ROAS自动暂停",
        condition=lambda d: d.get("spend", 0) > 200 and d.get("roas", 1) < 0.4 and d.get("low_roas_days", 0) >= 2,
        action="pause_ad",
    ),
    Rule(
        id="R2",
        name="高CPI降价",
        condition=lambda d: d.get("cpi_exceed_days", 0) >= 3,
        action="reduce_bid",
    ),
    Rule(
        id="R3",
        name="高CTR素材放大",
        condition=lambda d: d.get("ctr", 0) > d.get("avg_ctr", 1) * 1.5,
        action="scale_ad",
    ),
    Rule(
        id="R4",
        name="预算耗尽未达标",
        condition=lambda d: d.get("budget_usage", 0) > 0.8 and d.get("roas", 1) < d.get("target_roas", 0.8),
        action="pause_and_notify",
    ),
]


class RuleEngine:
    def __init__(self, rules: list[Rule] = None):
        self.rules = rules or DEFAULT_RULES

    def evaluate(self, data: dict) -> list[dict]:
        triggered = []
        for rule in self.rules:
            if rule.enabled and rule.condition(data):
                triggered.append({"rule_id": rule.id, "name": rule.name, "action": rule.action})
        return triggered

    def add_rule(self, rule: Rule):
        self.rules.append(rule)

    def remove_rule(self, rule_id: str):
        self.rules = [r for r in self.rules if r.id != rule_id]

    def toggle_rule(self, rule_id: str, enabled: bool):
        for r in self.rules:
            if r.id == rule_id:
                r.enabled = enabled
