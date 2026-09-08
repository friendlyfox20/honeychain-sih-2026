# 🍯 HoneyChain — SIH 2026 Honey Supply Chain Platform

> **Smart India Hackathon (SIH) 2026** — Production-ready, end-to-end Honey Supply Chain Traceability, Physico-Chemical Quality Verification, 2-Layer Anomaly Detection, Machine Learning Predictive Analytics, Blockchain Cryptographic Anchoring, and Voice Assistant Platform.

---

## 📌 System Architecture & Highlights

HoneyChain bridges physical beekeeping operations with state-of-the-art cryptographic verification and predictive AI:

- **Deterministic Layer-1 Physical Laws**: Strict mass conservation ($\text{Output} \le \text{Input}$) and FSSAI/Codex chemical safety standards (Moisture $< 20\%$, HMF $< 40\,\text{mg/kg}$). Physical reality always supersedes statistical inference.
- **Layer-2 Machine Learning & Predictions**:
  - **Yield Prediction**: Gradient-boosted XGBoost model forecasting apiary yield from meteorological and floral conditions.
  - **Daily Production**: Random Forest regressor forecasting continuous production velocity.
  - **Supply-Chain Anomaly Detection**: 2-layer engine combining rule-based heuristics with an uncalibrated Support Vector Classifier (SVC).
- **Blockchain Integrity Anchor**: Computes canonical deterministic SHA-256 state hashes of batch history to provide immutable audit trails and tamper detection without external gas fees.
- **Consumer Trust Portal**: Public, lightweight QR-verification interface (`/verify/:token`) that reveals certified origin, lab assays, and journey milestones to retail consumers with zero login requirement.
- **Natural Language Voice Assistant**: Web Speech API integration mapped to an intelligent backend intent engine for hands-free query resolution in apiaries and field hubs.
- **Enterprise RBAC**: Role-Based Access Control enforcing strict separation of duties across **Beekeepers**, **Collectors**, **Processors**, **Lab Analysts**, and **Administrators**.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend API** | Python 3.10+, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, SQLite / PostgreSQL |
| **Machine Learning** | Scikit-learn, XGBoost, Joblib, NumPy, Pandas |
| **Frontend UI** | React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts |
| **Security & Auth** | Argon2 password hashing, JWT Bearer tokens, Role-Based Access Control (RBAC) |
| **Testing & Quality** | Pytest (136 unit & integration tests), Oxlint, TypeScript strict checks |

---

## 🚀 Quick Start (Automated Setup & Launch)

You can clone and launch the entire platform in just two commands:

### 1. Clone the Repository
```bash
git clone https://github.com/friendlyfox20/honeychain-sih-2026.git
cd honeychain-sih-2026
```

### 2. Run Automated Setup (Linux & macOS)
```bash
chmod +x setup.sh start.sh
./setup.sh
```
`./setup.sh` will automatically:
1. Verify Python 3.10+ and Node.js 18+
2. Create the Python virtual environment in `backend/venv/`
3. Install all backend Python dependencies
4. Initialize the SQLite database and seed all demo user accounts
5. Install all frontend `npm` dependencies

### 3. Start Both Services
```bash
./start.sh
```
This boots:
- **FastAPI Backend** on `http://localhost:8000`
- **Vite React Frontend** on `http://localhost:5173`

Press `Ctrl+C` in your terminal at any time to cleanly stop both services.

---

## 💻 Manual Step-by-Step Setup

If you prefer to configure components manually, or are on **Windows**:

### Step 1: Backend Configuration

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On Linux / macOS:
source venv/bin/activate
# On Windows (PowerShell):
# .\venv\Scripts\Activate.ps1
# On Windows (Command Prompt):
# .\venv\Scripts\activate.bat

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Initialize environment variables
cp .env.example .env

# Initialize database and seed demo users
python seed_demo_data.py

# Optional: Launch backend server standalone
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Step 2: Frontend Configuration

```bash
cd frontend

# Install Node packages
npm install

# Optional: Run development server standalone
npm run dev -- --port 5173
```

---

## 👥 Pre-Seeded Demo User Accounts

The database comes pre-seeded with standardized demo credentials for every supply-chain stakeholder role.

