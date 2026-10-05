from fastapi import APIRouter

from app.schemas.health import HealthStatus
from app.uptime import uptime_seconds

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthStatus)
def health() -> HealthStatus:
    return HealthStatus(service="ai", uptime_seconds=uptime_seconds())
