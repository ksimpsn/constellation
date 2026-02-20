"""
Constellation Flask API

Need to expose endpoints for:
  - submitting jobs
  - checking status
  - retrieving results

Later, it will connect to:
  backend/core/api.py → ConstellationAPI → Cluster (Ray)
"""

from flask import Flask, request, jsonify, Response
from backend.core.api import ConstellationAPI
from backend.core.database import (
    init_db,
    get_user_by_id, user_has_role, register_worker, get_session, create_user,
    get_project, get_run, get_all_projects, get_runs_for_project, get_tasks_for_run,
    get_all_workers, get_task_results_for_run,
)
from backend.core.server import Cluster
import os
import uuid
import logging
import ray
import socket
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)
# More explicit CORS configuration for file uploads
CORS(app)
# CORS(app, 
#      origins="http://localhost:5173",
#      methods=["GET", "POST", "OPTIONS"],
#      allow_headers=["Content-Type"],
#      supports_credentials=False)

# Ensure DB tables exist on startup (idempotent; safe if already initialized)
init_db()

# Module-level variable that persists across Flask reloads
_api_instance = None

def get_api():
    global _api_instance
    if _api_instance is None:
        _api_instance = ConstellationAPI()
    return _api_instance

api = get_api()


def get_connected_worker_count():
    """Number of non-head Ray nodes currently connected (workers only)."""
    if not ray.is_initialized():
        return 0
    try:
        nodes = ray.nodes()
        alive = [n for n in nodes if n.get("Alive") is True]
        return max(0, len(alive) - 1)
    except Exception:
        return 0


# -------------------------------------------------
# Routes
# -------------------------------------------------

@app.route("/", methods=["GET"])
def home():
    """
    Health check / test route.
    Lets you verify the API is running.
    """
    return jsonify({
        "message": "Welcome to the Constellation API!",
        "status": "running"
    }), 200

@app.route("/submit", methods=["OPTIONS"])
def submit_options():
    """Handle preflight OPTIONS request explicitly"""
    response = jsonify({})
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type")
    response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
    return response, 200

@app.route("/submit", methods=["POST"])
def submit_job():
    # """
    # Endpoint: POST /submit
    # Purpose: Accept a new computation job from the researcher.
    # Input: JSON payload like {"data": [1, 2, 3, 4]}
    # Output: {"job_id": "<some id>"}
    # """

    # payload = request.get_json()

    # if not payload or "data" not in payload:
    #     return jsonify({"error": "Missing 'data' field in request"}), 400

    # data = payload["data"]

    # job_id = api.submit_project(data)

    # return jsonify({
    #     "message": "Job submitted successfully.",
    #     "job_id": job_id
    # }), 200

    
    title = request.form.get("title")
    description = request.form.get("description")
    py_file = request.files.get("py_file")
    data_file = request.files.get("data_file")

    if not title or not py_file or not data_file:
        return jsonify({"error": "Missing required fields"}), 400

    # Save temp files
    os.makedirs("tmp", exist_ok=True)
    py_path = os.path.join("tmp", py_file.filename)
    data_path = os.path.join("tmp", data_file.filename)

    py_file.save(py_path)
    data_file.save(data_path)

    # detect file type (csv vs json)
    ext = data_file.filename.lower().split(".")[-1]
    if ext not in ("csv", "json"):
        return jsonify({"error": "Dataset must be CSV or JSON"}), 400

    chunk_size = 1000
    chunk_size_param = request.form.get("chunk_size")
    if chunk_size_param is not None:
        try:
            chunk_size = int(chunk_size_param)
            if chunk_size < 1:
                chunk_size = 1000
        except ValueError:
            pass

    # ✨ CALL THE CORRECT API FUNCTION
    result = api.submit_uploaded_project(
        code_path=py_path,
        dataset_path=data_path,
        file_type=ext,
        func_name="main",  # optional
        title=title.strip(),
        description=(description or "").strip(),
        chunk_size=chunk_size,
    )

    return jsonify({
        "message": "Job submitted successfully",
        "job_id": result["job_id"],
        "run_id": result["run_id"],
        "project_id": result["project_id"],
        "total_tasks": result.get("total_tasks"),
    }), 200

