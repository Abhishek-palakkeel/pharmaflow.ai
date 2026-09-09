"""
Seed the SQLite database with realistic demo data so the dashboard looks
populated immediately after running the app for the first time.
"""
import random
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.database import SessionLocal, engine, Base
from app.models import models as m
from app.core.security import hash_password

TERRITORIES = ["North Zone", "South Zone", "East Zone", "West Zone", "Central Zone"]

DOCTOR_NAMES = [
    "Dr. Anil Sharma", "Dr. Priya Nair", "Dr. Rajesh Kumar", "Dr. Meera Iyer",
    "Dr. Sanjay Gupta", "Dr. Kavita Menon", "Dr. Arjun Reddy", "Dr. Neha Verma",
    "Dr. Vikram Singh", "Dr. Anjali Rao",
]
SPECIALTIES = ["Cardiology", "General Medicine", "Pediatrics", "Orthopedics", "Dermatology", "ENT"]

HOSPITAL_NAMES = [
    "City Care Hospital", "Sunrise Multispecialty Hospital", "Green Valley Medical Center",
    "Lifeline General Hospital", "Metro Health Institute",
]
CHEMIST_NAMES = [
    "Apollo Pharmacy", "MedPlus Chemist", "Wellness Drug Store", "HealthFirst Pharmacy",
    "CarePoint Chemist", "TrustMed Pharmacy",
]
DISTRIBUTOR_NAMES = [
    "Pioneer Pharma Distributors", "National Medical Supplies", "Reliance Drug Distribution",
]

EMPLOYEES = [
    {"name": "Aditya Kapoor", "email": "aditya.kapoor@pharmaflow.ai"},
    {"name": "Sneha Joshi", "email": "sneha.joshi@pharmaflow.ai"},
    {"name": "Rohit Malhotra", "email": "rohit.malhotra@pharmaflow.ai"},
    {"name": "Divya Pillai", "email": "divya.pillai@pharmaflow.ai"},
    {"name": "Karan Chatterjee", "email": "karan.chatterjee@pharmaflow.ai"},
]

VISIT_NOTES_POOL = {
    "positive": [
        "Doctor was very receptive and impressed with the new product samples. Prescribing has increased.",
        "Great meeting, pharmacy owner is satisfied with stock levels and agreed to a bigger order next month.",
        "Positive discussion, doctor is confident about the product efficacy and will recommend to patients.",
        "Very productive visit. Hospital procurement team is happy with our service and pricing.",
    ],
    "neutral": [
        "Standard visit, discussed product portfolio. Will need to follow up next month.",
        "Met with staff pharmacist, shared brochure, awaiting feedback on new formulation.",
        "Routine check-in, no major updates. Doctor requested more literature.",
    ],
    "negative": [
        "Doctor raised concerns about side effects reported by patients. Needs urgent follow up.",
        "Pharmacy reported stock shortage issue last month, still frustrated about delayed delivery.",
        "Client was unhappy about pricing and threatened to switch to a competitor. Requires follow-up call.",
        "Complaint about unresponsive support team, doctor was disappointed with service quality.",
    ],
}


def _random_recent_datetime(days_back_min: int, days_back_max: int) -> datetime:
    days_back = random.randint(days_back_min, days_back_max)
    dt = datetime.utcnow() - timedelta(days=days_back)
    return dt.replace(hour=random.randint(9, 17), minute=random.choice([0, 15, 30, 45]))


