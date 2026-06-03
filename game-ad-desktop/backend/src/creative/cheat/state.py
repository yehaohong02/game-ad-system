"""状态管理 — .cheat-state.json 读写"""

import json
from pathlib import Path
from datetime import datetime
from typing import Any

CHEAT_DIR = Path(__file__).parent.parent.parent.parent / "output" / "cheat"
STATE_FILE = CHEAT_DIR / ".cheat-state.json"

LATEST_SCHEMA = "1.4"

DEFAULT_STATE = {
    "schema_version": LATEST_SCHEMA,
    "calibration_samples": 0,
    "content_form": "opinion-video",
    "target_publish_cadence_days": 3,
    "platform": "douyin",
    "data_collection": "manual",
    "rubric_version": 1,
    "rubric_formula": "(ER*1.5 + SR*1.5 + HP*1.5 + QL + NA + AB + SAT) / 8.5 * 2.0",
    "rubric_dimensions": {
        "ER": {"name": "Emotional Resonance", "weight": 1.5, "description": "情感共鸣"},
        "SR": {"name": "Social Resonance", "weight": 1.5, "description": "社会共鸣"},
        "HP": {"name": "Hook Potential", "weight": 1.5, "description": "钩子潜力"},
        "QL": {"name": "Quotable Lines", "weight": 1.0, "description": "金句密度"},
        "NA": {"name": "Narrativity", "weight": 1.0, "description": "叙事性"},
        "AB": {"name": "Audience Breadth", "weight": 1.0, "description": "受众广度"},
        "SAT": {"name": "Satire Depth", "weight": 1.0, "description": "讽刺深度"},
    },
    "bucket_scheme": "ratio",
    "bucket_boundaries": {
        "viral": {"min": 5.0, "max": 999, "label": "爆款"},
        "outperform": {"min": 2.0, "max": 5.0, "label": "超均"},
        "average": {"min": 0.8, "max": 2.0, "label": "均值"},
        "underperform": {"min": 0.3, "max": 0.8, "label": "低于均值"},
        "flop": {"min": 0, "max": 0.3, "label": "扑街"},
    },
    "enabled_trend_sources": ["manual-paste"],
    "enabled_perf_adapters": ["manual"],
    "baseline_plays": 0,
    "last_bump_at": None,
    "last_retro_at": None,
    "last_published_at": None,
    "last_published_file": None,
    "pending_retros": [],
    "shoots": [],
    "consecutive_directional_errors": [],
    "in_progress_session": None,
    "last_prediction_self_scored": False,
    "last_self_scored_at": None,
    "rubric_form_mismatch": False,
    "benchmark_imported": False,
    "benchmark_account": None,
    "created_at": None,
    "updated_at": None,
}


def ensure_dirs():
    """确保 cheat 目录结构存在"""
    for d in ["predictions", "videos", "scripts", "samples", "candidates"]:
        (CHEAT_DIR / d).mkdir(parents=True, exist_ok=True)


def load_state() -> dict:
    """加载状态，不存在则返回默认值"""
    if STATE_FILE.exists():
        with open(STATE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {**DEFAULT_STATE, "created_at": datetime.now().isoformat(), "updated_at": datetime.now().isoformat()}


def save_state(state: dict):
    """原子写入状态文件"""
    ensure_dirs()
    state["updated_at"] = datetime.now().isoformat()
    tmp = STATE_FILE.with_suffix(".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)
    tmp.replace(STATE_FILE)


def get_field(state: dict, field: str, default: Any = None) -> Any:
    """安全获取字段，支持缺失字段的默认值"""
    return state.get(field, default)


def init_state(content_form: str = "opinion-video", platform: str = "douyin", cadence_days: int = 3) -> dict:
    """初始化新项目状态"""
    state = {
        **DEFAULT_STATE,
        "content_form": content_form,
        "platform": platform,
        "target_publish_cadence_days": cadence_days,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
    }
    save_state(state)
    ensure_dirs()
    return state