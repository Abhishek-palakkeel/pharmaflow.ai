"""
Smart Visit Recommendation Engine
-----------------------------------
Combines the rule-based priority score, ML priority prediction, follow-up
urgency, recency, and territory matching to recommend the top customers
an employee should visit next, each with a human-readable explanation.
"""
from datetime import datetime
from typing import Dict, List

from sqlalchemy.orm import Session
from app.models.models import Customer, Employee, FollowUp, FollowUpStatus
from app.services.priority_engine import compute_customer_priority
from app.services import ml_priority_model as ml


def _customer_ml_features(db: Session, customer: Customer, priority_info: Dict) -> Dict:
    from app.services.ml_priority_model import CUSTOMER_TYPE_MAP
    ctype = customer.type.value if hasattr(customer.type, "value") else customer.type
    return {
        "days_since_last_visit": min(priority_info["days_since_last_visit"], 365),
        "total_visits": max(0, 20 - priority_info["overdue_follow_ups"]),  # approx proxy
        "pending_follow_ups": priority_info["pending_follow_ups"],
        "overdue_follow_ups": priority_info["overdue_follow_ups"],
        "customer_type_code": CUSTOMER_TYPE_MAP.get(ctype, 0),
        "negative_outcome_ratio": 0.3,
    }


def recommend_visits(db: Session, employee_id: int, top_n: int = 5) -> List[Dict]:
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        return []

    customers = (
        db.query(Customer)
        .filter(Customer.is_active == True)  # noqa: E712
        .filter(
            (Customer.assigned_employee_id == employee_id)
            | (Customer.territory == employee.territory)
        )
        .all()
    )

    recs = []
    now = datetime.utcnow()
    for c in customers:
        pr = compute_customer_priority(db, c)
        overdue_fu = (
            db.query(FollowUp)
            .filter(
                FollowUp.customer_id == c.id,
                FollowUp.status == FollowUpStatus.PENDING,
                FollowUp.due_date < now,
            )
            .count()
        )
        territory_match = c.territory == employee.territory
        assigned = c.assigned_employee_id == employee_id

        combined_score = pr["score"] + (10 if territory_match else 0) + (5 if assigned else 0) + overdue_fu * 3

        try:
            ml_result = ml.predict_priority(_customer_ml_features(db, c, pr))
        except Exception:
            ml_result = {"predicted_priority": pr["priority"], "confidence": 0.5}

        explanation_parts = []
        if overdue_fu:
            explanation_parts.append(f"{overdue_fu} overdue follow-up(s)")
        if pr["days_since_last_visit"] >= 999:
            explanation_parts.append("never visited")
        else:
            explanation_parts.append(f"{pr['days_since_last_visit']} days since last visit")
        if assigned:
            explanation_parts.append("directly assigned to you")
        elif territory_match:
            explanation_parts.append("in your territory")
        explanation_parts.append(f"ML predicts {ml_result['predicted_priority']} priority")

        recs.append({
            "customer_id": c.id,
            "customer_name": c.name,
            "customer_type": c.type.value if hasattr(c.type, "value") else c.type,
            "territory": c.territory,
            "rule_based_score": pr["score"],
            "rule_based_priority": pr["priority"],
            "ml_predicted_priority": ml_result["predicted_priority"],
            "ml_confidence": ml_result["confidence"],
            "combined_score": round(combined_score, 1),
            "explanation": "Recommended because: " + "; ".join(explanation_parts) + ".",
        })

    recs.sort(key=lambda r: r["combined_score"], reverse=True)
    return recs[:top_n]