def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        if db.query(m.User).count() > 0:
            print("Database already seeded, skipping.")
            return

        print("Seeding database with demo data...")

        # --- Admin ---
        admin_user = m.User(
            name="System Administrator",
            email="admin@pharmaflow.ai",
            hashed_password=hash_password("Admin@123"),
            role=m.UserRole.ADMIN,
        )
        db.add(admin_user)
        db.flush()

        # --- Employees ---
        employees = []
        for i, e in enumerate(EMPLOYEES):
            user = m.User(
                name=e["name"],
                email=e["email"],
                hashed_password=hash_password("Employee@123"),
                role=m.UserRole.EMPLOYEE,
            )
            db.add(user)
            db.flush()
            emp = m.Employee(
                user_id=user.id,
                employee_code=f"EMP{i + 1:04d}",
                phone=f"98765{40000 + i}",
                territory=TERRITORIES[i % len(TERRITORIES)],
                designation="Senior Medical Representative" if i < 2 else "Medical Representative",
                joining_date=datetime.utcnow() - timedelta(days=random.randint(180, 900)),
            )
            db.add(emp)
            db.flush()
            employees.append(emp)

        # --- Customers ---
        customers = []

        for i, name in enumerate(DOCTOR_NAMES):
            c = m.Customer(
                name=name,
                type=m.CustomerType.DOCTOR,
                specialty=random.choice(SPECIALTIES),
                phone=f"90000{10000 + i}",
                email=f"{name.split()[-1].lower()}{i}@clinic.com",
                address=f"{random.randint(1, 200)} MG Road",
                territory=TERRITORIES[i % len(TERRITORIES)],
                assigned_employee_id=employees[i % len(employees)].id,
            )
            db.add(c)
            customers.append(c)

        for i, name in enumerate(HOSPITAL_NAMES):
            c = m.Customer(
                name=name,
                type=m.CustomerType.HOSPITAL,
                phone=f"90111{10000 + i}",
                email=f"contact{i}@hospital.com",
                address=f"{random.randint(1, 200)} Ring Road",
                territory=TERRITORIES[i % len(TERRITORIES)],
                assigned_employee_id=employees[i % len(employees)].id,
            )
            db.add(c)
            customers.append(c)

        for i, name in enumerate(CHEMIST_NAMES):
            c = m.Customer(
                name=name,
                type=m.CustomerType.CHEMIST,
                phone=f"90222{10000 + i}",
                email=f"chemist{i}@shop.com",
                address=f"{random.randint(1, 200)} Market Street",
                territory=TERRITORIES[i % len(TERRITORIES)],
                assigned_employee_id=employees[i % len(employees)].id,
            )
            db.add(c)
            customers.append(c)

        for i, name in enumerate(DISTRIBUTOR_NAMES):
            c = m.Customer(
                name=name,
                type=m.CustomerType.DISTRIBUTOR,
                phone=f"90333{10000 + i}",
                email=f"distributor{i}@supply.com",
                address=f"{random.randint(1, 200)} Industrial Area",
                territory=TERRITORIES[i % len(TERRITORIES)],
                assigned_employee_id=employees[i % len(employees)].id,
            )
            db.add(c)
            customers.append(c)

        db.flush()

        # --- Historical visits (last 6 months) ---
        outcomes = [m.VisitOutcome.POSITIVE, m.VisitOutcome.NEUTRAL, m.VisitOutcome.NEGATIVE]
        all_visits = []
        for customer in customers:
            emp = next((e for e in employees if e.id == customer.assigned_employee_id), employees[0])
            num_visits = random.randint(3, 12)
            for _ in range(num_visits):
                scheduled = _random_recent_datetime(1, 180)
                status_choice = random.choices(
                    [m.VisitStatus.COMPLETED, m.VisitStatus.MISSED, m.VisitStatus.PLANNED],
                    weights=[75, 10, 15],
                )[0]

                visit = m.Visit(
                    employee_id=emp.id,
                    customer_id=customer.id,
                    scheduled_date=scheduled,
                    status=status_choice,
                )

                if status_choice == m.VisitStatus.COMPLETED:
                    check_in = scheduled
                    check_out = scheduled + timedelta(minutes=random.randint(15, 60))
                    visit.check_in_time = check_in
                    visit.check_out_time = check_out
                    outcome = random.choices(outcomes, weights=[50, 30, 20])[0]
                    visit.outcome = outcome
                    sentiment_key = outcome.value if outcome != m.VisitOutcome.POSITIVE else "positive"
                    if outcome == m.VisitOutcome.NEGATIVE:
                        sentiment_key = "negative"
                    elif outcome == m.VisitOutcome.NEUTRAL:
                        sentiment_key = "neutral"
                    else:
                        sentiment_key = "positive"
                    note = random.choice(VISIT_NOTES_POOL[sentiment_key])
                    visit.notes = note
                    visit.sentiment = sentiment_key
                    visit.requires_follow_up = sentiment_key == "negative" or random.random() < 0.3
                    from app.services.notes_analyzer import analyze_note
                    kw = analyze_note(note)["keywords"]
                    visit.keywords = ", ".join(kw)

                db.add(visit)
                all_visits.append(visit)

        # Ensure some visits scheduled for TODAY (mix of completed / planned)
        for i, customer in enumerate(customers[:8]):
            emp = next((e for e in employees if e.id == customer.assigned_employee_id), employees[0])
            today = datetime.utcnow().replace(hour=9 + i % 6, minute=0, second=0, microsecond=0)
            status_choice = m.VisitStatus.COMPLETED if i % 2 == 0 else m.VisitStatus.PLANNED
            visit = m.Visit(
                employee_id=emp.id,
                customer_id=customer.id,
                scheduled_date=today,
                status=status_choice,
            )
            if status_choice == m.VisitStatus.COMPLETED:
                visit.check_in_time = today
                visit.check_out_time = today + timedelta(minutes=30)
                visit.outcome = m.VisitOutcome.POSITIVE
                visit.notes = random.choice(VISIT_NOTES_POOL["positive"])
                visit.sentiment = "positive"
            db.add(visit)
            all_visits.append(visit)

        db.flush()

        # --- Follow-ups ---
        follow_up_reasons = [
            "Send updated product brochure", "Discuss pricing for bulk order",
            "Address side-effect concern raised by doctor", "Resolve stock shortage complaint",
            "Share clinical trial data", "Confirm order quantity for next month",
            "Follow up on sample feedback", "Schedule product training session",
        ]
        for customer in customers:
            emp = next((e for e in employees if e.id == customer.assigned_employee_id), employees[0])
            num_follow_ups = random.randint(0, 3)
            for _ in range(num_follow_ups):
                # Mix of overdue, today, upcoming
                bucket_choice = random.choices(["overdue", "today", "upcoming"], weights=[30, 15, 55])[0]
                if bucket_choice == "overdue":
                    due = datetime.utcnow() - timedelta(days=random.randint(1, 15))
                elif bucket_choice == "today":
                    due = datetime.utcnow().replace(hour=random.randint(10, 18), minute=0)
                else:
                    due = datetime.utcnow() + timedelta(days=random.randint(1, 20))

                status = m.FollowUpStatus.PENDING
                if bucket_choice == "upcoming" and random.random() < 0.2:
                    status = m.FollowUpStatus.COMPLETED

                fu = m.FollowUp(
                    employee_id=emp.id,
                    customer_id=customer.id,
                    due_date=due,
                    reason=random.choice(follow_up_reasons),
                    status=status,
                )
                db.add(fu)

        # --- Work plans (last 2 weeks + upcoming week) ---
        for emp in employees:
            emp_customers = [c for c in customers if c.assigned_employee_id == emp.id]
            for day_offset in range(-7, 4):
                plan_date = datetime.utcnow() + timedelta(days=day_offset)
                plan_date = plan_date.replace(hour=9, minute=0, second=0, microsecond=0)
                wp = m.WorkPlan(
                    employee_id=emp.id,
                    plan_date=plan_date,
                    title=f"Field visit plan - {plan_date.strftime('%d %b')}",
                    notes="Cover assigned customers in territory",
                    is_completed=day_offset < 0,
                )
                db.add(wp)
                db.flush()
                sample = random.sample(emp_customers, min(len(emp_customers), random.randint(1, 3))) if emp_customers else []
                for c in sample:
                    db.add(m.WorkPlanCustomer(work_plan_id=wp.id, customer_id=c.id))

        db.commit()
        print(f"Seed complete: 1 admin, {len(employees)} employees, {len(customers)} customers, "
              f"{len(all_visits)} visits.")

        # Pre-train the ML model so first API call is instant
        from app.services.ml_priority_model import train_model
        train_model(force=True)
        print("ML priority model trained and cached.")

    except Exception as exc:
        db.rollback()
        raise exc
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
