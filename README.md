# 🌌 Constellation

**Constellation** is a distributed computing platform that connects researchers with volunteers who contribute spare computing power to accelerate scientific discovery.

Researchers can upload computational projects, which are broken into small tasks and distributed across participating machines. Volunteers earn recognition for their contributions while supporting real-world research in areas like climate modeling, biology, and AI.

The system is built on **Ray**, enabling scalable task distribution, progress tracking, and result aggregation. Future iterations will include security mechanisms for sandboxing and verification to ensure correctness and trustworthiness across volunteer devices.

### Backend Setup

1. **Navigate to the project directory:**
   cd constellation
2. **Create and activate a virtual environment:**
    python3 -m venv env
    source env/bin/activate  # On Windows: env\Scripts\activate
3. **Install Python dependencies:**
    python3 -m pip install -r requirements.txt
4. **Initialize the database:**
    python3 -c "from backend.core.database import init_db; init_db()"
5. **Run the Flask backend server:**

   **Option B (recommended on macOS/Windows):** Start the Ray head first, then Flask. Use two terminals:

   **Terminal 1 – start Ray head:**
   ```bash
   ./scripts/start-ray-head.sh
   ```
   (On macOS/Windows this sets `RAY_ENABLE_WINDOWS_OR_OSX_CLUSTER=1` so the cluster accepts workers.)

   **Terminal 2 – start Flask (connects to existing Ray head):**
   ```bash
   ./scripts/start-flask-with-ray.sh
   ```
   Or manually: `export RAY_ADDRESS=127.0.0.1:6379 && python3 -m flask --app backend.app run --host 0.0.0.0 --port 5001`

   **Single-command option:** If you prefer one terminal and no `RAY_ADDRESS` set, run:
   ```bash
   unset RAY_ADDRESS
   python3 -m flask --app backend.app run --reload --host 0.0.0.0 --port 5001
   ```
   The backend will start a Ray head automatically when needed (may require Ray to be on PATH).

   The backend API will be available at `http://localhost:5001`

### Frontend Setup

1. **Navigate to the frontend directory:**
   cd frontend
2. **Install Node.js dependencies:**
   npm install
3. **Run the development server:**   
   npm run dev:web
      The frontend will be available at `http://localhost:5173`

## Usage

1. **Submit a Project:**
   - Navigate to `http://localhost:5173/submit`
   - Enter project title and description
   - Upload a Python script (must contain a `main(row)` function)
   - Upload a CSV or JSON dataset
   - Click "Submit Project"

2. **Monitor Status:**
   - Status automatically updates every 2 seconds
   - Status transitions: `submitted` → `running` → `complete`
   - Results are automatically fetched when the job completes

3. **View Results:**
   - Results appear automatically when status becomes `complete`
   - Results are displayed in JSON format below the status

## Multi-Machine Setup (Distributed Computing)

Constellation supports distributed computing across multiple machines on the same local network. This allows volunteers to contribute their computing power to accelerate research projects.

### Quick Start

1. **Researcher starts head node:**
   ```bash
   # Start Flask server
   python3 -m flask --app backend.app run --host 0.0.0.0 --port 5000
   
   # Start Ray head node
   curl -X POST http://localhost:5000/api/cluster/start-head \
     -H "Content-Type: application/json" \
     -d '{"researcher_id": "user-123"}'
   ```

2. **Volunteers connect their machines:**
   ```bash
   curl -X POST http://<HEAD_NODE_IP>:5000/api/workers/connect \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": "user-456",
       "worker_name": "MyLaptop",
       "head_node_ip": "192.168.1.100"
     }'
   ```

3. **Submit projects as usual** - tasks will automatically distribute across all connected workers.

### Requirements

- All machines on the same Wi-Fi network
- Ray installed on all machines: `pip install ray`
- User accounts with appropriate roles (researcher/volunteer) in the database

### Detailed Setup

For complete multi-machine setup instructions, API documentation, troubleshooting, and security notes, see **[WORKER_SETUP.md](WORKER_SETUP.md)**.

### Features

- **Automatic task distribution:** Ray automatically distributes tasks across all connected workers
- **Worker tracking:** System tracks which user's machine executed each task
- **Role-based access:** Only users with 'volunteer' role can connect workers
- **Real-time sync:** Workers are automatically registered and updated in the database
