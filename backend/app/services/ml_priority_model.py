"""
ML-Based Customer Priority Prediction
--------------------------------------
Trains a lightweight RandomForestClassifier on synthetic-but-realistic
historical visit data to predict a customer's priority (High/Medium/Low).

The model auto-trains the first time it's needed and is cached to disk
with joblib so subsequent server restarts load instantly. This module
is intentionally decoupled from the FastAPI layer — swap in a different
estimator or real production data by editing `_generate_training_data`
and `FEATURES` only.
"""
import os
import random
from typing import Dict, List

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

from app.core.config import ML_MODEL_PATH

FEATURES = [
    "days_since_last_visit",
    "total_visits",
    "pending_follow_ups",
    "overdue_follow_ups",
    "customer_type_code",
    "negative_outcome_ratio",
]

CUSTOMER_TYPE_MAP = {"doctor": 0, "hospital": 1, "chemist": 2, "distributor": 3}

_model_cache = {"model": None, "label_encoder": None, "feature_importances": None}


def _generate_training_data(n_samples: int = 1500, seed: int = 42) -> pd.DataFrame:
    """Generate synthetic historical visit/customer records with a
    rule-informed label, used purely to bootstrap a demo ML model."""
    rng = random.Random(seed)
    rows = []
    for _ in range(n_samples):
        days_since = rng.choice([rng.randint(0, 10), rng.randint(11, 30), rng.randint(31, 120)])
        total_visits = rng.randint(0, 20)
        pending_fu = rng.randint(0, 4)
        overdue_fu = rng.randint(0, 3)
        c_type = rng.choice(list(CUSTOMER_TYPE_MAP.keys()))
        neg_ratio = round(rng.uniform(0, 1), 2)

        # Rule-informed synthetic score to derive a plausible ground-truth label
        raw = (
            min(30, days_since * 1.2)
            + min(25, overdue_fu * 12)
            + min(10, pending_fu * 5)
            + (10 if total_visits == 0 else max(0, 10 - min(total_visits, 10)))
            + neg_ratio * 10
            + (5 if c_type in ("hospital", "distributor") else 0)
        )
        raw += rng.uniform(-8, 8)  # noise
        if raw >= 65:
            label = "High"
        elif raw >= 35:
            label = "Medium"
        else:
            label = "Low"

        rows.append({
            "days_since_last_visit": days_since,
            "total_visits": total_visits,
            "pending_follow_ups": pending_fu,
            "overdue_follow_ups": overdue_fu,
            "customer_type_code": CUSTOMER_TYPE_MAP[c_type],
            "negative_outcome_ratio": neg_ratio,
            "priority": label,
        })
    return pd.DataFrame(rows)


def train_model(force: bool = False) -> Dict:
    if not force and os.path.exists(ML_MODEL_PATH):
        return load_model()

    df = _generate_training_data()
    X = df[FEATURES]
    y = df["priority"]

    le = LabelEncoder()
    y_enc = le.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.2, random_state=42, stratify=y_enc
    )

    clf = RandomForestClassifier(
        n_estimators=150, max_depth=8, random_state=42, class_weight="balanced"
    )
    clf.fit(X_train, y_train)
    accuracy = clf.score(X_test, y_test)

    os.makedirs(os.path.dirname(ML_MODEL_PATH), exist_ok=True)
    joblib.dump({"model": clf, "label_encoder": le, "accuracy": accuracy}, ML_MODEL_PATH)

    _model_cache["model"] = clf
    _model_cache["label_encoder"] = le
    _model_cache["feature_importances"] = dict(zip(FEATURES, clf.feature_importances_))

    return {"accuracy": accuracy, "trained": True}


def load_model():
    if _model_cache["model"] is not None:
        return {"accuracy": None, "trained": False, "cached": True}
    if not os.path.exists(ML_MODEL_PATH):
        return train_model(force=True)
    bundle = joblib.load(ML_MODEL_PATH)
    _model_cache["model"] = bundle["model"]
    _model_cache["label_encoder"] = bundle["label_encoder"]
    _model_cache["feature_importances"] = dict(
        zip(FEATURES, bundle["model"].feature_importances_)
    )
    return {"accuracy": bundle.get("accuracy"), "trained": False, "cached": False}


def predict_priority(feature_dict: Dict) -> Dict:
    """feature_dict must contain all keys in FEATURES."""
    if _model_cache["model"] is None:
        load_model()

    model = _model_cache["model"]
    le = _model_cache["label_encoder"]

    X = pd.DataFrame([{f: feature_dict.get(f, 0) for f in FEATURES}])
    pred_encoded = model.predict(X)[0]
    proba = model.predict_proba(X)[0]
    label = le.inverse_transform([pred_encoded])[0]
    confidence = float(max(proba))

    importances = _model_cache["feature_importances"] or {}
    top_factors = sorted(importances.items(), key=lambda kv: kv[1], reverse=True)[:3]

    return {
        "predicted_priority": label,
        "confidence": round(confidence, 3),
        "probabilities": {
            cls: round(float(p), 3) for cls, p in zip(le.classes_, proba)
        },
        "top_factors": [{"feature": f, "importance": round(float(v), 3)} for f, v in top_factors],
    }


def get_model_info() -> Dict:
    if _model_cache["model"] is None:
        load_model()
    return {
        "algorithm": "RandomForestClassifier",
        "features": FEATURES,
        "feature_importances": _model_cache["feature_importances"],
    }
