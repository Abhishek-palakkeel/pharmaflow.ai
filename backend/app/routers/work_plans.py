from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import WorkPlan, WorkPlanCustomer, User
from app.schemas.schemas import WorkPlanCreate, WorkPlanOut
from app.core.security import get_current_user

router = APIRouter(prefix="/api/work-plans", tags=["Work Plans"])


def _to_out(wp: WorkPlan) -> WorkPlanOut:
    return WorkPlanOut(
        id=wp.id,
        employee_id=wp.employee_id,
        plan_date=wp.plan_date,
        title=wp.title,
        notes=wp.notes,
        is_completed=wp.is_completed,
        customer_ids=[wpc.customer_id for wpc in wp.customers],
    )


@router.get("", response_model=List[WorkPlanOut])
def list_work_plans(
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(WorkPlan)
    if employee_id:
        q = q.filter(WorkPlan.employee_id == employee_id)
    plans = q.order_by(WorkPlan.plan_date.desc()).all()
    return [_to_out(p) for p in plans]


@router.post("", response_model=WorkPlanOut)
def create_work_plan(payload: WorkPlanCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    wp = WorkPlan(
        employee_id=payload.employee_id,
        plan_date=payload.plan_date,
        title=payload.title,
        notes=payload.notes,
    )
    db.add(wp)
    db.flush()
    for cid in payload.customer_ids:
        db.add(WorkPlanCustomer(work_plan_id=wp.id, customer_id=cid))
    db.commit()
    db.refresh(wp)
    return _to_out(wp)


@router.put("/{plan_id}/complete", response_model=WorkPlanOut)
def complete_work_plan(plan_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    wp = db.query(WorkPlan).filter(WorkPlan.id == plan_id).first()
    if not wp:
        raise HTTPException(status_code=404, detail="Work plan not found")
    wp.is_completed = True
    db.commit()
    db.refresh(wp)
    return _to_out(wp)


@router.delete("/{plan_id}")
def delete_work_plan(plan_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    wp = db.query(WorkPlan).filter(WorkPlan.id == plan_id).first()
    if not wp:
        raise HTTPException(status_code=404, detail="Work plan not found")
    db.query(WorkPlanCustomer).filter(WorkPlanCustomer.work_plan_id == plan_id).delete()
    db.delete(wp)
    db.commit()
    return {"message": "Work plan deleted"}
