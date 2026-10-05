from fastapi import FastAPI

from app.api.routes import health

app = FastAPI(title="Matchbox AI service", version="0.0.0")
app.include_router(health.router)
