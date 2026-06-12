# DalelQ (Deal CRM) - The Next Generation AI-Powered Sales Platform

Welcome to DalelQ, the ultimate unified solution for modern sales organizations. This project is not merely a Customer Relationship Management (CRM) system; it is an intelligent, self-acting, and autonomous Sales Artificial Intelligence ecosystem. 

DalelQ bridges the gap between traditional data silos and actionable revenue intelligence. By natively embedding WebRTC communication and LLM-powered (Large Language Model) conversational intelligence directly into the core pipeline architecture, DalelQ completely eliminates manual data entry, manual lead progression, and manual call logging. 

---

## Part 1: Executive Overview

### 1.1 The Problem with Traditional CRMs
In the modern sales landscape, representatives spend less than 35% of their time actually selling. The remaining 65% is consumed by administrative overhead: logging calls, typing out call summaries, updating pipeline stages, evaluating BANT (Budget, Authority, Need, Timeline) criteria, and configuring disjointed third-party telephony applications. 

Traditional CRMs are "passive databases." They only know what the sales representative manually tells them. This leads to stale data, inaccurate forecasting, and dropped leads.

### 1.2 The DalelQ Solution
DalelQ is an "active intelligence" platform. It does not wait for a human to input data. 
- **Native Telephony:** A representative clicks a button in their browser, and DalelQ securely negotiates a WebRTC connection to initiate a live audio call. 
- **Active Listening:** The DalelQ backend actively buffers and records the audio stream via WebSockets.
- **Autonomous Processing:** Upon call completion, the audio is locally transcribed using advanced neural networks (Faster-Whisper) and passed to an LLM (such as Ollama or an external provider like NVIDIA/OpenAI).
- **Self-Updating Pipeline:** The AI evaluates the transcript, extracts objections, calculates sentiment, and literally moves the Lead Card from one pipeline stage to the next without human intervention.

---

## Part 2: Comprehensive Architecture

DalelQ is built using a decoupled, highly scalable, and modular architecture designed for high availability and rapid data processing.

### 2.1 The Frontend Presentation Layer
The frontend is a Single Page Application (SPA) designed for extreme responsiveness and real-time data binding.

- **Technology:** React 18, Vite, React Router DOM.
- **State Management:** Context API is used for global state (User Auth, Real-time Toasts) while component-level state handles UI interactions.
- **Design System:** A completely custom, vanilla CSS design system utilizing glassmorphism, fluid typography, and CSS variables for theming. No heavy UI libraries are forced upon the application, allowing for sub-100ms render times.
- **WebRTC Client:** The `SelfHostedDialer` component manages raw hardware access (Microphone via `navigator.mediaDevices`), instantiates the `RTCPeerConnection`, handles ICE candidate generation, and buffers local audio using the HTML5 `MediaRecorder` API. 

### 2.2 The Backend Application Server
The backend is an asynchronous, high-performance API server responsible for orchestration, database transactions, and WebSockets.

- **Technology:** Python 3.10+, FastAPI, Uvicorn, SQLAlchemy 2.0.
- **Asynchronous I/O:** FastAPI is chosen specifically because handling real-time audio streams via WebSockets requires non-blocking asynchronous event loops. 
- **Database ORM:** SQLAlchemy is used to map complex relational data (Tenants, Users, Leads, Activities, Webhooks) into PostgreSQL.
- **Authentication:** Stateless JWT (JSON Web Tokens) with Argon2/Bcrypt password hashing ensures that horizontal scaling is seamless.

### 2.3 The Artificial Intelligence Engine
The AI Engine operates as a background worker process to prevent blocking the main API thread.

- **Transcription:** `faster-whisper` (CTranslate2) runs locally, providing near human-level transcription accuracy directly on the server's CPU or GPU without sending sensitive audio data to third-party clouds.
- **Conversational Intelligence:** A specialized prompt is injected into an LLM (Local Ollama or Cloud API). The LLM is instructed to act as an elite sales manager, parsing the transcript strictly into structured JSON (Sentiment, Tone, Signals, Summary, Suggested Stage).

