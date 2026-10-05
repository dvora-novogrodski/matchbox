from typing import Literal

from pydantic import BaseModel


class HealthStatus(BaseModel):
    status: Literal["ok"] = "ok"
    service: Literal["ai", "worker"]
    uptime_seconds: int
