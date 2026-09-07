# HoneyChain FastAPI Backend Foundation

Production-ready FastAPI backend for the **HoneyChain** honey traceability and trust platform (SIH 2026).

It integrates pre-trained machine learning models for Honey Yield Prediction, Daily Production Prediction, 2-Layer Supply-Chain Anomaly Detection, database management, JWT Authentication, RBAC, Advanced Batch Genealogy & Traceability, QR Code Public Consumer Verification, Voice Backend with Speech-to-Text & Intent Engine, Blockchain Integrity Layer, and Admin Analytics & System Monitoring built on SQLAlchemy 2.0 and Alembic.

---

## Directory Structure

```text
backend/
├── alembic.ini                     # Alembic database migration configuration
├── alembic/
│   ├── env.py                      # Alembic environment context & model metadata loader
│   ├── script.py.mako              # Migration script template
│   └── versions/                   # Database migration version scripts
├── app/
│   ├── main.py                     # FastAPI application entrypoint & lifespan hooks
│   ├── core/
│   │   ├── config.py               # Pydantic Settings & environment resolution
│   │   ├── security.py             # Password hashing & JWT token handling
│   │   └── dependencies.py         # Role-Based Access Control (RBAC) dependency injection
│   ├── api/
│   │   └── routes/
│   │       ├── health.py           # Health check endpoint (GET /health)
│   │       ├── auth.py             # User registration, login, profile (/api/v1/auth/*)
│   │       ├── predictions.py      # ML prediction endpoints (/api/v1/predictions/*)
│   │       ├── anomaly.py          # 2-Layer Anomaly detection (/api/v1/anomaly/*)
│   │       ├── batches.py          # Batch CRUD & list (/api/v1/batches)
│   │       ├── supply_chain.py     # Supply chain events & batch trace (/api/v1/batches/{id}/events, /trace)
│   │       ├── reconciliation.py  # Mass conservation reconciliation (/api/v1/batches/{id}/reconcile)
│   │       ├── lab.py              # Laboratory records (/api/v1/batches/{id}/lab)
│   │       ├── evidence.py         # Evidence metadata (/api/v1/batches/{id}/evidence)
│   │       ├── genealogy.py        # Batch genealogy & relationships (/api/v1/batches/relationships, /{id}/genealogy)
│   │       ├── qr.py               # QR code generation & public consumer verification (/api/v1/batches/{id}/qr, /verify/{token})
│   │       ├── voice.py            # Voice backend & speech-to-text endpoints (/api/v1/voice/*)
│   │       ├── blockchain.py       # Blockchain integrity layer (/api/v1/batches/{id}/blockchain/*, /blockchain/*)
│   │       └── analytics.py        # Admin analytics & monitoring endpoints (/api/v1/admin/*)
│   ├── schemas/
│   │   ├── auth.py                 # User register, login, token, user out schemas
│   │   ├── prediction.py           # Yield & daily production request/response models
│   │   ├── anomaly.py              # Anomaly check request/response models
│   │   ├── batch.py                # Batch request/response models
│   │   ├── supply_chain.py         # Event & trace request/response models
│   │   ├── reconciliation.py       # Reconciliation request/response models
│   │   ├── lab.py                  # Lab record request/response models
│   │   ├── evidence.py             # Evidence request/response models
│   │   ├── genealogy.py            # Relationship & genealogy graph schemas
│   │   ├── qr.py                   # QR verification & sanitized public consumer response schemas
│   │   ├── voice.py                # Voice transcription & voice query request/response schemas
│   │   ├── blockchain.py           # Blockchain anchor, verification, & transaction schemas
│   │   └── analytics.py            # System-wide admin overview, batch, supply-chain, anomaly, prediction, user, audit log, & monitoring schemas
│   ├── services/
│   │   ├── auth_service.py         # Registration, authentication, & user profile service
│   │   ├── ml_service.py           # Inference engine for yield & daily production models
│   │   ├── anomaly_service.py      # 2-Layer anomaly detection service (Rules + ML)
│   │   ├── batch_service.py        # Batch creation, detail lookup, & paginated listing
│   │   ├── supply_chain_service.py # Supply chain event logger & trace generator
│   │   ├── reconciliation_service.py # Mass-conservation reconciliation service
│   │   ├── genealogy_service.py    # Parent-child batch lineage & genealogy graph service
│   │   ├── qr_service.py           # QR token generator & public consumer verification service
│   │   ├── speech_service.py       # Speech-to-Text provider abstraction & audio validator
│   │   ├── voice_query_service.py  # Intent engine, batch ID extractor, & voice query executor
│   │   ├── blockchain_service.py   # Canonical SHA-256 payload hashing, Web3/Mock provider, & integrity audit
│   │   ├── analytics_service.py    # High-performance SQL aggregation, date filtering, audit log query, & system health monitoring service
│   │   ├── lab_service.py          # Lab record manager
│   │   ├── evidence_service.py     # Evidence metadata manager
│   │   └── audit_service.py        # System audit log recorder
│   ├── db/
│   │   └── database.py             # SQLAlchemy 2.x engine, session, & SQLite fallback
│   └── models/
│       ├── base.py                 # DeclarativeBase foundation
│       ├── user.py                 # User ORM model & roles (BEEKEEPER, PROCESSOR, LAB, etc.)
│       ├── batch.py                # Batch ORM model
│       ├── batch_relationship.py   # BatchRelationship ORM model (SPLIT, MERGE, etc.)
│       ├── qr_verification.py      # QRVerification ORM model (secure verification tokens)
│       ├── supply_chain_event.py   # SupplyChainEvent ORM model
│       ├── lab_record.py           # LabRecord ORM model
│       ├── evidence.py             # Evidence ORM model
│       ├── reconciliation.py       # ReconciliationRecord ORM model
│       ├── blockchain_anchor.py    # BlockchainAnchor ORM model
│       └── audit_log.py            # AuditLog ORM model
├── tests/
│   ├── test_health.py              # Pytest for health check endpoint (2 tests)
│   ├── test_auth.py                # Pytest for authentication & RBAC permissions (9 tests)
│   ├── test_predictions.py         # Pytest for ML yield & daily production endpoints (2 tests)
│   ├── test_anomaly.py             # Pytest for 5 supply-chain anomaly scenarios (9 tests)
│   ├── test_batches.py            # Pytest for batch creation, lookup, duplicate checks, & list (5 tests)
│   ├── test_supply_chain.py       # Pytest for supply chain events & chronological trace (5 tests)
│   ├── test_reconciliation.py      # Pytest for quantity reconciliation (4 tests)
│   ├── test_lab_evidence.py        # Pytest for lab records & evidence metadata (5 tests)
│   ├── test_genealogy.py           # Pytest for batch genealogy, split/merge, & lineage (5 tests)
│   ├── test_qr.py                  # Pytest for Phase 5 QR generation, revocation, & public verification (9 tests)
│   ├── test_voice.py               # Pytest for Phase 6 voice STT, intent parsing, & RBAC (31 tests)
│   ├── test_blockchain.py          # Pytest for Phase 7 Blockchain anchoring, verification, & tamper detection (17 tests)
│   └── test_analytics.py           # Pytest for Phase 8 Admin analytics, audit logs, monitoring, RBAC, & date/pagination validation (18 tests)
├── requirements.txt                # Python package dependencies
├── .env.example                    # Environment variable template
└── README.md                       # Backend documentation
```

