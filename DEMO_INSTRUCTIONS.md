## Constellation Demo Instructions

This document explains how to run Constellation end‑to‑end in several ways:

- **Single machine vs. multiple machines (LAN)**
- **Terminal‑only vs. Frontend‑assisted**
- **With result verification and a small, fast demo project**

It is written for someone who has **never run the system before**.

---

## 0. Prerequisites

- macOS (or Linux) with:
  - Python 3.10+
  - Node.js (for the frontend)
  - Ray installed via Python (handled by `requirements.txt`)
- Git clone of this repo:
  - Directory: `constellation` (this repo root)

All commands below assume the repo root:

```bash
cd /Users/<you>/.../constellation
```

Adjust the path as needed.

---

## 1. One‑time Setup (Backend + Virtualenv)

Run these once to prepare the backend environment:

```bash
cd /path/to/constellation

python3 -m venv env
source env/bin/activate
python3 -m pip install -r requirements.txt
```

Initialize the database (SQLite local file `constellation.db`):

```bash
python3 -c "from backend.core.database import init_db; init_db()"
```

If you ever want to reset the DB:

```bash
rm constellation.db
python3 -c "from backend.core.database import init_db; init_db()"
```

---

## 2. Small, Fast Demo Project (Recommended)

This branch includes a tiny test project for fast demos in **`sample-projects/test-square/`**:

- Code: `sample-projects/test-square/project.py`
  - Has a `main(row)` that squares an integer column.
- Dataset: `sample-projects/test-square/dataset.csv`
  - 10 rows with a single `value` column (values 1–10).

This is the recommended project to use when you first demo the system because:

- **10 rows** with chunk size 10 → **1 task** of very light compute.
- Verification (`replication_factor=2`) completes quickly on one laptop.

You can later swap in a heavier project (e.g. the text processing task) for “realistic load” once you’re comfortable with the flow.

### 2.1 Where project data lives (`projects/`)

When a user uploads a project, the backend creates a folder under **`projects/`** named with the project ID (a unique hash). That folder contains:

- **`<project_id>.py`** – the uploaded Python script (same hash as the folder name)
- **`<project_id>.csv`** or **`<project_id>.json`** – the uploaded dataset (same hash)
- When a run completes, **`results_<run_id>.json`** is written there (run_id is a UUID, same naming style).

Example after submitting and completing a run:

```
projects/
  project-24aa4653-48c7-4e07-a2b2-6ad96d76555d/
    project-24aa4653-48c7-4e07-a2b2-6ad96d76555d.py
    project-24aa4653-48c7-4e07-a2b2-6ad96d76555d.csv
    results_run-c2d6c9e4-a009-414f-b0de-25e5c6d20b09.json
```

You can **delete the `tmp` and `uploads` folders** if present: the backend uses **`tmp/`** only for temporary file handling during upload (safe to clear periodically), and **`uploads/`** is no longer used—all project data lives under **`projects/`**.

---

## 3. Terminal‑Only Demo on **One Machine**

This section shows how to run the **entire system on a single laptop**, using only terminals (no browser).

We’ll use **4 terminals**, numbered for clarity:

- **Terminal 1** – Ray head (cluster coordinator)
- **Terminal 2** – Flask backend API
- **Terminal 3** – Ray worker (volunteer compute node)
- **Terminal 4** – Control (users, worker registration, submit, status, results)

### 3.1 Terminal 1 – Start Ray Head

```bash
cd /path/to/constellation
source env/bin/activate
./scripts/start-ray-head.sh
```

Expected output (simplified):

- “Starting Ray head at 127.0.0.1:6379…”
- Blocks and shows Ray logs.

Leave this running.

### 3.2 Terminal 2 – Start Flask Backend

```bash
cd /path/to/constellation
source env/bin/activate
./scripts/start-flask-with-ray.sh
```

Expected output:

- “Connecting to Ray at 127.0.0.1:6379…”
- “Database initialized and tables created.”
- Flask / Werkzeug startup lines, e.g.:
  - `Running on http://127.0.0.1:5001`

Leave this running.

### 3.3 Terminal 3 – Start Ray Worker

```bash
cd /path/to/constellation
source env/bin/activate

RAY_ENABLE_WINDOWS_OR_OSX_CLUSTER=1 ray start --address=127.0.0.1:6379
```

Expected:

- Ray logs about connecting to the head.
- This terminal will block and stay open as the worker process.