| Role | Email | Password | Primary Permissions & Responsibilities |
| :--- | :--- | :--- | :--- |
| **Beekeeper** | `beekeeper@honeychain.com` | `password123` | Hive registration, initial batch creation, harvest events, yield queries |
| **Collector** | `collector@honeychain.com` | `password123` | Hub collection events, transit check-ins, bulk transport logs |
| **Processor** | `processor@honeychain.com` | `password123` | Micro-filtration, batch split/merge transformations, reconciliation |
| **Lab Analyst** | `lab@honeychain.com` | `password123` | Quality assays, moisture/HMF testing, adulteration compliance |
| **Administrator** | `admin@honeychain.com` | `password123` | System-wide analytics, audit logs, node health, blockchain audit |

---

## 🌐 Application URLs & Endpoints

| Portal | URL | Description |
| :--- | :--- | :--- |
| **Web Application** | `http://localhost:5173` | Unified stakeholder web dashboard |
| **Interactive API Docs** | `http://localhost:8000/docs` | Swagger UI with OpenAPI 3.0 schema and Bearer authorization |
| **Alternative API Docs** | `http://localhost:8000/redoc` | Redoc interface for backend route documentation |
| **Backend Health Check**| `http://localhost:8000/health`| Live JSON system status |
| **Public Verification** | `http://localhost:5173/verify/DEMO-TOKEN` | Consumer QR verification portal (no login needed) |

---

## 🧪 Testing & Validation

### Backend Test Suite (Pytest)
Run all 136 automated unit, security, and integration tests:
```bash
# From root directory:
./backend/venv/bin/pytest backend/tests -v

# Or from inside backend directory with active virtualenv:
cd backend
pytest tests -v
```

All 136 tests cover:
- Authentication & JWT RBAC (9 tests)
- Batches CRUD & Genealogy (11 tests)
- Supply Chain Events & Mass Reconciliation (9 tests)
- 2-Layer Anomaly Detection (9 tests)
- ML Yield & Production Predictions (3 tests)
- Lab Assays & Digital Evidence (2 tests)
- QR Code Verification & Revocation (13 tests)
- Blockchain SHA-256 Anchoring & Tamper Audits (18 tests)
- Voice Speech-to-Text & Intent Resolution (18 tests)
- Admin Analytics, Monitoring & Audit Logs (19 tests)
- Integration & End-to-End Security Checks (25 tests)

### Frontend Build & Linting
Validate TypeScript types and build bundle:
```bash
cd frontend
npm run build
npm run lint
```

---

## 📁 Repository Structure

```text
honeychain-sih-2026/
├── backend/
│   ├── app/
│   │   ├── api/routes/          # Versioned REST API routes (/auth, /batches, /anomaly, etc.)
│   │   ├── core/                # Configuration, JWT security, RBAC dependencies
│   │   ├── db/                  # Database engine & session management
│   │   ├── models/              # SQLAlchemy 2.0 ORM models
│   │   ├── schemas/             # Pydantic v2 schemas
│   │   └── services/            # Business logic, ML loaders, blockchain anchor, voice engine
│   ├── alembic/                 # Database migrations
│   ├── tests/                   # 136 Pytest test cases
│   ├── requirements.txt         # Python dependencies
│   ├── seed_demo_data.py        # Demo user account seeder
│   └── seed_demo_batch.py       # Reference batch & event seeder
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios/Fetch API client and typed endpoints
│   │   ├── auth/                # JWT AuthContext and ProtectedRoute wrappers
│   │   ├── components/          # Reusable UI component library (Button, Card, Badge, Modal, Alert)
│   │   ├── layouts/             # DashboardLayout with responsive sidebar & navigation
│   │   ├── pages/               # Dashboard, Batches, Anomalies, Predictions, Voice, Admin
│   │   └── types/               # TypeScript data contracts & interfaces
│   ├── package.json             # Frontend dependencies
│   └── vite.config.ts           # Vite configuration
├── models/                      # Pre-trained ML model joblib binaries & metadata
├── anomaly_data/                # Synthetic training & evaluation datasets
├── results/                     # Model performance curves, confusion matrices, and metrics
├── setup.sh                     # Automated setup script (Linux & macOS)
├── start.sh                     # One-command dual service launcher
├── .gitignore                   # Comprehensive ignore rules
└── README.md                    # Project documentation
```

---

## 🤝 Team Contribution Workflow

1. **Pull Latest Changes**:
   ```bash
   git checkout main
   git pull origin main
   ```
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit and Push**:
   ```bash
   git commit -m "feat: description of changes"
   git push origin feature/your-feature-name
   ```
4. **Open a Pull Request** against `main`.

---

## 📜 License & Acknowledgments

Developed for the **Smart India Hackathon (SIH) 2026**.  
Built with FastAPI, React, Scikit-learn, and Tailwind CSS.