---

## Installation & Setup

### 1. Prerequisites
- Python 3.10+ installed.

### 2. Virtual Environment Setup
From the project root or `backend/` directory:

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# Linux/macOS:
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r backend/requirements.txt
```

---

## Database Configuration & Alembic Migrations

### PostgreSQL Setup
1. Create PostgreSQL database:
   ```sql
   CREATE DATABASE honeychain_db;
   ```
2. Set `DATABASE_URL` in `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/honeychain_db"
   ```
3. Run migrations:
   ```bash
   cd backend
   alembic upgrade head
   ```

### Automatic SQLite Development Fallback
If `DATABASE_URL` is unconfigured, the system defaults to `sqlite:///./honeychain_dev.db` and automatically initializes all database tables (`users`, `batches`, `batch_relationships`, `qr_verifications`, `supply_chain_events`, `lab_records`, `evidences`, `reconciliation_records`, `blockchain_anchors`, `audit_logs`).

---

## Starting the FastAPI Server

Navigate to `backend/` and run:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## Interactive API Documentation (Swagger / ReDoc)

- **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## Key API Endpoints Summary

### 1. Admin Analytics & Monitoring (Phase 8)
- **`GET /api/v1/admin/analytics/overview`**: High-level system statistics (users, active/completed batches, events, lab/evidence counts, reconciliations, flagged anomalies, blockchain anchors, QR status). (Requires `ADMIN`).
- **`GET /api/v1/admin/analytics/batches`**: Batch statistics with date filtering, status/source breakdown, total quantity kg, creation trend, and paginated records. (Requires `ADMIN`).
- **`GET /api/v1/admin/analytics/supply-chain`**: Supply-chain event breakdown by stage, timeline, incomplete trace count, reconciliation loss totals, and quantity flow stats. (Requires `ADMIN`).
- **`GET /api/v1/admin/analytics/anomalies`**: Anomaly records summary, flagged count, type breakdown, recent alert logs, and rule vs ML mechanism counts. (Requires `ADMIN`).
- **`GET /api/v1/admin/analytics/predictions`**: ML model metadata, dataset references, and active inference engine capabilities. (Requires `ADMIN`).
- **`GET /api/v1/admin/analytics/blockchain`**: Blockchain anchor counts by provider, network, status, verified/tampered counts, and recent anchor logs. (Requires `ADMIN`).
- **`GET /api/v1/admin/analytics/users`**: User totals, active/inactive counts, role distribution, and recently registered users (without password hashes). (Requires `ADMIN`).
- **`GET /api/v1/admin/audit-logs`**: Paginated audit log search with date, actor, action, entity filtering. (Requires `ADMIN`).
- **`GET /api/v1/admin/monitoring`**: Subsystem operational health for Database, ML Models, Blockchain, QR engine, and Speech-to-Text service. (Requires `ADMIN`).

