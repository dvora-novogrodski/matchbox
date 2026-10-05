import pytest
from fastapi.testclient import TestClient

from app.api.main import app as ai_app
from app.worker.main import app as worker_app


@pytest.mark.parametrize(
    ("app", "service"),
    [(ai_app, "ai"), (worker_app, "worker")],
)
def test_health_ok(app, service):
    res = TestClient(app).get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["service"] == service
    assert body["uptime_seconds"] >= 0
