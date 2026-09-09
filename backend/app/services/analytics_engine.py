"""
Data Analytics & Performance Insights Engine
----------------------------------------------
Computes real metrics from the database (no fake numbers) and generates
plain-English insight sentences comparing the current period to the
previous one.
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.models import (
    Visit, VisitStatus, FollowUp, FollowUpStatus, Customer, Employee, CustomerType
)


def _period_bounds(days: int):
    now = datetime.utcnow()
    current_start = now - timedelta(days=days)
    previous_start = now - timedelta(days=days * 2)
    return previous_start, current_start, now


def visit_completion_rate(db: Session, start: datetime, end: datetime, employee_id: Optional[int] = None) -> float:
    q = db.query(Visit).filter(Visit.scheduled_date >= start, Visit.scheduled_date < end)
    if employee_id:
        q = q.filter(Visit.employee_id == employee_id)
    total = q.count()
    if total == 0:
        return 0.0
    completed = q.filter(Visit.status == VisitStatus.COMPLETED).count()
    return round((completed / total) * 100, 1)


def generate_insights(db: Session, employee_id: Optional[int] = None, days: int = 30) -> List[Dict]:
    insights = []
    prev_start, cur_start, now = _period_bounds(days)

    cur_rate = visit_completion_rate(db, cur_start, now, employee_id)
    prev_rate = visit_completion_rate(db, prev_start, cur_start, employee_id)
    diff = round(cur_rate - prev_rate, 1)

    if prev_rate == 0 and cur_rate == 0:
        insights.append({
            "type": "completion_rate",
            "message": f"No visit activity recorded in the last {days} days yet.",
            "trend": "neutral",
        })
    else:
        direction = "increased" if diff >= 0 else "decreased"
        insights.append({
            "type": "completion_rate",
            "message": f"Your visit completion rate {direction} by {abs(diff)}% compared to the previous {days}-day period ({cur_rate}% vs {prev_rate}%).",
            "trend": "up" if diff > 0 else ("down" if diff < 0 else "neutral"),
            "current_value": cur_rate,
            "previous_value": prev_rate,
        })

    # Pending follow-ups
    fq = db.query(FollowUp).filter(FollowUp.status == FollowUpStatus.PENDING)
    if employee_id:
        fq = fq.filter(FollowUp.employee_id == employee_id)
    pending_count = fq.count()
    overdue_count = fq.filter(FollowUp.due_date < now).count()
    insights.append({
        "type": "follow_ups",
        "message": f"You currently have {pending_count} pending follow-up(s), including {overdue_count} overdue.",
        "trend": "down" if overdue_count > 0 else "neutral",
        "current_value": pending_count,
    })

    # Most visited customer category
    vq = (
        db.query(Customer.type, func.count(Visit.id).label("cnt"))
        .join(Visit, Visit.customer_id == Customer.id)
        .filter(Visit.scheduled_date >= cur_start, Visit.status == VisitStatus.COMPLETED)
    )
    if employee_id:
        vq = vq.filter(Visit.employee_id == employee_id)
    vq = vq.group_by(Customer.type).order_by(func.count(Visit.id).desc())
    top_category = vq.first()
    if top_category:
        cat_name = top_category[0].value if hasattr(top_category[0], "value") else top_category[0]
        insights.append({
            "type": "top_category",
            "message": f"'{cat_name.title()}' was your most frequently visited customer category in the last {days} days ({top_category[1]} visits).",
            "trend": "neutral",
        })

    # Visits today vs planned
    today_start = datetime(now.year, now.month, now.day)
    tq = db.query(Visit).filter(Visit.scheduled_date >= today_start)
    if employee_id:
        tq = tq.filter(Visit.employee_id == employee_id)
    today_total = tq.count()
    today_done = tq.filter(Visit.status == VisitStatus.COMPLETED).count()
    if today_total:
        insights.append({
            "type": "today_progress",
            "message": f"You've completed {today_done} of {today_total} visits scheduled for today.",
            "trend": "up" if today_done == today_total else "neutral",
        })

    return insights


def dashboard_summary(db: Session, employee_id: Optional[int] = None) -> Dict:
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    today_end = today_start + timedelta(days=1)

    emp_q = db.query(Employee)
    total_employees = emp_q.filter(Employee.is_active == True).count()  # noqa: E712

    cust_q = db.query(Customer).filter(Customer.is_active == True)  # noqa: E712
    if employee_id:
        cust_q = cust_q.filter(Customer.assigned_employee_id == employee_id)
    total_customers = cust_q.count()

    visit_q = db.query(Visit)
    if employee_id:
        visit_q = visit_q.filter(Visit.employee_id == employee_id)

    todays_visits = visit_q.filter(
        Visit.scheduled_date >= today_start, Visit.scheduled_date < today_end
    ).count()
    completed_today = visit_q.filter(
        Visit.scheduled_date >= today_start,
        Visit.scheduled_date < today_end,
        Visit.status == VisitStatus.COMPLETED,
    ).count()

    fu_q = db.query(FollowUp).filter(FollowUp.status == FollowUpStatus.PENDING)
    if employee_id:
        fu_q = fu_q.filter(FollowUp.employee_id == employee_id)
    pending_follow_ups = fu_q.count()
    overdue_follow_ups = fu_q.filter(FollowUp.due_date < now).count()

    completion_rate = visit_completion_rate(db, now - timedelta(days=30), now, employee_id)

    # Monthly visit trend (last 6 months)
    trend = []
    for i in range(5, -1, -1):
        month_ref = (now.replace(day=1) - timedelta(days=1)) if i == 0 else now
        # compute month start/end i months back
        year = now.year
        month = now.month - i
        while month <= 0:
            month += 12
            year -= 1
        m_start = datetime(year, month, 1)
        if month == 12:
            m_end = datetime(year + 1, 1, 1)
        else:
            m_end = datetime(year, month + 1, 1)
        mq = db.query(Visit).filter(Visit.scheduled_date >= m_start, Visit.scheduled_date < m_end)
        if employee_id:
            mq = mq.filter(Visit.employee_id == employee_id)
        trend.append({
            "month": m_start.strftime("%b %Y"),
            "total": mq.count(),
            "completed": mq.filter(Visit.status == VisitStatus.COMPLETED).count(),
        })

    # Customer distribution by type
    dist_q = db.query(Customer.type, func.count(Customer.id)).filter(Customer.is_active == True)  # noqa: E712
    if employee_id:
        dist_q = dist_q.filter(Customer.assigned_employee_id == employee_id)
    dist_q = dist_q.group_by(Customer.type).all()
    distribution = [
        {"type": (t.value if hasattr(t, "value") else t), "count": c} for t, c in dist_q
    ]

    return {
        "total_employees": total_employees,
        "total_customers": total_customers,
        "todays_visits": todays_visits,
        "completed_today": completed_today,
        "pending_follow_ups": pending_follow_ups,
        "overdue_follow_ups": overdue_follow_ups,
        "visit_completion_rate": completion_rate,
        "monthly_trend": trend,
        "customer_distribution": distribution,
    }