### 2. Blockchain Integrity Layer (Phase 7)
- **`POST /api/v1/batches/{batch_id}/blockchain/anchor`**: Computes SHA-256 canonical hash of batch state and anchors cryptographic proof on active blockchain provider (Requires `BEEKEEPER`, `PROCESSOR`, `LAB`, or `ADMIN`).
- **`GET /api/v1/batches/{batch_id}/blockchain`**: Retrieves blockchain anchor records and proof history for a batch (Requires authentication).
- **`POST /api/v1/batches/{batch_id}/blockchain/verify`**: Recalculates current database record SHA-256 hash and compares against anchored proof. Returns `VERIFIED` or `TAMPERED` (Requires authentication).
- **`GET /api/v1/blockchain/transactions/{transaction_hash}`**: Returns block details, provider, and timestamp for a transaction hash (Requires authentication).

### 3. Authentication & RBAC
- **`POST /api/v1/auth/register`**: Register user with role (`BEEKEEPER`, `COLLECTOR`, `PROCESSOR`, `LAB`, `DISTRIBUTOR`, `RETAILER`, `ADMIN`).
- **`POST /api/v1/auth/login/json`**: Authenticate and obtain JWT access token.
- **`GET /api/v1/auth/me`**: Get authenticated user profile.

### 4. Voice Backend & Speech-to-Text (Phase 6)
- **`POST /api/v1/voice/transcribe`**: Transcribe uploaded audio file (`.wav`, `.mp3`, `.m4a`, `.ogg`, `.flac`) into text transcript with provider info (Requires authentication).
- **`POST /api/v1/voice/query`**: Execute text voice query, parse intent & batch ID, enforce RBAC, and return structured response (Requires authentication).
- **`POST /api/v1/voice/ask`**: Combined audio transcription + intent execution endpoint (Requires authentication).

### 5. QR Code Generation & Public Consumer Verification (Phase 5)
- **`POST /api/v1/batches/{batch_id}/qr`**: Generate or retrieve active QR verification token and Base64 PNG image (Requires `BEEKEEPER`, `PROCESSOR`, or `ADMIN`).
- **`GET /api/v1/batches/{batch_id}/qr`**: Get active QR metadata for batch (Requires authentication).
- **`POST /api/v1/batches/{batch_id}/qr/revoke`**: Revoke active QR verification token (Requires `PROCESSOR` or `ADMIN`).
- **`GET /api/v1/verify/{verification_token}`**: **Public consumer verification endpoint (No authentication required)**. Returns sanitized consumer-facing batch record, event history, lineage graph, lab tests, mass reconciliation logs, anomaly status, and verified blockchain anchor details.

