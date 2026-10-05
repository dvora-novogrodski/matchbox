from fastapi import FastAPI

from app.schemas.health import HealthStatus
from app.uptime import uptime_seconds

app = FastAPI(title="Matchbox AI worker", version="0.0.0")


@app.get("/health", response_model=HealthStatus, tags=["health"])
def health() -> HealthStatus:
    return HealthStatus(service="worker", uptime_seconds=uptime_seconds())