@app.route("/status/<int:job_id>", methods=["GET"])
def get_status(job_id):
    """
    Endpoint: GET /status/<job_id>
    Purpose: Check progress or completion state of a specific job.
    Output: {"job_id": ..., "status": ...}
    """
    status = api.check_status(job_id)

    return jsonify({
        "job_id": job_id,
        "status": status
    }), 200


@app.route("/results/<int:job_id>", methods=["GET"])
def get_results(job_id):
    """
    Endpoint: GET /results/<job_id>
    Purpose: Return results once computation is complete.
    Output: {"job_id": ..., "results": ...}
    """
    results = api.get_results(job_id)

    # Step 2: Return response
    return jsonify({
        "job_id": job_id,
        "results": results
    }), 200


@app.route("/api/signup", methods=["POST"])
def signup():
    """
    Endpoint: POST /api/signup
    Purpose: Register a new user (researcher and/or volunteer).
    Request body: { "full_name", "email", "user_id", "role" } (role: researcher, volunteer, or researcher,volunteer)
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing request body"}), 400
        full_name = data.get("full_name") or data.get("name")
        email = data.get("email")
        user_id = data.get("user_id")
        role = data.get("role", "volunteer")
        if not all([full_name, email, user_id]):
            return jsonify({"error": "Missing required fields: full_name, email, and user_id"}), 400
        valid_roles = ("researcher", "volunteer", "researcher,volunteer")
        if role not in valid_roles:
            return jsonify({"error": f"role must be one of: {valid_roles}"}), 400
        user, err = create_user(user_id=user_id, email=email, name=full_name, role=role)
        if err:
            return jsonify({"error": err}), 409
        return jsonify({"user_id": user.user_id, "message": "User registered successfully"}), 201
    except Exception as e:
        logging.error(f"[ERROR] Signup: {e}")
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------
# Dashboard and stats API (Phase 1.2)
# -------------------------------------------------

def _project_to_dict(p):
    return {
        "project_id": p.project_id,
        "researcher_id": p.researcher_id,
        "title": p.title,
        "description": p.description or "",
        "status": p.status,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }


def _run_to_dict(r, worker_count=None, completed_tasks_override=None):
    d = {
        "run_id": r.run_id,
        "project_id": r.project_id,
        "status": r.status,
        "total_tasks": r.total_tasks,
        "completed_tasks": completed_tasks_override if completed_tasks_override is not None else r.completed_tasks,
        "failed_tasks": r.failed_tasks,
        "started_at": r.started_at.isoformat() if r.started_at else None,
        "completed_at": r.completed_at.isoformat() if r.completed_at else None,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }
    if worker_count is not None:
        d["worker_count"] = worker_count
    return d


def _task_to_dict(t):
    return {
        "task_id": t.task_id,
        "run_id": t.run_id,
        "task_index": t.task_index,
        "status": t.status,
        "assigned_worker_id": t.assigned_worker_id,
        "assigned_at": t.assigned_at.isoformat() if t.assigned_at else None,
        "started_at": t.started_at.isoformat() if t.started_at else None,
        "completed_at": t.completed_at.isoformat() if t.completed_at else None,
        "error_message": t.error_message,
    }


def _worker_to_dict(w):
    return {
        "worker_id": w.worker_id,
        "user_id": w.user_id,
        "worker_name": w.worker_name,
        "ip_address": w.ip_address,
        "status": w.status,
        "cpu_cores": w.cpu_cores,
        "last_heartbeat": w.last_heartbeat.isoformat() if w.last_heartbeat else None,
        "tasks_completed": w.tasks_completed,
        "tasks_failed": w.tasks_failed,
    }


@app.route("/api/projects", methods=["GET"])
def list_projects():
    """GET /api/projects - list projects (optional ?researcher_id=)."""
    researcher_id = request.args.get("researcher_id")
    projects = get_all_projects(researcher_id=researcher_id)
    return jsonify({"projects": [_project_to_dict(p) for p in projects]}), 200


@app.route("/api/projects/<project_id>", methods=["GET"])
def get_project_route(project_id):
    """GET /api/projects/<project_id> - get one project."""
    p = get_project(project_id)
    if not p:
        return jsonify({"error": "Project not found"}), 404
    return jsonify(_project_to_dict(p)), 200


@app.route("/api/projects/<project_id>/runs", methods=["GET"])
def list_runs_for_project(project_id):
    """GET /api/projects/<project_id>/runs - list runs for a project."""
    if not get_project(project_id):
        return jsonify({"error": "Project not found"}), 404
    runs = get_runs_for_project(project_id)
    connected = get_connected_worker_count()
    return jsonify({"runs": [_run_to_dict(r, worker_count=connected) for r in runs]}), 200


@app.route("/api/runs/<run_id>", methods=["GET"])
@app.route("/api/runs/<run_id>/status", methods=["GET"])
def get_run_status_route(run_id):
    """GET /api/runs/<run_id> or /api/runs/<run_id>/status - run status with connected workers and task progress."""
    r = get_run(run_id)
    if not r:
        return jsonify({"error": "Run not found"}), 404
    worker_count = get_connected_worker_count()
    completed_override = None
    if r.status in ("running", "pending"):
        progress = api.get_run_progress(run_id)
        if progress is not None:
            completed_override = progress[0]
    return jsonify(_run_to_dict(r, worker_count=worker_count, completed_tasks_override=completed_override)), 200


@app.route("/api/runs/<run_id>/tasks", methods=["GET"])
def list_tasks_for_run(run_id):
    """GET /api/runs/<run_id>/tasks - list tasks for a run."""
    if not get_run(run_id):
        return jsonify({"error": "Run not found"}), 404
    tasks = get_tasks_for_run(run_id)
    return jsonify({"tasks": [_task_to_dict(t) for t in tasks]}), 200


@app.route("/api/workers", methods=["GET"])
def list_workers():
    """GET /api/workers - list all workers."""
    workers = get_all_workers()
    return jsonify({"workers": [_worker_to_dict(w) for w in workers]}), 200


@app.route("/api/runs/<run_id>/results/download", methods=["GET"])
def download_run_results(run_id):
    """GET /api/runs/<run_id>/results/download - download aggregated results as JSON file."""
    r = get_run(run_id)
    if not r:
        return jsonify({"error": "Run not found"}), 404
    results = get_task_results_for_run(run_id)
    payload = {
        "run_id": run_id,
        "project_id": r.project_id,
        "total_tasks": r.total_tasks,
        "completed_tasks": r.completed_tasks,
        "failed_tasks": r.failed_tasks,
        "results": results,
    }
    import json as json_module
    body = json_module.dumps(payload, indent=2)
    resp = Response(body, mimetype="application/json")
    resp.headers["Content-Disposition"] = f'attachment; filename="results_{run_id}.json"'
    return resp


@app.route("/api/workers/register", methods=["POST"])
def register_worker_endpoint():
    """
    Endpoint: POST /api/workers/register
    Purpose: Register a volunteer's machine as a worker after they have run
             'RAY_ENABLE_WINDOWS_OR_OSX_CLUSTER=1 ray start --address=<head_ip>:6379'
             on their machine (required on macOS/Windows; optional on Linux).
    Request body: { "user_id", "worker_name" }
    Does NOT call ray.init; matches request.remote_addr to Ray node NodeManagerAddress.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing request body"}), 400
        user_id = data.get("user_id")
        worker_name = data.get("worker_name")
        if not user_id or not worker_name:
            return jsonify({"error": "Missing required fields: user_id, worker_name"}), 400
        user = get_user_by_id(user_id)
        if not user:
            return jsonify({"error": f"User {user_id} not found"}), 404
        if not user_has_role(user_id, "volunteer"):
            return jsonify({"error": f"User {user_id} does not have 'volunteer' role"}), 403
        if not ray.is_initialized():
            return jsonify({"error": "Ray cluster not running; start head node first"}), 503
        client_ip = request.remote_addr
        nodes = ray.nodes()
        # When request is from 127.0.0.1, also match workers that report the host's LAN IP (same machine).
        head_addr = None
        for node in nodes:
            if not node.get("Alive", False):
                continue
            res = node.get("Resources") or {}
            if res.get("node:__internal_head__"):
                head_addr = node.get("NodeManagerAddress") or ""
                break
        matching_node = None
        for node in nodes:
            if not node.get("Alive", False):
                continue
            res = node.get("Resources") or {}
            if res.get("node:__internal_head__"):
                continue  # never register the head as a worker
            node_addr = node.get("NodeManagerAddress") or ""
            if node_addr == client_ip or (client_ip == "127.0.0.1" and node_addr in ("127.0.0.1", "localhost")):
                matching_node = node
                break
            if client_ip == "127.0.0.1" and head_addr and node_addr == head_addr:
                matching_node = node
                break
        if not matching_node:
            return jsonify({
                "error": "No Ray worker found for your IP. Run 'RAY_ENABLE_WINDOWS_OR_OSX_CLUSTER=1 ray start --address=<head_ip>:6379' on this machine first (required on macOS/Windows).",
                "your_ip": client_ip
            }), 400
        node_id = matching_node.get("NodeID")
        resources = matching_node.get("Resources", {})
        cpu_cores = int(resources.get("CPU", 0)) if resources.get("CPU") else None
        memory_gb = (resources.get("memory", 0) / (1024**3)) if resources.get("memory") else None
        with get_session() as session:
            from backend.core.database import Worker
            existing = session.query(Worker).filter_by(ray_node_id=node_id).first()
            if existing:
                existing.worker_name = worker_name
                existing.user_id = user_id
                existing.ip_address = client_ip
                existing.cpu_cores = cpu_cores
                existing.memory_gb = memory_gb
                existing.last_heartbeat = datetime.utcnow()
                existing.status = "online"
                session.commit()
                session.refresh(existing)
                worker = existing
                worker_id = existing.worker_id
            else:
                worker_id = f"worker-{uuid.uuid4()}"
                worker = register_worker(
                    worker_id=worker_id,
                    worker_name=worker_name,
                    user_id=user_id,
                    ip_address=client_ip,
                    cpu_cores=cpu_cores,
                    memory_gb=memory_gb,
                    ray_node_id=node_id
                )
        return jsonify({
            "worker_id": worker_id,
            "status": "registered",
            "ray_node_id": node_id,
            "message": "Worker registered successfully"
        }), 200
    except Exception as e:
        logging.error(f"[ERROR] register_worker: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/workers/connect", methods=["POST"])