### 6. Batch Genealogy & Relationships (Phase 4)
- **`POST /api/v1/batches/relationships`**: Link parent and child batches (`SPLIT`, `MERGE`, `DERIVED`, `TRANSFER`). Enforces quantity conservation ($\sum \text{Child Quantities} \le \text{Parent Quantity}$) and prohibits self-parenting.
- **`GET /api/v1/batches/{batch_id}/genealogy`**: Retrieve complete lineage graph containing upstream ancestors, downstream descendants, and relationship links.
- **`GET /api/v1/batches/{batch_id}/ancestors`**: List all upstream parent/ancestor batches.
- **`GET /api/v1/batches/{batch_id}/descendants`**: List all downstream child/descendant batches.

### 7. Supply Chain Events & Traceability
- **`POST /api/v1/batches/{batch_id}/events`**: Record movement/transformation events (`HARVEST`, `COLLECTION`, `PROCESSING`, `LAB_SUBMISSION`, `PACKAGING`, `DISPATCH`, `TRANSFER`). Auto-updates batch status.
- **`GET /api/v1/batches/{batch_id}/trace`**: Returns comprehensive trace history including events, genealogy graph, lab records, evidence metadata, reconciliations, `has_anomalies` flag, and `blockchain_status`.

### 8. Quantity Reconciliation
- **`POST /api/v1/batches/{batch_id}/reconcile`**: Evaluates mass-conservation ($Output \le Input$) and 2-layer anomaly detection. Outputs loss kg and status (`PASS` or `ANOMALY`). Flagged batches transition status to `FLAGGED`.

### 9. Laboratory Records
- **`POST /api/v1/batches/{batch_id}/lab`**: Add lab test record (purity, HMF, C4 sugar, status).
- **`GET /api/v1/batches/{batch_id}/lab`**: List lab records for batch.

### 10. Evidence & Documents
- **`POST /api/v1/batches/{batch_id}/evidence`**: Attach file reference/metadata (`PHOTO`, `DOCUMENT`, `CERTIFICATE`, etc.).
- **`GET /api/v1/batches/{batch_id}/evidence`**: List evidence records for batch.

### 11. ML Predictions & Anomaly Check
- **`POST /api/v1/predictions/yield`**: Honey yield prediction (kg).
- **`POST /api/v1/predictions/daily-production`**: Daily honey production rate prediction (kg/day).
- **`POST /api/v1/anomaly/check`**: 2-Layer supply chain batch anomaly check.

---

## Running Automated Tests

Run the complete pytest test suite:

```bash
# From project root
python -m pytest backend/tests/ -v
```

The test suite executes 121 tests covering:
- Health check endpoints (2 tests)
- Authentication & JWT RBAC role permissions (9 tests)
- Honey Yield & Daily Production ML predictions (2 tests)
- 5 Supply-Chain Anomaly ML/Rule check scenarios (9 tests)
- Batch creation, lookup, duplicate rejection, and paginated listing (5 tests)
- Supply chain event logging & chronological trace generation (5 tests)
- Mass conservation quantity reconciliation (`PASS` & `ANOMALY`) (4 tests)
- Lab record and evidence metadata management (5 tests)
- Batch genealogy, SPLIT/MERGE parent-child quantity conservation, graph traversal, and enhanced trace (5 tests)
- QR code generation, active QR invariant, token revocation, audit logging, and public consumer verification (9 tests)
- Voice Speech-to-Text, provider transparency, operational intents, batch ID extraction, RBAC, audio file validation, and temp file cleanup (31 tests)
- Blockchain canonical SHA-256 payload hashing, duplicate anchor prevention, tamper detection, provider abstraction, audit logging, RBAC authorization, and zero-secret exposure (17 tests)
- Admin analytics overview, batch statistics, supply-chain flow, anomaly reports, ML metadata, blockchain anchor logs, user summaries, paginated audit logs, system health monitoring, RBAC authorization, and date/pagination validation (18 tests)

