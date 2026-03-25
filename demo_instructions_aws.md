## Constellation Demo Instructions (AWS / Multi‑Machine)

This document explains how to run Constellation across **two or more separate computers** using AWS RDS as the shared database. Unlike the original single‑machine demo, **Ray does not start when Flask boots** — it starts lazily when a researcher submits a project (head) or a volunteer joins one (worker).

---

## Architecture Overview

```
Researcher Machine                          Volunteer Machine(s)
┌──────────────────────┐                    ┌──────────────────────┐
│  Flask backend       │                    │  Flask backend       │
│  (no Ray at boot)    │                    │  (no Ray at boot)    │
│                      │                    │                      │
│  POST /submit  ──────┼──▶ Starts Ray     │  POST /api/workers/  │
│                      │    head on this    │    connect           │
│                      │    machine         │      │               │
│                      │      │             │      ▼               │
│                      │      ▼             │  Pulls head IP       │
│                      │  Stores head IP    │  from AWS            │
│                      │  in AWS projects   │      │               │
│                      │  table             │      ▼               │
│                      │                    │  ray start           │
│                      │◀───────────────────│  --address=<ip>:6379 │
│   Ray head :6379     │   Ray worker joins │                      │
└──────────────────────┘                    └──────────────────────┘
         │                                           │
         └──────────────┬────────────────────────────┘
                        ▼
                   AWS RDS (PostgreSQL)
                   ┌──────────────┐
                   │ users        │
                   │ researchers  │
                   │ projects ◀── ip_address column
                   │ project_users│
                   └──────────────┘
```

Key points:

- **Flask boots with zero Ray involvement** on every machine.
- **Ray head** starts only when a researcher submits a project (`POST /submit`).
- **Ray worker** starts only when a volunteer clicks "contribute" (`POST /api/workers/connect`).
- The **head IP** is stored in the AWS `projects.ip_address` column and looked up by volunteers.

---

## 0. Prerequisites

Each machine needs:

- macOS or Linux
- Python 3.10+
- Node.js (for the frontend, optional on volunteer machines)
- Git clone of this repo
- Network connectivity between machines (same LAN, VPN, or publicly reachable IPs)

Environment variable required on **every machine**:

```bash
export AWS_DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
```

This connects the Flask backend to the shared AWS RDS PostgreSQL database containing `users`, `researchers`, `projects`, and `project_users`.

All commands below assume the repo root:

```bash
cd /path/to/constellation
```

---

## 1. One‑time Setup (Each Machine)

```bash
cd /path/to/constellation

python3 -m venv env
source env/bin/activate
pip install -r requirements.txt
```

Set the AWS database URL (add to your shell profile or export before each session):

```bash
export AWS_DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
```

Initialize the local SQLite database (used for runs, tasks, workers, results):

```bash
python3 -c "from backend.core.database import init_db; init_db()"
```

The AWS RDS tables (`users`, `researchers`, `projects`, `project_users`) should already exist. If not, create them using the schema in your migration scripts.

---

## 2. Start Flask (Every Machine)

Use the new Ray‑free startup script:

```bash
./scripts/start-flask.sh
```

Or equivalently:

```bash
python3 -m flask --app backend.app run --host 0.0.0.0 --port 5001
```

Expected output:

```
Database initialized and tables created.
[ConstellationAPI] Initialized API layer (Ray deferred).
 * Running on http://0.0.0.0:5001
```

**No Ray processes start.** Flask is purely a control plane at this point.

Do this on **every machine** (researcher and all volunteers).

---

## 3. Create Demo Users (API or Frontend)

Users are stored in the shared AWS RDS, so you only need to create them once (from any machine).

### 3.1 Option A: Create Users via API (curl)

Create at least one researcher and one volunteer:

```bash
# Researcher
curl -X POST http://127.0.0.1:5001/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Demo Researcher",
    "email": "researcher@example.com",
    "role": "researcher"
  }'

# Volunteer
curl -X POST http://127.0.0.1:5001/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Demo Volunteer",
    "email": "volunteer@example.com",
    "role": "volunteer"
  }'
```

Create additional volunteer accounts for each volunteer machine if desired. A `409` response means the user already exists — that is fine.

### 3.2 Option B: Create Users via Frontend (Signup Page)

If you prefer not to use curl:

1. Start the frontend (see section 7.1).
2. Open `http://localhost:5173/signup`.
3. Create the researcher account:
   - Enter name/email/password.
   - Select **Researcher** role.
   - Submit.