Leave this running.

### 3.4 Terminal 4 – Control: Users, Worker Register, Submit, Status

```bash
cd /path/to/constellation
source env/bin/activate
```

#### 3.4.1 Create Demo Users

There are two logical roles:

- **Researcher**: uploads the project (code + dataset), starts runs, views results.
- **Volunteer / Worker**: connects their laptop to contribute compute.

The system expects **users in the database** with appropriate roles. You can create them:

- Via **API (curl)** – fastest for backend‑only demos.
- Via **Frontend (Signup page)** – for more “real” flow.

Recommended demo users:

- Researcher:
  - `email`: `researcher-demo@example.com`
  - `role`: `researcher`
- Volunteer:
  - `email`: `volunteer-demo@example.com`
  - `role`: `volunteer`

#### 3.4.2 Create Demo Users via API (curl)

In any terminal with the virtualenv activated:

```bash
cd /path/to/constellation
source env/bin/activate

curl -X POST http://127.0.0.1:5001/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Demo Researcher",
    "email": "researcher-demo@example.com",
    "role": "researcher",
    "reasons": ["demo"]
  }'

curl -X POST http://127.0.0.1:5001/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Demo Volunteer",
    "email": "volunteer-demo@example.com",
    "role": "volunteer",
    "reasons": ["demo"]
  }'
```

If you run these again and see `409` “already exists”, that is fine.

#### 3.4.3 Create Demo Users via Frontend

If the Signup page is wired:

1. Start the frontend dev server (see section 6).
2. Open `http://localhost:5173/signup`.
3. Create:
   - `Demo Researcher` (email `researcher-demo@example.com`, role `researcher`)
   - `Demo Volunteer` (email `volunteer-demo@example.com`, role `volunteer`)

For backend‑first testing, the curl option is simpler and more reliable.

#### 3.4.4 Register the Worker

Now that the volunteer account exists, register the Ray worker as a Constellation worker:

You can identify the volunteer in either way:

- `email` (easiest for manual testing), or
- `user_id` (the internal ID returned by `/api/signup` or `/api/login`).

Both are supported by `POST /api/workers/connect`.

```bash
# Option A: use email
curl -X POST http://127.0.0.1:5001/api/workers/connect \
  -H "Content-Type: application/json" \
  -d '{
    "email": "volunteer-demo@example.com",
    "worker_name": "one-laptop-worker",
    "head_node_ip": "127.0.0.1"
  }'
```

```bash
# Option B: use user_id returned by signup/login
curl -X POST http://127.0.0.1:5001/api/workers/connect \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-...from-signup-or-login...",
    "worker_name": "one-laptop-worker",
    "head_node_ip": "127.0.0.1"
  }'
```

Expected JSON:

```json
{
  "worker_id": "worker-...",
  "status": "connected",
  "user_id": "user-...",
  "email": "volunteer-demo@example.com",
  "ray_node_id": "...",
  "message": "Worker connected successfully"
}
```

You can verify:

```bash
curl http://127.0.0.1:5001/api/workers
```

Look for `worker_name: "one-laptop-worker"` and an attached volunteer `user_id` (look up that user via `email: "volunteer-demo@example.com"`).

#### 3.4.5 Submit the Small Test Project

Use the bundled `test-square` project for a quick, verified run:

```bash
curl -X POST http://127.0.0.1:5001/submit \
  -F "title=test-square-demo" \
  -F "description=fast squaring demo with 10 rows" \
  -F "py_file=@sample-projects/test-square/project.py" \
  -F "data_file=@sample-projects/test-square/dataset.csv" \
  -F "chunk_size=10" \
  -F "replication_factor=2" \
  -F "max_verification_attempts=1"
```

Expected JSON response:

```json
{
  "message": "Job submitted successfully",
  "job_id": 1,
  "run_id": "run-...",
  "project_id": "project-...",
  "total_tasks": 1
}
```

(With 10 rows and `chunk_size=10`, you get **1 task**.)

Copy the `run_id` (call it `RUN_ID`) and `job_id` (call it `JOB_ID`).

#### 3.4.6 Check Status and Results (Backend)

