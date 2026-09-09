from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import FollowUp, User, FollowUpStatus
from app.schemas.schemas import FollowUpCreate, FollowUpUpdate, FollowUpOut
from app.core.security import get_current_user

router = APIRouter(prefix="/api/follow-ups", tags=["Follow-Ups"])


def _bucket(due_date: datetime, status: str) -> str:
    if status != "pending":
        return status
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    today_end = today_start + timedelta(days=1)
    if due_date < today_start:
        return "overdue"
    if today_start <= due_date < today_end:
        return "today"
    return "upcoming"


def _to_out(f: FollowUp) -> FollowUpOut:
    status = f.status.value if hasattr(f.status, "value") else f.status
    return FollowUpOut(
        id=f.id,
        employee_id=f.employee_id,
        customer_id=f.customer_id,
        customer_name=f.customer.name if f.customer else None,
        visit_id=f.visit_id,
        due_date=f.due_date,
        reason=f.reason,
        status=status,
        notes=f.notes,
        bucket=_bucket(f.due_date, status),
    )


@router.get("", response_model=List[FollowUpOut])
def list_follow_ups(
    employee_id: Optional[int] = None,
    bucket: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(FollowUp)
    if employee_id:
        q = q.filter(FollowUp.employee_id == employee_id)
    if status:
        q = q.filter(FollowUp.status == status)
    follow_ups = [_to_out(f) for f in q.order_by(FollowUp.due_date.asc()).all()]
    if bucket:
        follow_ups = [f for f in follow_ups if f.bucket == bucket]
    return follow_ups


@router.post("", response_model=FollowUpOut)
def create_follow_up(payload: FollowUpCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    f = FollowUp(**payload.model_dump())
    db.add(f)
    db.commit()
    db.refresh(f)
    return _to_out(f)


@router.put("/{follow_up_id}", response_model=FollowUpOut)
def update_follow_up(follow_up_id: int, payload: FollowUpUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    f = db.query(FollowUp).filter(FollowUp.id == follow_up_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        if value is not None:
            setattr(f, field, value)
    db.commit()
    db.refresh(f)
    return _to_out(f)


@router.delete("/{follow_up_id}")
def delete_follow_up(follow_up_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    f = db.query(FollowUp).filter(FollowUp.id == follow_up_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    db.delete(f)
    db.commit()
    return {"message": "Follow-up deleted"}
