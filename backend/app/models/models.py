import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum
)
from sqlalchemy.orm import relationship
from app.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    EMPLOYEE = "employee"


class CustomerType(str, enum.Enum):
    DOCTOR = "doctor"
    HOSPITAL = "hospital"
    CHEMIST = "chemist"
    DISTRIBUTOR = "distributor"


class VisitStatus(str, enum.Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    MISSED = "missed"


class VisitOutcome(str, enum.Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"
    NO_OUTCOME = "no_outcome"


class FollowUpStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.EMPLOYEE, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee", back_populates="user", uselist=False)


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    employee_code = Column(String, unique=True, nullable=False)
    phone = Column(String)
    territory = Column(String, nullable=False)
    designation = Column(String, default="Medical Representative")
    joining_date = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="employee")
    visits = relationship("Visit", back_populates="employee")
    work_plans = relationship("WorkPlan", back_populates="employee")
    follow_ups = relationship("FollowUp", back_populates="employee")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(Enum(CustomerType), nullable=False)
    specialty = Column(String, nullable=True)
    phone = Column(String)
    email = Column(String)
    address = Column(String)
    territory = Column(String, nullable=False)
    assigned_employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    priority_tier = Column(String, default="Medium")  # High / Medium / Low (cached)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    assigned_employee = relationship("Employee")
    visits = relationship("Visit", back_populates="customer")
    follow_ups = relationship("FollowUp", back_populates="customer")


class WorkPlan(Base):
    __tablename__ = "work_plans"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    plan_date = Column(DateTime, nullable=False)
    title = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee", back_populates="work_plans")
    customers = relationship("WorkPlanCustomer", back_populates="work_plan")


class WorkPlanCustomer(Base):
    __tablename__ = "work_plan_customers"

    id = Column(Integer, primary_key=True, index=True)
    work_plan_id = Column(Integer, ForeignKey("work_plans.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)

    work_plan = relationship("WorkPlan", back_populates="customers")
    customer = relationship("Customer")


class Visit(Base):
    __tablename__ = "visits"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    scheduled_date = Column(DateTime, nullable=False)
    check_in_time = Column(DateTime, nullable=True)
    check_out_time = Column(DateTime, nullable=True)
    status = Column(Enum(VisitStatus), default=VisitStatus.PLANNED)
    outcome = Column(Enum(VisitOutcome), default=VisitOutcome.NO_OUTCOME)
    notes = Column(Text, nullable=True)
    sentiment = Column(String, nullable=True)  # positive/neutral/negative
    requires_follow_up = Column(Boolean, default=False)
    keywords = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee", back_populates="visits")
    customer = relationship("Customer", back_populates="visits")


class FollowUp(Base):
    __tablename__ = "follow_ups"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=True)
    due_date = Column(DateTime, nullable=False)
    reason = Column(String, nullable=False)
    status = Column(Enum(FollowUpStatus), default=FollowUpStatus.PENDING)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee", back_populates="follow_ups")
    customer = relationship("Customer", back_populates="follow_ups")
    visit = relationship("Visit")
