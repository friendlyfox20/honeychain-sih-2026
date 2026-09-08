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
| **Security & Auth** | Argon2/Bcrypt password hashing, JWT Bearer tokens, Role-Based Access Control (RBAC) |
| **Testing & Quality** | Pytest (136 unit & integration tests), Oxlint, TypeScript strict checks |

---

## 🚀 Quick Start (One-Command Setup & Launch)

You can clone and launch the entire platform across **Windows**, **macOS**, or **Linux**:

```bash
# 1. Clone the repository
git clone https://github.com/friendlyfox20/honeychain-sih-2026.git
cd honeychain-sih-2026
```

### 🍎 Linux & macOS

```bash
# Make scripts executable and run automated setup
chmod +x setup.sh start.sh
./setup.sh

# Start both services
./start.sh
```

### 🪟 Windows (Command Prompt / Batch)

```cmd
:: 1. Run automated setup (installs Python venv, node packages, seeds users)
setup.bat

:: 2. Start both services in concurrent console windows
start.bat
```

### 💻 Windows (PowerShell)

```powershell
# If scripts are blocked by execution policy, run:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# 1. Run automated setup
.\setup.ps1

# 2. Start both services
.\start.ps1
```

Once running:
- **FastAPI Backend**: `http://localhost:8000` (API Docs: `http://localhost:8000/docs`)
- **Vite React Frontend**: `http://localhost:5173`

---

## 👥 Pre-Seeded Demo User Accounts

The database automatically initializes and pre-seeds standardized demo accounts on first boot. All roles share the default password **`password123`**:

| Role | Email | Password | Primary Permissions & Responsibilities |
| :--- | :--- | :--- | :--- |
| **Beekeeper** | `beekeeper@honeychain.com` | `password123` | Hive registration, initial batch creation, harvest events, yield queries |
| **Collector** | `collector@honeychain.com` | `password123` | Hub collection events, transit check-ins, bulk transport logs |
| **Processor** | `processor@honeychain.com` | `password123` | Micro-filtration, batch split/merge transformations, reconciliation |
| **Lab Analyst** | `lab@honeychain.com` | `password123` | Quality assays, moisture/HMF testing, adulteration compliance |
| **Administrator** | `admin@honeychain.com` | `password123` | System-wide analytics, audit logs, node health, blockchain audit |

> 💡 **Self-Healing Authentication**: If the user table is empty, the FastAPI backend automatically auto-seeds these 5 accounts upon startup. You will never encounter missing credentials out-of-the-box.

---

## 💻 Manual Step-by-Step Setup

If you prefer configuring components manually or want fine-grained control:

### Step 1: Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On Linux / macOS:
source venv/bin/activate
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Windows (Command Prompt):
.\venv\Scripts\activate.bat

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Initialize environment variables
cp .env.example .env     # On Windows CMD: copy .env.example .env

# Initialize database and verify demo user accounts
python seed_demo_data.py

# Optional: Seed reference full-cycle batch (requires server running)
# python seed_demo_batch.py

# Launch FastAPI backend standalone
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Step 2: Frontend Setup

```bash
cd frontend

# Install Node packages
npm install

# Run Vite dev server standalone
npm run dev -- --host 127.0.0.1 --port 5173
```

---

## 🌐 Application URLs & Endpoints

| Portal | URL | Description |
| :--- | :--- | :--- |
| **Web Application** | `http://localhost:5173` | Unified stakeholder web dashboard |
| **Interactive API Docs** | `http://localhost:8000/docs` | Swagger UI with OpenAPI 3.0 schema and Bearer authorization |
| **Alternative API Docs** | `http://localhost:8000/redoc` | Redoc interface for backend route documentation |
| **Backend Health Check**| `http://localhost:8000/health`| Live JSON system status |
| **Public Verification** | `http://localhost:5173/verify/57qFBfbWwG1sjgcEwpJuw0zwdq89V7kpAlORLmhcG-o` | Consumer QR verification portal (no login needed) |

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

> 🛡️ **Test Isolation**: The test suite automatically redirects database operations to an isolated SQLite database (`honeychain_test.db`), ensuring running tests **never** wipes or modifies your local development database.

### Frontend Build & Linting
Validate TypeScript types and compile the production bundle:
```bash
cd frontend
npm run build
npm run lint
```

---

## 🔧 Common Troubleshooting & FAQ

### 1. "Invalid email address or password" on Login
- Ensure you are using `password123` as the password.
- Verify the backend is running on `http://127.0.0.1:8000`.
- To manually re-seed all 5 demo accounts at any time:
  ```bash
  cd backend
  python seed_demo_data.py
  ```

### 2. `[Errno 98] Address already in use` (Port 8000 or 5173 busy)
- `start.sh`, `start.bat`, and `start.ps1` automatically detect and terminate stale listeners on ports 8000 and 5173.
- To manually kill port 8000:
  - **Linux**: `fuser -k 8000/tcp` or `lsof -ti:8000 | xargs kill -9`
  - **macOS**: `lsof -ti:8000 | xargs kill -9`
  - **Windows**: `for /f "tokens=5" %a in ('netstat -aon ^| findstr :8000') do taskkill /f /pid %a`

### 3. Windows PowerShell Script Execution Policy
If PowerShell errors with `File cannot be loaded because running scripts is disabled on this system`:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```
Then rerun `.\setup.ps1` or `.\start.ps1`.

---

## 📁 Repository Structure

```text
honeychain-sih-2026/
├── backend/
│   ├── app/
│   │   ├── api/routes/          # Versioned REST API routes (/auth, /batches, /anomaly, etc.)
│   │   ├── core/                # Configuration, JWT security, RBAC dependencies
│   │   ├── db/                  # Database engine, SQLite URI resolver & session management
│   │   ├── models/              # SQLAlchemy 2.0 ORM models
│   │   ├── schemas/             # Pydantic v2 schemas
│   │   └── services/            # Business logic, ML loaders, blockchain anchor, voice engine
│   ├── alembic/                 # Database migrations
│   ├── tests/                   # 136 Pytest test cases (isolated test runner)
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
├── start.sh                     # One-command dual service launcher (Linux & macOS)
├── setup.bat                    # Automated setup script (Windows CMD)
├── start.bat                    # One-command launcher (Windows CMD)
├── setup.ps1                    # Automated setup script (Windows PowerShell)
├── start.ps1                    # One-command launcher (Windows PowerShell)
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
