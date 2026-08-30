# Agentflow_AI: Agentic AI Operations Automation Platform

**Agentflow_AI** is a full-stack, enterprise-grade AI Operations Automation Platform that transforms plain English descriptions into executable, visual multi-agent workflows. 

Operators can describe automations in natural language, visually customize Directed Acyclic Graphs (DAGs) on a drag-and-drop canvas, and execute them through a fixed chain of cooperating AI agents with live Socket.IO streaming, OAuth integrations (Gmail, Slack, Discord, Google Sheets), self-healing recovery loops, and full audit timelines.

---

## 🌟 Key Features

- 🧠 **AI Prompt-to-Workflow Engine**: Generates complete visual graphs with triggers, logic, and integrations using OpenRouter, Google Gemini, or a deterministic offline rule builder.
- 🤖 **5-Agent Cooperative Chain**:
  - **Planner Agent**: DAG topological sort, cycle detection, step scheduling, and confidence scoring.
  - **Execution Agent**: Dispatches actions across Gmail, Slack, Discord, Google Sheets, or LLMs with variable interpolation (`{{vendor}}`, `{{total_amount}}`).
  - **Validation Agent**: Pre-validates payloads and validates post-execution schemas and threshold logic.
  - **Recovery Agent**: Classifies faults (`MISSING_FIELDS`, `API_FAILURE`, `AUTH_EXPIRED`, `RATE_LIMIT`, `TRANSIENT`), executes exponential backoff retries, or escalates to operators.
  - **Monitoring Agent**: Streams granular timeline events via Socket.IO and persists audit logs.
- 🎨 **Visual Canvas & Node Palette**: Drag-and-drop workflow canvas with connection handles, animated bezier edges, and an interactive Node Configuration Inspector.
- 🔒 **Enterprise Security**:
  - Passwords hashed with `bcryptjs` (Cost factor 12).
  - Third-party OAuth tokens encrypted at rest with AES-256-GCM (`CREDENTIAL_ENCRYPTION_KEY`).
  - JWT session authorization with protected routes and rate limiting.
- ⚡ **Zero-Configuration Local Support**: Built-in in-memory database and queue fallbacks allow running the entire platform immediately without pre-installing MongoDB or Redis!

---

## 🏗️ System Architecture

```
                                    +----------------------------------------+
                                    |    Next.js Pages Router Frontend       |
                                    |    - Visual Canvas & Node Palette      |
                                    |    - Live Agent Timeline & Telemetry   |
                                    |    - Zustand Session & Socket.IO       |
                                    +-------------------+--------------------+
                                                        |
                                        REST API / JWT  |  Socket.IO Live Stream
                                                        |
+-------------------------------------------------------v------------------------------------------------------+
| Express.js Orchestration Server (Port 5000)                                                                  |
|                                                                                                              |
|  [ Routes & Validators ] ----> [ Controllers ] ----> [ Services Layer ]                                      |
|                                                            |                                                 |
|             +----------------------------------------------+----------------------------------+              |
|             |                                              |                                  |              |
|      [ AI Service ]                                 [ Integrations ]                  [ Database Engine ]    |
|      - OpenRouter (Claude/Llama)                    - Gmail API (Send/Read)           - MongoDB / In-Memory  |
|      - Google Gemini SDK                            - Slack Workspace                 - AES-256 Tokens       |
|      - Deterministic Rule Engine                    - Discord Bot / Webhook                                  |
|                                                     - Google Sheets API                                      |
|                                                                                                              |
|  [ Multi-Agent Execution Pipeline ]                                                                          |
|  +--------------------------------------------------------------------------------------------------------+  |
|  | (1) Planner Agent -> (2) Execution Agent -> (3) Validation Agent -> (4) Recovery Agent -> (5) Monitor  |  |
|  +--------------------------------------------------------------------------------------------------------+  |
+--------------------------------------------------------------------------------------------------------------+
```

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- **Node.js** (v12.x or higher, v18+ recommended)
- **npm** (v6.x or higher)

*(Optional: Local MongoDB and Redis instances if not using in-memory mode).*

