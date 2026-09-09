from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.core.config import CORS_ORIGINS
from app.seed import seed_database
from app.routers import auth, employees, customers, work_plans, visits, follow_ups, dashboard, ai

Base.metadata.create_all(bind=engine)
seed_database()

app = FastAPI(
    title="PharmaFlow AI",
    description="Pharmaceutical Field Force & Business Management Platform with AI-powered insights.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(customers.router)
app.include_router(work_plans.router)
app.include_router(visits.router)
app.include_router(follow_ups.router)
app.include_router(dashboard.router)
app.include_router(ai.router)


@app.get("/")
def root():
    return {
        "message": "PharmaFlow AI API is running",
        "docs": "/docs",
        "version": "1.0.0",
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}
