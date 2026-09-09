"""
Smart Customer Priority Model
------------------------------
A modular, explainable rule-based scoring engine (0-100) that ranks how
urgently a customer should be visited. Designed so the scoring function
can later be swapped for a trained ML model (see ml_priority_model.py)
without changing the calling code — both expose a similar interface.
"""
from datetime import datetime
from typing import Dict, List, Tuple

from sqlalchemy.orm import Session
from app.models.models import Customer, Visit, FollowUp, VisitStatus, FollowUpStatus, VisitOutcome

CATEGORY_WEIGHT = {
    "hospital": 1.15,
    "distributor": 1.1,
    "doctor": 1.0,
    "chemist": 0.9,
}

OUTCOME_SCORE = {
    VisitOutcome.NEGATIVE: 1.0,
    VisitOutcome.NEUTRAL: 0.5,
    VisitOutcome.NO_OUTCOME: 0.3,
    VisitOutcome.POSITIVE: 0.0,
}


def _days_since(dt: datetime) -> int:
    if dt is None:
        return 999
    delta = datetime.utcnow() - dt
    return max(delta.days, 0)


def compute_customer_priority(db: Session, customer: Customer) -> Dict:
    """Compute an explainable 0-100 priority score for a single customer."""
    reasons: List[str] = []
    score = 0.0

    visits = (
        db.query(Visit)
        .filter(Visit.customer_id == customer.id, Visit.status == VisitStatus.COMPLETED)
        .order_by(Visit.check_out_time.desc())
        .all()
    )
    follow_ups = db.query(FollowUp).filter(FollowUp.customer_id == customer.id).all()

    # 1. Recency of last visit (max 30 pts)
    last_visit = visits[0] if visits else None
    days_since_visit = _days_since(last_visit.check_out_time if last_visit else None)
    recency_points = min(30, days_since_visit * 1.2)
    score += recency_points
    if days_since_visit >= 999:
        reasons.append("Never visited before")
    else:
        reasons.append(f"{days_since_visit} days since last visit (+{recency_points:.0f} pts)")

    # 2. Overdue follow-ups (max 25 pts)
    now = datetime.utcnow()
    overdue = [f for f in follow_ups if f.status == FollowUpStatus.PENDING and f.due_date < now]
    overdue_points = min(25, len(overdue) * 12)
    score += overdue_points
    if overdue:
        reasons.append(f"{len(overdue)} overdue follow-up(s) (+{overdue_points:.0f} pts)")

    # 3. Pending (not yet overdue) follow-ups (max 10 pts)
    pending = [f for f in follow_ups if f.status == FollowUpStatus.PENDING and f.due_date >= now]
    pending_points = min(10, len(pending) * 5)
    score += pending_points
    if pending:
        reasons.append(f"{len(pending)} pending follow-up(s) (+{pending_points:.0f} pts)")

    # 4. Customer category importance (max 15 pts)
    category_points = 15 * (CATEGORY_WEIGHT.get(customer.type.value if hasattr(customer.type, "value") else customer.type, 1.0) - 0.85)
    category_points = max(0, min(15, category_points))
    score += category_points
    reasons.append(f"Category '{customer.type}' importance (+{category_points:.0f} pts)")

    # 5. Interaction frequency - fewer visits overall = higher priority to build relationship (max 10 pts)
    total_visits = len(visits)
    frequency_points = 10 if total_visits == 0 else max(0, 10 - min(total_visits, 10))
    score += frequency_points
    reasons.append(f"{total_visits} total completed visit(s) (+{frequency_points:.0f} pts)")

    # 6. Previous visit outcomes (max 10 pts) — negative/neutral outcomes raise priority
    if last_visit is not None:
        outcome_points = OUTCOME_SCORE.get(last_visit.outcome, 0.3) * 10
    else:
        outcome_points = 5
    score += outcome_points
    reasons.append(f"Last outcome '{last_visit.outcome if last_visit else 'n/a'}' (+{outcome_points:.0f} pts)")

    score = round(min(100, max(0, score)), 1)

    if score >= 65:
        tier = "High"
    elif score >= 35:
        tier = "Medium"
    else:
        tier = "Low"

    return {
        "customer_id": customer.id,
        "customer_name": customer.name,
        "score": score,
        "priority": tier,
        "reasons": reasons,
        "days_since_last_visit": days_since_visit,
        "overdue_follow_ups": len(overdue),
        "pending_follow_ups": len(pending),
    }


def compute_all_priorities(db: Session, customer_ids: List[int] = None) -> List[Dict]:
    query = db.query(Customer).filter(Customer.is_active == True)  # noqa: E712
    if customer_ids:
        query = query.filter(Customer.id.in_(customer_ids))
    customers = query.all()
    results = [compute_customer_priority(db, c) for c in customers]
    results.sort(key=lambda r: r["score"], reverse=True)
    return results