4. Create volunteer account(s):
   - Repeat signup with different email(s).
   - Select **Volunteer** role.
   - Submit.

Notes:
- If you need one account to do both actions, select both roles during signup.
- If signup returns `409`, the account already exists. Use `/login` instead.

---

## 4. Demo: Researcher Submits a Project

This happens on the **researcher's machine**.

### 4.1 Submit the Project

Use the bundled `test-square` sample project (10 rows, very fast):

```bash
curl -X POST http://127.0.0.1:5001/submit \
  -F "title=test-square-demo" \
  -F "description=fast squaring demo with 10 rows" \
  -F "user_id=researcher@example.com" \
  -F "py_file=@sample-projects/test-square/project.py" \
  -F "data_file=@sample-projects/test-square/dataset.csv" \
  -F "chunk_size=10" \
  -F "replication_factor=2" \
  -F "max_verification_attempts=1"
```

> Replace `user_id` with the researcher's username if it differs from the email.

### 4.2 What Happens Behind the Scenes

1. Flask calls `api.start_ray_head()`.
2. `ray stop` cleans up any stale Ray state.
3. `ray start --head --port=6379 --node-ip-address=<LAN_IP>` launches the head.
4. Flask connects as a Ray driver (`ray.init(address=...)`).
5. The head's **LAN IP** is written to the AWS `projects.ip_address` column.
6. The project, run, and tasks are created in both AWS and local SQLite.
7. Tasks are queued, waiting for volunteer workers to join.

### 4.3 Expected Response

```json
{
  "message": "Job submitted successfully",
  "job_id": 0,
  "run_id": "run-...",
  "project_id": "42",
  "total_tasks": 2,
  "head_ip": "10.0.0.5"
}
```

Note the `head_ip` — this is the researcher's LAN IP that volunteers will connect to. It is also stored in AWS so volunteers don't need to know it manually.

### 4.4 Verify the IP is in AWS

From any machine with `psql` access:

```sql
SELECT project_id, name, ip_address, status FROM projects ORDER BY project_id DESC LIMIT 5;
```

You should see the project with `ip_address` populated.

---

## 5. Demo: Volunteer Joins the Project

This happens on each **volunteer's machine**.

### 5.1 Connect to the Project

The volunteer provides their identity and the `project_id` to join. The backend looks up the head IP from AWS automatically:

```bash
RESEARCHER_IP="10.0.0.5"  # The researcher's machine IP (for reaching their Flask)

curl -X POST http://$RESEARCHER_IP:5001/api/workers/connect \
  -H "Content-Type: application/json" \
  -d '{
    "email": "volunteer@example.com",
    "worker_name": "volunteer-laptop-1",
    "project_id": 42
  }'
```

> **`project_id`**: The integer project ID from the submit response or from the browse page.
>
> The endpoint fetches the head IP from `projects.ip_address` in AWS, then runs
> `ray start --address=<head_ip>:6379` on the volunteer's machine as a subprocess.
>
> You can also pass `"head_node_ip": "10.0.0.5"` explicitly to override the AWS lookup.

### 5.2 Expected Response

```json
{
  "worker_id": "worker-...",
  "status": "connected",
  "user_id": "volunteer@example.com",
  "email": "volunteer@example.com",
  "head_node_ip": "10.0.0.5",
  "message": "Worker joined the project's Ray cluster successfully"
}
```

### 5.3 What Happens Behind the Scenes

1. Flask reads `projects.ip_address` from AWS for the given `project_id`.
2. Runs `RAY_ENABLE_WINDOWS_OR_OSX_CLUSTER=1 ray start --address=<head_ip>:6379` as a subprocess.
3. The volunteer's machine joins the researcher's Ray cluster as a worker node.
4. The worker is registered in the local SQLite database.
5. The researcher's background thread detects the new node and dispatches queued tasks.

### 5.4 Adding More Volunteers

Repeat section 5.1 on each additional volunteer machine. Each volunteer needs:

- Their own user account (different email/username).
- The `project_id` of the project they want to contribute to.

The researcher's Flask automatically dispatches work to new volunteers as they join.

---

## 6. Monitor Progress and Get Results

### 6.1 From the Researcher's Machine

