from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Customer, User, CustomerType
from app.schemas.schemas import CustomerCreate, CustomerUpdate, CustomerOut
from app.core.security import require_admin, get_current_user

router = APIRouter(prefix="/api/customers", tags=["Customers"])


@router.get("", response_model=List[CustomerOut])
def list_customers(
    search: Optional[str] = None,
    type: Optional[str] = None,
    territory: Optional[str] = None,
    assigned_employee_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Customer).filter(Customer.is_active == True)  # noqa: E712
    if type:
        q = q.filter(Customer.type == type)
    if territory:
        q = q.filter(Customer.territory == territory)
    if assigned_employee_id:
        q = q.filter(Customer.assigned_employee_id == assigned_employee_id)
    customers = q.all()
    if search:
        s = search.lower()
        customers = [c for c in customers if s in c.name.lower()]
    return customers


@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    return c


@router.post("", response_model=CustomerOut)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    c = Customer(**payload.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(customer_id: int, payload: CustomerUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        if value is not None:
            setattr(c, field, value)
    db.commit()
    db.refresh(c)
    return c


@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    c.is_active = False
    db.commit()
    return {"message": "Customer deactivated"}