def connect_worker():
    """
    Endpoint: POST /api/workers/connect
    Purpose: Allow volunteers to connect their machines as workers to the Ray cluster.
    
    Request body:
    {
        "user_id": "user-123",
        "worker_name": "MyLaptop",
        "head_node_ip": "192.168.1.100"
    }
    
    Response:
    {
        "worker_id": "worker-abc123",
        "status": "connected",
        "ray_node_id": "ray-node-xyz",
        "message": "Worker connected successfully"
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing request body"}), 400
        
        user_id = data.get("user_id")
        worker_name = data.get("worker_name")
        head_node_ip = data.get("head_node_ip")
        
        # Validate required fields
        if not user_id or not worker_name or not head_node_ip:
            return jsonify({
                "error": "Missing required fields: user_id, worker_name, and head_node_ip are required"
            }), 400
        
        # Validate user exists and has 'volunteer' role
        user = get_user_by_id(user_id)
        if not user:
            return jsonify({"error": f"User {user_id} not found"}), 404
        
        if not user_has_role(user_id, "volunteer"):
            return jsonify({
                "error": f"User {user_id} does not have 'volunteer' role. Current role: {user.role}"
            }), 403
        
        # Connect to Ray head node
        # Note: This connection happens on the head node's machine when the endpoint is called
        # For true distributed setup, the volunteer would need to run Ray locally and connect
        # For now, we'll initialize Ray connection and get node info
        try:
            # Format head address: Ray uses port 10001 for client connections
            if ":" not in head_node_ip:
                head_address = f"ray://{head_node_ip}:10001"
            else:
                # If port is provided, use it
                head_address = f"ray://{head_node_ip}"
            
            # Check if Ray is already initialized (might be on head node)
            if not ray.is_initialized():
                # Initialize Ray connection to head node
                # Note: This will connect to the head node's Ray cluster
                ray.init(address=head_address, ignore_reinit_error=True)
                logging.info(f"[INFO] Connected to Ray head node at {head_address}")
            else:
                logging.info("[INFO] Ray already initialized")
            
            # Get Ray runtime context to identify this node
            runtime_context = ray.get_runtime_context()
            ray_node_id = runtime_context.get_node_id()
            ray_worker_id = runtime_context.get_worker_id()
            
            # Get node information
            nodes = ray.nodes()
            current_node = None
            for node in nodes:
                if node.get("NodeID") == ray_node_id:
                    current_node = node
                    break
            
            # Extract node information
            ip_address = current_node.get("NodeManagerAddress") if current_node else head_node_ip
            resources = current_node.get("Resources", {}) if current_node else {}
            cpu_cores = int(resources.get("CPU", 0)) if resources else None
            memory_gb = resources.get("memory", 0) / (1024**3) if resources.get("memory") else None
            
            # Generate worker_id
            worker_id = f"worker-{uuid.uuid4()}"
            
            # Register worker in database
            worker = register_worker(
                worker_id=worker_id,
                worker_name=worker_name,
                user_id=user_id,
                ip_address=ip_address,
                cpu_cores=cpu_cores,
                memory_gb=memory_gb,
                ray_node_id=ray_node_id
            )
            
            logging.info(f"[INFO] Registered worker {worker_id} for user {user_id}")
            
            return jsonify({
                "worker_id": worker_id,
                "status": "connected",
                "ray_node_id": ray_node_id,
                "ray_worker_id": ray_worker_id,
                "ip_address": ip_address,
                "message": "Worker connected successfully"
            }), 200
            
        except Exception as e:
            logging.error(f"[ERROR] Failed to connect to Ray head node: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({
                "error": f"Failed to connect to Ray head node at {head_node_ip}: {str(e)}"
            }), 500
            
    except Exception as e:
        logging.error(f"[ERROR] Error in connect_worker endpoint: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/cluster/start-head", methods=["POST"])
def start_head():
    """
    Endpoint: POST /api/cluster/start-head
    Purpose: Allow researcher to start the Ray head node with remote connections enabled.
    
    Request body (optional):
    {
        "researcher_id": "user-456"  // Optional: validate researcher role
    }
    
    Response:
    {
        "status": "started",
        "head_node_ip": "192.168.1.100",
        "ray_port": 6379,
        "message": "Head node started. Workers can connect to this IP."
    }
    """
    try:
        data = request.get_json() or {}
        researcher_id = data.get("researcher_id")
        
        # Validate researcher role if researcher_id is provided
        # Note: researcher_id is optional - if not provided, head node will start without validation
        if researcher_id:
            user = get_user_by_id(researcher_id)
            if not user:
                logging.warning(f"[WARNING] User {researcher_id} not found, but continuing without validation")
                # Don't fail - allow head node to start without user validation for testing
                # return jsonify({"error": f"User {researcher_id} not found"}), 404
            elif not user_has_role(researcher_id, "researcher"):
                return jsonify({
                    "error": f"User {researcher_id} does not have 'researcher' role. Current role: {user.role}"
                }), 403
        
        # Get local IP address
        def get_local_ip():
            """Get local IP address."""
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            try:
                s.connect(('8.8.8.8', 80))
                ip = s.getsockname()[0]
            except:
                ip = '127.0.0.1'
            finally:
                s.close()
            return ip
        
        local_ip = get_local_ip()
        
        # Check if Ray is already initialized
        if ray.is_initialized():
            # If already initialized, check if it's in head mode
            # For now, we'll just return the current status
            logging.info("[INFO] Ray already initialized, returning current head node info")
            nodes = ray.nodes()
            return jsonify({
                "status": "already_running",
                "head_node_ip": local_ip,
                "ray_port": 6379,
                "connected_nodes": len(nodes),
                "message": "Head node is already running. Workers can connect to this IP."
            }), 200
        
        # Start Ray head node
        try:
            # Initialize Ray head node with remote connections enabled
            # Note: The server.py start_cluster() method needs to support mode="head"
            # For now, we'll initialize directly here
            cluster = Cluster()
            
            # Try to start cluster in head mode
            # If start_cluster doesn't support mode parameter yet, we'll initialize directly
            try:
                # Attempt to call with mode parameter (if supported)
                cluster.start_cluster(mode="head")
            except TypeError:
                # Fallback: initialize Ray directly as head node
                logging.info("[INFO] Starting Ray head node directly (start_cluster doesn't support mode yet)")
                cluster.context = ray.init(address="auto", _node_ip_address="0.0.0.0", port=6379)
                logging.info("[INFO] Ray head node started on port 6379 (allowing remote connections)")
            
            # Get cluster information
            resources = ray.cluster_resources()
            nodes = ray.nodes()
            
            # Check if head node accepts remote connections
            remote_ready = False
            head_node_address = None
            for node in nodes:
                if node.get("Alive", False):
                    head_node_address = node.get("NodeManagerAddress", "unknown")
                    # Check if listening on 0.0.0.0 or external IP (not just 127.0.0.1)
                    if head_node_address == "0.0.0.0" or (head_node_address != "127.0.0.1" and head_node_address != local_ip):
                        remote_ready = True
                    break
            
            logging.info(f"[INFO] Head node started successfully at {local_ip}:6379")
            logging.info(f"[INFO] {len(nodes)} Ray node(s) connected")
            if remote_ready:
                logging.info("[INFO] Head node is ready for remote worker connections")
            else:
                logging.warning("[WARNING] Head node may not accept remote connections. For same-machine demo use scripts/start-ray-head.sh (uses --node-ip-address=127.0.0.1).")
            
            return jsonify({
                "status": "started",
                "head_node_ip": local_ip,
                "ray_port": 6379,
                "connected_nodes": len(nodes),
                "remote_ready": remote_ready,
                "head_node_address": head_node_address,
                "resources": {
                    "cpu": resources.get("CPU", 0),
                    "memory_gb": resources.get("memory", 0) / (1024**3) if resources.get("memory") else 0
                },
                "message": f"Head node started. Workers can connect to {local_ip}:6379" if remote_ready else f"Head node started at {local_ip}:6379, but may not accept remote connections. Start Ray manually for full remote support."
            }), 200
            
        except Exception as e:
            logging.error(f"[ERROR] Failed to start Ray head node: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({
                "error": f"Failed to start Ray head node: {str(e)}"
            }), 500
            
    except Exception as e:
        logging.error(f"[ERROR] Error in start_head endpoint: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------
# Server Entry Point
# -------------------------------------------------
if __name__ == "__main__":
    """
    Run the Flask development server.
    In production, you’ll use Gunicorn or uvicorn instead.
    """
    app.run(host="0.0.0.0", port=5000, debug=True)