# PharmaFlow AI

**Pharmaceutical Field Force & Business Management Platform** — an enterprise SaaS-style
system for managing medical representatives, doctors, hospitals, chemists, and
distributors, with genuinely working AI/ML features layered on top: an explainable
priority-scoring engine, a scikit-learn priority classifier, a visit recommendation
engine, real-data analytics, and a local NLP notes analyzer.

Built as an AI & Data Science portfolio project — full-stack, self-contained, and
runnable in minutes with no paid API keys.

![Python](https://img.shields.io/badge/Python-3.10+-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.115-teal) ![React](https://img.shields.io/badge/React-18-61DAFB) ![scikit--learn](https://img.shields.io/badge/scikit--learn-1.5-orange)

---

## ✨ Features

### Core platform
- JWT authentication with role-based access control (**Admin** / **Employee**)
- Employee management (create logins, assign territories)
- Customer management across **Doctors, Hospitals, Chemists, Distributors**
- Daily work planning with per-day customer assignment
- Visit lifecycle: schedule → **check-in** → **check-out** (with notes & outcome)
- Follow-up tracking bucketed into **Overdue / Today / Upcoming**
- Admin dashboard (org-wide) and Employee dashboard (territory-scoped)
- Real charts: monthly visit trend, customer distribution, follow-up pipeline

### AI / ML / Data Science
1. **Smart Customer Priority Model** — explainable 0–100 rule-based score using recency,
   overdue/pending follow-ups, customer category, visit frequency, and past outcomes.
   Every score comes with a plain-English breakdown of *why*.
2. **ML-Based Priority Prediction** — a `RandomForestClassifier` (scikit-learn) trained
   automatically on synthetic, rule-informed historical data at first startup. Returns
   predicted priority, confidence, and top contributing features. Cached with `joblib`
   so restarts are instant; retrainable from the UI.
3. **Smart Visit Recommendation Engine** — combines the rule-based score, ML prediction,
   follow-up urgency, and territory match to rank the top 5 customers an employee should
   visit next, each with an explanation.
4. **Data Analytics & Performance Insights** — computed entirely from real database
   records: visit completion rate vs. the previous period, pending/overdue follow-ups,
   and the most-visited customer category.
5. **Visit Notes NLP Analysis** — lightweight local keyword/lexicon-based sentiment
   detection, follow-up-requirement detection, and keyword extraction. No external API
   calls; the interface is designed so a Gemini/OpenAI/Ollama backend can be swapped in
   later without touching calling code.

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite, Tailwind CSS, React Router, Recharts, Lucide Icons |
| Backend | Python, FastAPI, SQLAlchemy, Pydantic, JWT (python-jose), bcrypt |
| ML/NLP | scikit-learn, pandas, numpy, joblib |
| Database | SQLite (swap the URL in `backend/app/core/config.py` for PostgreSQL later) |

---

## 📁 Project Structure

```
pharmaflow-ai/
├── backend/
│   ├── app/
│   │   ├── core/            # config, JWT/security
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── routers/         # FastAPI route modules
│   │   ├── services/        # AI/ML/analytics/NLP engines
│   │   │   ├── priority_engine.py
│   │   │   ├── ml_priority_model.py
│   │   │   ├── recommendation_engine.py
│   │   │   ├── analytics_engine.py
│   │   │   └── notes_analyzer.py
│   │   ├── seed.py          # demo data generator
│   │   ├── database.py
│   │   └── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/           # Dashboard, Employees, Customers, Visits, ...
│   │   ├── components/      # Sidebar, Topbar, Layout, Modal, Badge, ...
│   │   ├── context/         # AuthContext
│   │   └── api/             # axios client + endpoint functions
│   └── package.json
├── docs/
│   └── API.md
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

On first run, the backend automatically:
- Creates the SQLite database (`backend/pharmaflow.db`)
- Seeds it with 1 admin, 5 employees, 24 customers, and ~190 historical visits, plus follow-ups and work plans
- Trains and caches the ML priority model

API is now live at `http://localhost:8000`, with interactive docs at `http://localhost:8000/docs`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api` requests to
`http://localhost:8000` (see `vite.config.js`), so both servers must be running.

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@pharmaflow.ai` | `Admin@123` |
| Employee | `aditya.kapoor@pharmaflow.ai` | `Employee@123` |
| Employee | `sneha.joshi@pharmaflow.ai` | `Employee@123` |
| Employee | `rohit.malhotra@pharmaflow.ai` | `Employee@123` |
| Employee | `divya.pillai@pharmaflow.ai` | `Employee@123` |
| Employee | `karan.chatterjee@pharmaflow.ai` | `Employee@123` |

The login screen has one-click buttons to autofill the admin/employee demo accounts.

---

## 🧠 How the AI Features Work (Modularity Notes)

- `services/priority_engine.py` — pure, explainable scoring function. Swap in a real ML
  model by replacing `compute_customer_priority` while keeping its return shape.
- `services/ml_priority_model.py` — trains on synthetic-but-rule-informed data
  (`_generate_training_data`). Replace with real historical exports for production use;
  the feature list (`FEATURES`) and estimator can be changed independently of the API layer.
- `services/recommendation_engine.py` — combines rule-based + ML outputs; safe to
  re-weight or extend without touching the router.
- `services/notes_analyzer.py` — keyword/lexicon NLP with the exact same input/output
  contract (`{sentiment, requires_follow_up, keywords}`) that a real LLM call would need,
  making it a drop-in point for Gemini/OpenAI/Ollama later.

---

## 📄 License

This is a personal portfolio project. Free to use and adapt for learning purposes.
