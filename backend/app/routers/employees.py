from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Employee, User, UserRole
from app.schemas.schemas import EmployeeCreate, EmployeeUpdate, EmployeeOut
from app.core.security import require_admin, get_current_user, hash_password

router = APIRouter(prefix="/api/employees", tags=["Employees"])


def _to_out(emp: Employee) -> EmployeeOut:
    return EmployeeOut(
        id=emp.id,
        employee_code=emp.employee_code,
        name=emp.user.name,
        email=emp.user.email,
        phone=emp.phone,
        territory=emp.territory,
        designation=emp.designation,
        is_active=emp.is_active,
        joining_date=emp.joining_date,
    )


@router.get("", response_model=List[EmployeeOut])
def list_employees(
    search: Optional[str] = None,
    territory: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Employee)
    if territory:
        q = q.filter(Employee.territory == territory)
    employees = q.all()
    result = [_to_out(e) for e in employees]
    if search:
        s = search.lower()
        result = [e for e in result if s in e.name.lower() or s in e.employee_code.lower()]
    return result


@router.get("/{employee_id}", response_model=EmployeeOut)
def get_employee(employee_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return _to_out(emp)


@router.post("", response_model=EmployeeOut)
def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=UserRole.EMPLOYEE,
    )
    db.add(user)
    db.flush()

    count = db.query(Employee).count()
    employee_code = f"EMP{count + 1:04d}"

    emp = Employee(
        user_id=user.id,
        employee_code=employee_code,
        phone=payload.phone,
        territory=payload.territory,
        designation=payload.designation or "Medical Representative",
    )
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return _to_out(emp)


@router.put("/{employee_id}", response_model=EmployeeOut)
def update_employee(employee_id: int, payload: EmployeeUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    data = payload.model_dump(exclude_unset=True)
    if "name" in data and data["name"]:
        emp.user.name = data["name"]
    for field in ["phone", "territory", "designation", "is_active"]:
        if field in data and data[field] is not None:
            setattr(emp, field, data[field])

    db.commit()
    db.refresh(emp)
    return _to_out(emp)


@router.delete("/{employee_id}")
def delete_employee(employee_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    emp.is_active = False
    emp.user.is_active = False
    db.commit()
    return {"message": "Employee deactivated"}
