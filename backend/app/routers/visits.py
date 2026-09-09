from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Visit, Customer, Employee, User, VisitStatus, VisitOutcome
from app.schemas.schemas import VisitCreate, VisitOut, VisitCheckOut, VisitUpdate
from app.core.security import get_current_user
from app.services.notes_analyzer import analyze_note

router = APIRouter(prefix="/api/visits", tags=["Visits"])


def _to_out(v: Visit) -> VisitOut:
    return VisitOut(
        id=v.id,
        employee_id=v.employee_id,
        customer_id=v.customer_id,
        customer_name=v.customer.name if v.customer else None,
        employee_name=v.employee.user.name if v.employee else None,
        scheduled_date=v.scheduled_date,
        check_in_time=v.check_in_time,
        check_out_time=v.check_out_time,
        status=v.status.value if hasattr(v.status, "value") else v.status,
        outcome=v.outcome.value if hasattr(v.outcome, "value") else v.outcome,
        notes=v.notes,
        sentiment=v.sentiment,
        requires_follow_up=v.requires_follow_up,
        keywords=v.keywords,
    )


@router.get("", response_model=List[VisitOut])
def list_visits(
    employee_id: Optional[int] = None,
    status: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Visit)
    if employee_id:
        q = q.filter(Visit.employee_id == employee_id)
    if status:
        q = q.filter(Visit.status == status)
    if date_from:
        q = q.filter(Visit.scheduled_date >= date_from)
    if date_to:
        q = q.filter(Visit.scheduled_date <= date_to)
    visits = q.order_by(Visit.scheduled_date.desc()).all()
    return [_to_out(v) for v in visits]


@router.get("/{visit_id}", response_model=VisitOut)
def get_visit(visit_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    v = db.query(Visit).filter(Visit.id == visit_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Visit not found")
    return _to_out(v)


@router.post("", response_model=VisitOut)
def create_visit(payload: VisitCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not db.query(Customer).filter(Customer.id == payload.customer_id).first():
        raise HTTPException(status_code=404, detail="Customer not found")
    if not db.query(Employee).filter(Employee.id == payload.employee_id).first():
        raise HTTPException(status_code=404, detail="Employee not found")
    v = Visit(
        employee_id=payload.employee_id,
        customer_id=payload.customer_id,
        scheduled_date=payload.scheduled_date,
        status=VisitStatus.PLANNED,
    )
    db.add(v)
    db.commit()
    db.refresh(v)
    return _to_out(v)


@router.put("/{visit_id}", response_model=VisitOut)
def update_visit(visit_id: int, payload: VisitUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    v = db.query(Visit).filter(Visit.id == visit_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Visit not found")
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        if value is not None:
            setattr(v, field, value)
    db.commit()
    db.refresh(v)
    return _to_out(v)


@router.post("/{visit_id}/check-in", response_model=VisitOut)
def check_in(visit_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    v = db.query(Visit).filter(Visit.id == visit_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Visit not found")
    if v.check_in_time:
        raise HTTPException(status_code=400, detail="Already checked in")
    v.check_in_time = datetime.utcnow()
    v.status = VisitStatus.IN_PROGRESS
    db.commit()
    db.refresh(v)
    return _to_out(v)


@router.post("/{visit_id}/check-out", response_model=VisitOut)
def check_out(visit_id: int, payload: VisitCheckOut, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    v = db.query(Visit).filter(Visit.id == visit_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Visit not found")
    if not v.check_in_time:
        raise HTTPException(status_code=400, detail="Must check in before checking out")
    if v.check_out_time:
        raise HTTPException(status_code=400, detail="Already checked out")

    v.check_out_time = datetime.utcnow()
    v.status = VisitStatus.COMPLETED
    v.notes = payload.notes
    try:
        v.outcome = VisitOutcome(payload.outcome) if payload.outcome else VisitOutcome.NO_OUTCOME
    except ValueError:
        v.outcome = VisitOutcome.NO_OUTCOME

    if payload.notes:
        nlp = analyze_note(payload.notes)
        v.sentiment = nlp["sentiment"]
        v.requires_follow_up = nlp["requires_follow_up"]
        v.keywords = ", ".join(nlp["keywords"])

    db.commit()
    db.refresh(v)
    return _to_out(v)


@router.delete("/{visit_id}")
def delete_visit(visit_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    v = db.query(Visit).filter(Visit.id == visit_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Visit not found")
    db.delete(v)
    db.commit()
    return {"message": "Visit deleted"}