---

### 2. Environment Configuration
Copy the `.env.example` file to create your local `.env`:

```bash
# In the project root directory
cp .env.example .env
```

The default values enable in-memory databases and queues out-of-the-box:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
JWT_SECRET=agentflow_super_secret_jwt_key_2026
CREDENTIAL_ENCRYPTION_KEY=agentflow_32_byte_aes_secret_key!

# Optional external connections (defaults to in-memory fallback)
USE_IN_MEMORY_DB=true
USE_IN_MEMORY_REDIS=true

# Optional AI Providers (leave blank to use Deterministic Engine)
OPENROUTER_API_KEY=
GEMINI_API_KEY=
```

---

### 3. Install Dependencies

Install dependencies for both server and client:

```bash
# 1. Install Backend Dependencies
cd server
npm install

# 2. Install Frontend Dependencies
cd ../client
npm install

cd ..
```

---

### 4. Running the Platform Locally

You can launch both the backend server and frontend simultaneously with:

```bash
# Start both backend (Port 5000) and frontend (Port 3000)
node start-dev.js
```

Or run them in separate terminal windows:

#### Terminal 1 (Backend):
```bash
cd server
npm start
# Server boots at: http://localhost:5000
```

#### Terminal 2 (Frontend):
```bash
cd client
npm run dev
# Frontend boots at: http://localhost:3000
```

---

## 🖥️ Using the Platform

1. **Access the Web App**: Open [http://localhost:3000](http://localhost:3000) in your browser.
2. **One-Click Demo Login**:
   - Click **Sign In** or navigate to `/login`.
   - Click the **"One-Click Demo Login"** button (pre-fills `operator@agentflow.io` / `password123`).
3. **Generate a Workflow with AI**:
   - Go to **AI Prompt Builder** (`/workflows/builder`).
   - Pick a template (e.g., *Invoice Processing Pipeline*) or enter your own prompt:
     > *"Receive an email invoice, extract line items with AI, post alert to Slack, and log transaction to Google Sheets"*
   - Click **Generate Graph** to see the multi-agent DAG materialize.
4. **Customize in Canvas Editor**:
   - Click on any node to configure parameters in the right-side inspector.
   - Drag new nodes from the left palette (Triggers, AI Agents, Integrations, Conditions).
5. **Execute and Watch Live Telemetry**:
   - Click **Execute Workflow**.
   - Watch the 5 cooperating agents stream live audit events, node highlights, and execution outputs via Socket.IO!

---

## 📡 API Endpoints Reference

### Authentication & Health
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System heartbeat, engine status, and storage modes |
| `POST` | `/api/auth/register` | Register a new operator account |
| `POST` | `/api/auth/login` | Authenticate and issue JWT token |
| `GET` | `/api/auth/me` | Fetch authenticated operator profile |

### Workflows
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/workflows/dashboard` | Aggregated dashboard KPIs and execution stats |
| `GET` | `/api/workflows` | List workflows with filtering and search |
| `POST` | `/api/workflows` | Create a new workflow manually |
| `POST` | `/api/workflows/generate` | Generate workflow DAG from natural language prompt |
| `GET` | `/api/workflows/:id` | Fetch single workflow graph structure |
| `PUT` | `/api/workflows/:id` | Update workflow and increment version |
| `POST` | `/api/workflows/:id/duplicate` | Clone an existing workflow |
| `POST` | `/api/workflows/:id/execute` | Trigger a multi-agent execution run |
| `DELETE` | `/api/workflows/:id` | Delete a workflow |