```bash
RUN_ID="run-...from-submit-response"
JOB_ID=0  # from submit response

# Run status (includes verification progress)
curl "http://127.0.0.1:5001/api/runs/$RUN_ID/status"

# Task list
curl "http://127.0.0.1:5001/api/runs/$RUN_ID/tasks"

# Connected workers
curl "http://127.0.0.1:5001/api/workers"

# Legacy status endpoint
curl "http://127.0.0.1:5001/status/$JOB_ID"

# Fetch results
curl "http://127.0.0.1:5001/results/$JOB_ID"

# Download results as JSON file
curl -OJ "http://127.0.0.1:5001/api/runs/$RUN_ID/results/download"
```

### 6.2 Expected Outputs

For the `test-square-demo` (10 rows, chunk_size=10, replication_factor=2):

- **`/api/runs/$RUN_ID/status`**:
  - `status`: transitions from `"queued"` → `"running"` → `"completed"` (or `"verified"`)
  - `total_tasks`: `2` (1 chunk × 2 replicas)
  - `worker_count`: number of active volunteer nodes
- **`/api/workers`**:
  - One entry per registered volunteer, each with `status: "online"`
- **Results** (`results/$JOB_ID` or downloaded file):
  - 10 rows: `input: 1..10`, `squared: 1..100`

---

## 7. Frontend‑Assisted Demo

### 7.1 Start the Frontend (Researcher and Volunteer Machines)

The frontend talks to `VITE_API_URL` (default: `http://localhost:5001`).

- On the **researcher's machine**, default is usually fine.
- On **volunteer machines**, point frontend to the researcher's Flask backend.

Example (`frontend/.env.local`):

```bash
VITE_API_URL=http://10.0.0.5:5001
```

Then start frontend on each machine where you want browser access:

```bash
cd frontend
npm install
npm run dev:web
```

Open `http://localhost:5173/`.

### 7.2 Researcher Flow (Browser)

1. **Sign up / Log in** at `/signup` or `/login` (or use users created in section 3).
2. **Submit a project** at the Submit page:
   - Upload `sample-projects/test-square/project.py` and `dataset.csv`.
   - Set chunk size, replication factor, etc.
   - Click **Submit**. Ray head starts automatically.
3. **Monitor** on the Dashboard / project detail page:
   - Watch tasks go from queued → running → completed.
   - See connected worker count increase as volunteers join.

### 7.3 Volunteer Flow (Browser Preferred, API Fallback)

#### Browser path (recommended)

1. On the volunteer machine, start frontend with `VITE_API_URL=http://<RESEARCHER_IP>:5001` (section 7.1).
2. Open `http://localhost:5173/` and **log in as a volunteer**.
3. Open the browse/contribute page and join the target project.
4. The frontend calls `POST /api/workers/connect`, which starts `ray start --address=<head_ip>:6379` on the volunteer machine.

#### API fallback (equivalent action)

```bash
curl -X POST http://<RESEARCHER_IP>:5001/api/workers/connect \
  -H "Content-Type: application/json" \
  -d '{
    "email": "volunteer@example.com",
    "worker_name": "my-laptop",
    "project_id": 42
  }'
```

Both approaches hit the same backend endpoint and produce the same worker-join behavior.

---

## 8. Full Multi‑Machine Walkthrough (Step by Step)

Assume:

| Machine | Role | IP | User |
|---------|------|----|------|
| A | Researcher | `10.0.0.5` | `researcher@example.com` |
| B | Volunteer 1 | `10.0.0.10` | `volunteer1@example.com` |
| C | Volunteer 2 | `10.0.0.15` | `volunteer2@example.com` |

### Step 1: Setup (all machines)

```bash
# On each machine:
cd /path/to/constellation
source env/bin/activate
export AWS_DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
```

### Step 2: Start Flask (all machines)

```bash
# On each machine:
./scripts/start-flask.sh
```

No Ray starts. All three machines have Flask running on port 5001.

### Step 3: Create users (once, from any machine)

```bash
# From Machine A (or any machine):
curl -X POST http://127.0.0.1:5001/api/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Researcher","email":"researcher@example.com","role":"researcher"}'

curl -X POST http://127.0.0.1:5001/api/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Volunteer 1","email":"volunteer1@example.com","role":"volunteer"}'

curl -X POST http://127.0.0.1:5001/api/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Volunteer 2","email":"volunteer2@example.com","role":"volunteer"}'
```

### Step 4: Researcher submits project (Machine A)

