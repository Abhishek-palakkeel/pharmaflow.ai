from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict


# ---------- Auth ----------
class LoginRequest(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str
    user_id: int


# ---------- User / Employee ----------
class EmployeeCreate(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = None
    territory: str
    designation: Optional[str] = "Medical Representative"


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    territory: Optional[str] = None
    designation: Optional[str] = None
    is_active: Optional[bool] = None


class EmployeeOut(BaseModel):
    id: int
    employee_code: str
    name: str
    email: str
    phone: Optional[str] = None
    territory: str
    designation: str
    is_active: bool
    joining_date: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------- Customer ----------
class CustomerCreate(BaseModel):
    name: str
    type: str
    specialty: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    territory: str
    assigned_employee_id: Optional[int] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    specialty: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    territory: Optional[str] = None
    assigned_employee_id: Optional[int] = None
    is_active: Optional[bool] = None


class CustomerOut(BaseModel):
    id: int
    name: str
    type: str
    specialty: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    territory: str
    assigned_employee_id: Optional[int] = None
    priority_tier: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


# ---------- Work Plan ----------
class WorkPlanCreate(BaseModel):
    employee_id: int
    plan_date: datetime
    title: str
    notes: Optional[str] = None
    customer_ids: List[int] = []


class WorkPlanOut(BaseModel):
    id: int
    employee_id: int
    plan_date: datetime
    title: str
    notes: Optional[str] = None
    is_completed: bool
    customer_ids: List[int] = []

    model_config = ConfigDict(from_attributes=True)


# ---------- Visit ----------
class VisitCreate(BaseModel):
    employee_id: int
    customer_id: int
    scheduled_date: datetime


class VisitCheckIn(BaseModel):
    pass


class VisitCheckOut(BaseModel):
    notes: Optional[str] = None
    outcome: Optional[str] = "no_outcome"


class VisitUpdate(BaseModel):
    status: Optional[str] = None
    outcome: Optional[str] = None
    notes: Optional[str] = None
    scheduled_date: Optional[datetime] = None


class VisitOut(BaseModel):
    id: int
    employee_id: int
    customer_id: int
    customer_name: Optional[str] = None
    employee_name: Optional[str] = None
    scheduled_date: datetime
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    status: str
    outcome: str
    notes: Optional[str] = None
    sentiment: Optional[str] = None
    requires_follow_up: bool
    keywords: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ---------- Follow up ----------
class FollowUpCreate(BaseModel):
    employee_id: int
    customer_id: int
    visit_id: Optional[int] = None
    due_date: datetime
    reason: str
    notes: Optional[str] = None


class FollowUpUpdate(BaseModel):
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    reason: Optional[str] = None
    notes: Optional[str] = None


class FollowUpOut(BaseModel):
    id: int
    employee_id: int
    customer_id: int
    customer_name: Optional[str] = None
    visit_id: Optional[int] = None
    due_date: datetime
    reason: str
    status: str
    notes: Optional[str] = None
    bucket: Optional[str] = None  # overdue/today/upcoming

    model_config = ConfigDict(from_attributes=True)
