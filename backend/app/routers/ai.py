from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import User, Customer
from app.core.security import get_current_user
from app.services import priority_engine, ml_priority_model as ml, recommendation_engine
from app.services.notes_analyzer import analyze_note

router = APIRouter(prefix="/api/ai", tags=["AI Insights"])


@router.get("/priority/{customer_id}")
def customer_priority(customer_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return priority_engine.compute_customer_priority(db, customer)


@router.get("/priority")
def all_priorities(employee_id: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customer_ids = None
    if employee_id:
        customer_ids = [c.id for c in db.query(Customer).filter(Customer.assigned_employee_id == employee_id).all()]
    return {"priorities": priority_engine.compute_all_priorities(db, customer_ids)}


@router.get("/ml-predict/{customer_id}")
def ml_predict(customer_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    pr = priority_engine.compute_customer_priority(db, customer)
    from app.services.recommendation_engine import _customer_ml_features
    features = _customer_ml_features(db, customer, pr)
    result = ml.predict_priority(features)
    result["customer_id"] = customer_id
    result["customer_name"] = customer.name
    result["features_used"] = features
    return result


@router.get("/model-info")
def model_info(current_user: User = Depends(get_current_user)):
    return ml.get_model_info()


@router.post("/model-retrain")
def retrain_model(current_user: User = Depends(get_current_user)):
    return ml.train_model(force=True)


@router.get("/recommendations/{employee_id}")
def recommendations(employee_id: int, top_n: int = 5, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"recommendations": recommendation_engine.recommend_visits(db, employee_id, top_n)}


@router.post("/analyze-note")
def analyze_note_endpoint(text: str = Body(..., embed=True), current_user: User = Depends(get_current_user)):
    return analyze_note(text)