```bash
# On Machine A:
curl -X POST http://127.0.0.1:5001/submit \
  -F "title=distributed-square" \
  -F "description=Squaring demo across multiple machines" \
  -F "user_id=researcher@example.com" \
  -F "py_file=@sample-projects/test-square/project.py" \
  -F "data_file=@sample-projects/test-square/dataset.csv" \
  -F "chunk_size=5" \
  -F "replication_factor=2" \
  -F "max_verification_attempts=1"
```

This starts the Ray head on Machine A and stores `ip_address=10.0.0.5` in AWS.

Save the returned `project_id` (e.g. `42`), `run_id`, and `job_id`.

### Step 5: Volunteers join (Machines B and C)

```bash
# On Machine B:
curl -X POST http://10.0.0.5:5001/api/workers/connect \
  -H "Content-Type: application/json" \
  -d '{
    "email": "volunteer1@example.com",
    "worker_name": "volunteer-B",
    "project_id": 42
  }'
```

```bash
# On Machine C:
curl -X POST http://10.0.0.5:5001/api/workers/connect \
  -H "Content-Type: application/json" \
  -d '{
    "email": "volunteer2@example.com",
    "worker_name": "volunteer-C",
    "project_id": 42
  }'
```

> Note: the volunteer `curl` commands target the **researcher's Flask** (`10.0.0.5:5001`)
> because the researcher's backend is the Ray driver that dispatches work.
> The volunteer's local Flask is not involved in this request.

### Step 6: Monitor and collect results (Machine A)

```bash
# On Machine A:
curl "http://127.0.0.1:5001/api/runs/$RUN_ID/status"
curl "http://127.0.0.1:5001/api/workers"
curl "http://127.0.0.1:5001/results/$JOB_ID"
```

---

## 9. Networking Requirements

For machines to communicate:

1. **Researcher's machine** must be reachable by volunteers on:
   - **Port 5001** (Flask API)
   - **Port 6379** (Ray GCS / head)
   - **Ports 20000–20020** (Ray worker communication range)

2. If machines are on the **same LAN** (e.g. same Wi‑Fi), this works automatically.

3. If machines are on **different networks**, you need one of:
   - A VPN (e.g. Tailscale, WireGuard) so all machines share a virtual LAN.
   - Port forwarding on the researcher's router for ports 5001, 6379, 20000–20020.
   - A cloud VM as the researcher's machine with public IP.

4. **Firewalls**: ensure macOS firewall allows incoming connections on the ports above, or temporarily disable it for the demo.

---

## 10. Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `Failed to start Ray head node` on submit | Ray not installed or `ray` not in PATH | `pip install ray` in the virtualenv |
| Volunteer `ray start` fails with timeout | Researcher's machine unreachable on port 6379 | Check firewall, verify IP, try `ping <researcher_ip>` |
| `Cannot determine head node IP` on connect | `project_id` not found or `ip_address` is NULL | Verify the project was submitted and check `SELECT ip_address FROM projects WHERE project_id = ...` |
| Tasks stay in `queued` state | No volunteer workers have joined | Have at least one volunteer call `/api/workers/connect` |
| `AWS database not configured` | `AWS_DATABASE_URL` not set | `export AWS_DATABASE_URL="postgresql://..."` before starting Flask |
| Ray finds stale cluster instances | Old Ray sessions from previous runs | Run `ray stop` on each machine before starting the demo |

---

## 11. Differences from Original Demo (DEMO_INSTRUCTIONS.md)

| Aspect | Original (DEMO_INSTRUCTIONS.md) | AWS Multi‑Machine (this file) |
|--------|-------------------------------|-------------------------------|
| **Ray at Flask boot** | Always started immediately | Never started at boot |
| **Ray head** | Manual: `./scripts/start-ray-head.sh` | Automatic: starts on `POST /submit` |
| **Ray worker** | Manual: `ray start --address=...` | Automatic: `POST /api/workers/connect` runs it |
| **Head IP discovery** | Hardcoded or passed manually | Stored in AWS `projects.ip_address`, looked up by volunteers |
| **Startup script** | `./scripts/start-flask-with-ray.sh` | `./scripts/start-flask.sh` |
| **User database** | Local SQLite only | AWS RDS (shared across machines) |
| **Network** | Single machine or same LAN | Any network (LAN, VPN, cloud) |
| **Number of terminals** | 4 (head, flask, worker, control) | 1 per machine (just Flask) + curl for control |
