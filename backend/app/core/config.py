import os
from datetime import timedelta

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'pharmaflow.db')}"

SECRET_KEY = os.environ.get("PHARMAFLOW_SECRET_KEY", "pharmaflow-ai-super-secret-dev-key-change-in-prod-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

ML_MODEL_PATH = os.path.join(BASE_DIR, "app", "ml_data", "priority_model.joblib")