### 2.4 The Data Layer
- **Relational Storage:** PostgreSQL handles all structured data. It enforces strong foreign key constraints to ensure Multi-Tenant isolation (Company A cannot see Company B's leads).
- **Blob Storage:** Audio files (`.webm`) are stored in an encrypted local filesystem or an S3-compatible object store.

---

## Part 3: Deep Technical Deployment Guide

Deploying DalelQ requires provisioning the database, the backend services, the frontend static host, and the necessary AI models.

### 3.1 Minimum System Requirements
- **CPU:** 4 Cores (8 Cores recommended for local Whisper processing).
- **RAM:** 8 GB Minimum (16 GB recommended if running Ollama locally).
- **Storage:** 50 GB SSD (Audio files require significant storage over time).
- **OS:** Ubuntu 22.04 LTS / Windows 11 WSL2 / macOS.

### 3.2 Environment Variable Configuration
The backend requires a strictly configured `.env` file located in the `backend/` directory.

```ini
# Core Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/deal_crm

# JWT Security
SECRET_KEY=your_extremely_secure_random_string_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# AI Engine Configuration
USE_OLLAMA_FOR_ALL=true
OLLAMA_BASE_URL=http://localhost:11434
VOICE_MODEL=llama3.2
```

### 3.3 Initializing the Database and Seeding
Before the application can be used, the PostgreSQL schema must be created and the initial super-admin and demo data must be seeded.

```bash
# 1. Start the PostgreSQL Server
sudo systemctl start postgresql

# 2. Run the Demo Seeder (This creates the schema and populates tables)
cd backend
python seed_demo_data.py
python seed_lead_sources.py
```

### 3.4 Running the Application (Development Mode)

**Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
*The `--reload` flag instructs Uvicorn to watch for file changes and hot-reload the server.*

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
*The Vite server will start on port 3000 and proxy API requests to port 8000.*

---

## Part 4: Security and Multi-Tenancy

DalelQ is designed for Enterprise B2B SaaS deployments. Security is implemented at the core architecture level.

### 4.1 Multi-Tenant Data Isolation
Every table in the database (Leads, Automation Rules, Teams, Users) contains a `company_id` foreign key. The backend Dependency Injection system (`get_current_user`) automatically extracts the JWT token, resolves the User, and strictly appends `.filter(Model.company_id == current_user.company_id)` to every single database query. Data leakage across organizations is mathematically impossible at the ORM layer.

### 4.2 Super Admin Override
A boolean flag `is_super_admin` exists on the User model. Super Admins bypass the `company_id` filters for system administration purposes but are strictly filtered out of all analytical "Team Reports" to prevent skewing sales metrics.

### 4.3 WebRTC Encryption
All Voice over IP (VoIP) traffic negotiated by the `SelfHostedDialer` is enforced over DTLS (Datagram Transport Layer Security) and SRTP (Secure Real-Time Transport Protocol). The browser natively enforces this; WebRTC will refuse to connect over insecure HTTP connections outside of localhost.

---

## Part 5: API Documentation and Integration

DalelQ exposes a robust, fully documented REST API. Navigating to `http://localhost:8000/docs` while the backend is running provides an interactive Swagger UI.

### 5.1 Lead Ingestion API
External systems can push leads into DalelQ using the dedicated Webhook endpoints.
- **Endpoint:** `POST /api/webhooks/{source_id}`
- **Payload:** Any valid JSON object.
- **Mechanism:** The backend receives the payload, logs it to `webhook_logs`, evaluates it against the active `AutomationRules` (e.g., routing by intent or geographic region), and inserts the formatted Lead.

### 5.2 Conversational Intelligence API
The AI Engine can be accessed directly via the API.
- **Endpoint:** `POST /api/voice/upload`
- **Mechanism:** Accepts a `multipart/form-data` audio file, saves it, and spawns a background thread to execute the Whisper transcription and LLM inference loop.

---

## Part 6: Future Roadmap and Expansion

The DalelQ ecosystem is built for continuous expansion. Future updates to the core repository will include:
1. **Email Parsing Engine:** Integrating an IMAP listener to autonomously extract text from client emails and run the same LLM Conversational Intelligence applied to voice calls.
2. **Predictive Forecasting:** Utilizing historical Win/Loss data to train a localized Random Forest model to predict quarter-end revenue within a 95% confidence interval.
3. **Advanced WebRTC Scaling:** Moving from a Peer-to-Peer STUN setup to a dedicated SFU (Selective Forwarding Unit) to support multi-party conference calls and call barging for managers.