```bash
RUN_ID="run-...from-response"
JOB_ID=1  # replace with actual job_id

# Run-level status (includes verification + counts)
curl "http://127.0.0.1:5001/api/runs/$RUN_ID/status"

# Task list (for this run)
curl "http://127.0.0.1:5001/api/runs/$RUN_ID/tasks"

# Legacy job status endpoint (for backward compatibility)
curl "http://127.0.0.1:5001/status/$JOB_ID"

# Legacy job results endpoint
curl "http://127.0.0.1:5001/results/$JOB_ID"

# Download aggregated results as a JSON file
curl -OJ "http://127.0.0.1:5001/api/runs/$RUN_ID/results/download"
```

For the small test project (10 rows, 1 task), you should see:

- `/api/runs/$RUN_ID/status`:
  - `status: "verified"` (or `"completed"`)
  - `total_tasks: 1`
  - `completed_tasks: 1`
  - `worker_count: 1` (or more on LAN)
- `/api/runs/$RUN_ID/tasks`:
  - One task with `task_index: 0`.
- A downloaded file `results_<RUN_ID>.json` (or in `projects/<project_id>/results_<run_id>.json`):
  - Contains the aggregated result for the single task (10 rows with `"input": 1..10`, `"squared": 1..100`).

---

## 5. Terminal‑Only Demo on **Multiple Machines (LAN)**

This is similar to section 4, but:

- **Machine A** (Researcher):
  - Runs Ray head + Flask backend (Terminals 1 & 2).
  - Submits the project.
- **Machine B** (Volunteer/Worker):
  - Runs Ray worker.
  - Calls `POST /api/workers/connect` against Machine A’s backend.

Both machines must be on the same LAN.

Assume:

- Machine A IP: `192.168.1.10`
- Backend listens on port `5001` on Machine A.
- Ray head listens on `192.168.1.10:6379` (Ray script uses that IP).

### 5.1 Machine A – Researcher (Head + Backend)

**Terminal A1 – Ray head on Machine A:**

```bash
cd /path/to/constellation
source env/bin/activate

# Optional: edit scripts/start-ray-head.sh to use your LAN IP if needed
./scripts/start-ray-head.sh
```

For multi‑machine, you may want the head to advertise the LAN IP instead of `127.0.0.1`; follow comments in `scripts/start-ray-head.sh` if you change that.

**Terminal A2 – Flask backend on Machine A:**

```bash
cd /path/to/constellation
source env/bin/activate
./scripts/start-flask-with-ray.sh
```

Backend is reachable from Machine B at:

- `http://192.168.1.10:5001`

Create demo users on Machine A (same as section 3.1 but using `192.168.1.10` if you prefer):

```bash
curl -X POST http://127.0.0.1:5001/api/signup ...
```

or from Machine B targeting `http://192.168.1.10:5001`.

### 5.2 Machine B – Volunteer (Worker)

**Terminal B1 – Ray worker on Machine B:**

```bash
cd /path/to/constellation   # only needed if Ray relies on local imports
source env/bin/activate

RAY_ENABLE_WINDOWS_OR_OSX_CLUSTER=1 ray start --address=192.168.1.10:6379
```

**Terminal B2 – Register worker against Machine A’s backend:**

```bash
# Either identifier works (email or user_id)
curl -X POST http://192.168.1.10:5001/api/workers/connect \
  -H "Content-Type: application/json" \
  -d '{
    "email": "volunteer-demo@example.com",
    "worker_name": "volunteer-laptop-1",
    "head_node_ip": "192.168.1.10"
  }'
```

Expected:

```json
{
  "worker_id": "worker-...",
  "status": "connected",
  "ray_node_id": "...",
  "message": "Worker connected successfully"
}
```

You can repeat this on additional volunteer machines (B2, B3, …) to register more workers.

### 5.3 Machine A – Submit and Monitor (Terminal‑only)

Back on Machine A, use the same commands from **section 3.4.5–3.4.6**:

- Submit the `test-square-demo` (or your real project).
- Check:
  - `/api/runs/$RUN_ID/status`
  - `/api/runs/$RUN_ID/tasks`
  - `/api/workers`
  - Download results.

Expected differences:

- `worker_count` in `/api/runs/$RUN_ID/status` = number of active workers.
- Tasks and results may be distributed across different `worker_id`s in `TaskResult`.

---

## 6. Frontend‑Assisted Demo on **One Machine**

This is the same as section 4, but using the React frontend for the researcher UI.

### 6.1 Start Services (Terminals 1–3)

Follow **3.1–3.3** to start:

- Ray head (Terminal 1)
- Flask backend (Terminal 2)
- Ray worker (Terminal 3)