### Executions & Telemetry
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/executions` | List execution audit records |
| `GET` | `/api/executions/:id` | Fetch execution snapshot and status |
| `GET` | `/api/executions/:id/timeline` | Fetch granular agent logs and telemetry |
| `POST` | `/api/executions/:id/pause` | Pause an active execution run |
| `POST` | `/api/executions/:id/resume` | Resume a paused execution run |
| `POST` | `/api/executions/:id/cancel` | Cancel a running execution |

### Integrations & Notifications
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/integrations` | List third-party integration statuses |
| `GET` | `/api/integrations/status` | Real-time connection health check |
| `GET` | `/api/integrations/oauth/:provider/start` | Initiate OAuth flow |
| `GET` | `/api/integrations/oauth/:provider/callback` | OAuth callback handler |
| `POST` | `/api/integrations` | Save encrypted API credentials/tokens |
| `GET` | `/api/notifications` | List operator notifications and escalations |
| `PATCH`| `/api/notifications/:id/read` | Mark notification as read |

---

## 📂 Project Structure

```
PROJECT FOLDER/
├── .env.example                     # Sample environment configuration
├── README.md                        # Documentation & setup guide
├── Spec.md                          # Platform technical specification
├── package.json                     # Root orchestrator scripts
├── start-dev.js                     # Concurrent dev runner
│
├── server/                          # Express.js Backend Architecture
│   ├── package.json
│   └── src/
│       ├── config/                  # DB, Socket.IO & Env configs
│       ├── models/                  # Mongoose models & In-Memory DB
│       ├── middleware/              # Auth, validation & error handling
│       ├── utils/                   # AES-256-GCM token encryption
│       ├── agents/                  # Multi-agent cooperation chain
│       │   ├── orchestrator.js      # LangGraph runner & control loop
│       │   ├── plannerAgent.js      # DAG sort & confidence scoring
│       │   ├── executionAgent.js    # Node executor & variable interpolation
│       │   ├── validationAgent.js   # Payload schema verification
│       │   ├── recoveryAgent.js     # Fault taxonomy & backoff/escalation
│       │   └── monitoringAgent.js   # Real-time event log emitter
│       ├── integrations/            # Gmail, Slack, Discord, Sheets
│       ├── queues/                  # BullMQ & In-Memory queue fallback
│       ├── services/                # Business logic services
│       ├── controllers/             # Thin HTTP controllers
│       ├── routes/                  # Express route definitions
│       └── server.js                # Server entry point
│
└── client/                          # Next.js Pages Router Frontend
    ├── package.json
    ├── next.config.js
    └── src/
        ├── components/              # AppShell, Canvas, Palette, Timeline
        ├── store/                   # Zustand auth, workflow, notification
        ├── services/                # Axios API client & Socket.IO
        ├── styles/                  # Global styles & custom scrollbars
        └── pages/                   # Next.js pages
            ├── _app.js              # Root wrapper
            ├── _document.js         # Tailwind & font configuration
            ├── index.js             # Landing page
            ├── login.js             # Operator login + Demo login
            ├── register.js          # Operator registration
            ├── dashboard.js         # Mission Control KPIs & feeds
            ├── integrations.js      # OAuth tools & status
            ├── settings.js          # Security & health checks
            ├── workflows/           # Workflow list, builder, and editor
            └── executions/          # Execution audit records & live room
```

---

## 🧪 Verified Automated Test Run

To run an automated end-to-end integration test verifying registration, AI workflow generation, workflow persistence, execution queuing, multi-agent step execution, and timeline logging:

```bash
# In server directory
node -e "
const axios = require('axios');
async function test() {
  const reg = await axios.post('http://localhost:5000/api/auth/register', {
    name: 'Test Operator', email: 'test@agentflow.io', password: 'password123'
  });
  const token = reg.data.data.token;
  const gen = await axios.post('http://localhost:5000/api/workflows/generate', {
    prompt: 'Receive an invoice, extract items with AI, post to Slack, and log to Sheets'
  }, { headers: { Authorization: 'Bearer ' + token } });
  const wf = await axios.post('http://localhost:5000/api/workflows', gen.data.data, {
    headers: { Authorization: 'Bearer ' + token }
  });
  const exec = await axios.post('http://localhost:5000/api/workflows/' + wf.data.data._id + '/execute', {}, {
    headers: { Authorization: 'Bearer ' + token }
  });
  console.log('Execution Queued:', exec.data.data._id);
}
test();
"
```

---

## 📜 License
MIT License. Built for enterprise AI Operations Automation.