### 6.2 Start Frontend (Terminal 4)

```bash
cd frontend
npm install
npm run dev:web
```

Open:

- `http://localhost:5173/`

### 6.3 Create Users (Frontend or API)

If Signup page is available:

1. Go to `http://localhost:5173/signup`.
2. Create researcher/volunteer accounts as described in section 3.4.3 (emails `researcher-demo@example.com` and `volunteer-demo@example.com`).

Otherwise, use curl as in section 3.4.2.

### 6.4 Register Worker (Backend)

Worker registration is still backend/API‑only:

`/api/workers/connect` accepts either `email` or `user_id` for the volunteer identity.

```bash
cd /path/to/constellation
source env/bin/activate

curl -X POST http://127.0.0.1:5001/api/workers/connect \
  -H "Content-Type: application/json" \
  -d '{
    "email": "volunteer-demo@example.com",
    "worker_name": "one-laptop-worker",
    "head_node_ip": "127.0.0.1"
  }'
```

### 6.5 Submit Project from Frontend

1. Open `http://localhost:5173/submit`.
2. Fill:
   - Title: `test-square-demo`
   - Description: `fast squaring demo (10 rows, 1 task)`
   - Python file: `sample-projects/test-square/project.py`
   - Dataset file: `sample-projects/test-square/dataset.csv`
   - Chunk size: `10`
   - Replication factor: `2`
   - Max verification attempts: `1`
3. Click **Submit Project**.

The frontend will:

- POST to `/submit`.
- Display a message including the `run_id`/`job_id`.
- Poll `/status/<job_id>` for status changes.

Expected:

- Status transitions from “submitted/running” to “complete/verified” within a few seconds.
- Results appear in the UI when the job is complete.

If you have a dashboard page wired to `/api/runs/<run_id>/status`, it can also show:

- Total tasks vs completed tasks using `completed_tasks / total_tasks`.
- Worker count.

---

## 7. Frontend‑Assisted Demo on **Multiple Machines (LAN)**

This generalizes section 6 to multiple laptops:

- Machine A:
  - Runs Ray head + Flask backend + frontend dev server.
- Machine B (and others):
  - Run Ray workers and register to Machine A.

Key differences:

- Frontend base URL on volunteers should point to Machine A:
  - `http://192.168.1.10:5173` (assuming Vite dev server bound to 0.0.0.0).
- Backend base URL (used by frontend) should be `http://192.168.1.10:5001`.

Researcher flow:

1. On Machine A, open `http://localhost:5173/` to use the researcher UI.
2. On volunteers, optionally open the same UI in a browser pointing at `http://192.168.1.10:5173` (for a “volunteer view”), or just run workers via terminal.
3. Researcher uses the Submit page and any dashboard page to:
   - Start runs,
   - Watch verification and progress,
   - Download results.

Volunteers:

1. Run Ray worker:
   - `ray start --address=192.168.1.10:6379`
2. Register via API:
   - `POST http://192.168.1.10:5001/api/workers/connect` with `email` (or `user_id`), `worker_name`, and `head_node_ip` (`192.168.1.10`).

From the researcher UI and backend APIs, you should see:

- Multiple workers registered in `/api/workers`.
- `worker_count` > 1 in `/api/runs/<run_id>/status`.
- Results verified across all tasks, with distribution across workers in `TaskResult`.

---

## 8. Expected Outputs Summary

For a successful small demo (`test-square-demo`):

- **Backend:**
  - `/api/runs/<run_id>/status`:
    - `status: "verified"` (or `"completed"`)
    - `total_tasks: 1`
    - `completed_tasks: 1`
    - `failed_tasks: 0`
    - `worker_count: 1` (or >1 on LAN demo)
  - Results in `projects/<project_id>/results_<run_id>.json` (or downloaded):
    - 1 task result containing 10 rows: `input: 1..10`, `squared: 1..100`.

- **Frontend Submit Page:**
  - Shows “Job submitted” message with `run_id` and/or `job_id`.
  - Status label goes from “running” to “complete”.
  - Results area shows the JSON results once done.

- **Workers Endpoint (`/api/workers`):**
  - At least one entry with:
    - `worker_name: "one-laptop-worker"`
    - `user_id` set (matching the volunteer account for `volunteer-demo@example.com`)
    - `status: "online"`

Once this is working, you can scale up to larger datasets and heavier compute functions, and/or add more workers on the LAN to show real speedups. 

