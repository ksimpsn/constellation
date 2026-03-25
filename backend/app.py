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
    get_user_by_id,
    user_has_role,
    register_worker,
    get_session,
    get_researcher_projects_with_stats,
    create_user,
    get_user_by_email,
    init_db,
    list_browse_projects,
    normalize_roles_input,
    set_user_roles,
)
from backend.core.database_aws import init_aws_db, get_aws_project_ip, update_aws_project_ip
from backend.core.server import Cluster
import os
import uuid
import logging
import ray
import socket
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)
# CORS configuration - allow all origins for development
# This fixes "failed to fetch" errors by allowing cross-origin requests
CORS(app,
     origins="*",  # Allow all origins in development
     methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"],
     allow_headers=["Content-Type", "Authorization"],
     supports_credentials=False)

# Ensure SQLite tables exist (runs, tasks, workers, task_results, jobs)
init_db()
# Optional: connect to AWS RDS for users, researchers, projects, project_users
init_aws_db()

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
        "status": "running",
        "endpoints": {
            "debug_researcher": "/api/researcher/debug-id",
            "researcher_projects": "/api/researcher/<researcher_id>/projects",
            "debug_users": "/api/debug-users",
            "browse_projects": "/api/projects/browse",
        }
    }), 200


@app.route("/api/projects/browse", methods=["GET", "OPTIONS"])
def browse_projects_list():
    """Public list of active projects for the Browse Projects page."""
    try:
        projects = list_browse_projects()
        return jsonify({"projects": projects}), 200
    except Exception as e:
        logging.error(f"[ERROR] browse_projects_list: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


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
    replication_factor = request.form.get("replication_factor", type=int) or 2
    max_verification_attempts = request.form.get("max_verification_attempts", type=int) or 2

    if not title or not py_file or not data_file:
        return jsonify({"error": "Missing required fields"}), 400

    user_id = request.form.get("user_id")
    if not user_id:
        return jsonify({"error": "Sign in required to submit projects"}), 401
    if not get_user_by_id(user_id):
        return jsonify({"error": "Unknown user"}), 403
    if not user_has_role(user_id, "researcher"):
        return jsonify({"error": "Only accounts with the researcher role can submit projects"}), 403

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

    try:
        chunk_size = int(request.form.get("chunk_size", 1000))
    except (TypeError, ValueError):
        chunk_size = 1000
    try:
        replication_factor = int(request.form.get("replication_factor", 2))
    except (TypeError, ValueError):
        replication_factor = 2
    try:
        max_verification_attempts = int(request.form.get("max_verification_attempts", 2))
    except (TypeError, ValueError):
        max_verification_attempts = 2

    # Start Ray head on the researcher's machine (idempotent if already running)
    try:
        head_ip = api.start_ray_head()
    except Exception as e:
        logging.error(f"[ERROR] Failed to start Ray head: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to start Ray head node: {str(e)}"}), 500

    out = api.submit_uploaded_project(
        code_path=py_path,
        dataset_path=data_path,
        file_type=ext,
        func_name="main",
        title=title,
        description=description or "",
        chunk_size=chunk_size,
        replication_factor=replication_factor,
        max_verification_attempts=max_verification_attempts,
        researcher_id=user_id,
        head_ip=head_ip,
    )
    job_id, run_id, project_id, total_tasks = out

    return jsonify({
        "message": "Job submitted successfully",
        "job_id": job_id,
        "run_id": run_id,
        "project_id": project_id,
        "total_tasks": total_tasks,
        "head_ip": head_ip,
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


@app.route("/progress/<int:job_id>", methods=["GET"])
def get_progress(job_id):
    """
    Endpoint: GET /progress/<job_id>
    Purpose: Return live progress details for a specific job/run.
    """
    try:
        progress = api.get_progress(job_id)
        return jsonify(progress), 200
    except Exception as e:
        return jsonify({
            "error": str(e),
            "job_id": job_id
        }), 404


@app.route("/results/<int:job_id>", methods=["GET"])
def get_results(job_id):
    """
    Endpoint: GET /results/<job_id>
    Purpose: Return results once computation is complete.
    Output: {"job_id": ..., "results": ...}
    """
    try:
        results = api.get_results(job_id)
        return jsonify({
            "job_id": job_id,
            "results": results
        }), 200
    except ValueError as e:
        # e.g. verification disputed — verified outputs withheld
        logging.warning("get_results: %s", e)
        return jsonify({
            "error": str(e),
            "job_id": job_id
        }), 409
    except Exception as e:
        message = str(e)
        if "not ready yet" in message or "queued" in message:
            return jsonify({
                "job_id": job_id,
                "status": "processing",
                "message": message
            }), 202
        logging.exception("get_results failed")
        return jsonify({
            "error": message,
            "job_id": job_id
        }), 500


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
        role = data.get("role")
        roles = data.get("roles")
        reasons = data.get("reasons", [])

        # Validate required fields
        if not full_name or not email:
            return jsonify({
                "error": "Missing required fields: name and email are required"
            }), 400

        if roles is None and not role:
            return jsonify({
                "error": "Missing roles: send 'roles' (array) or legacy 'role' (string)"
            }), 400

        try:
            role_string = normalize_roles_input(role=role, roles=roles)
        except ValueError as e:
            return jsonify({"error": str(e)}), 400

        # Initialize database if needed
        init_db()

        # Check if user already exists
        existing_user = get_user_by_email(email)
        if existing_user:
            return jsonify({
                "error": f"User with email {email} already exists",
                "user_id": getattr(existing_user, "user_id", None),
                "role": getattr(existing_user, "role", role),
            }), 409

        user_id = (request.get_json() or {}).get("user_id") or email.split("@")[0].replace(".", "_")
        user, err = create_user(user_id=user_id, email=email, name=full_name, role=role_string)
        if err:
            return jsonify({"error": err}), 409
        if not user:
            return jsonify({"error": "AWS database not configured. Set AWS_DATABASE_URL to create users."}), 503

        logging.info(f"[INFO] Created new user: {user.user_id} ({role_string})")

        return jsonify({
            "success": True,
            "user_id": user.user_id,
            "email": user.email,
            "role": user.role,
            "message": "User created successfully"
        }), 201

    except Exception as e:
        logging.error(f"[ERROR] Signup: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/user/roles", methods=["PATCH", "OPTIONS"])
def patch_user_roles():
    """
    Update which roles an account has (researcher / volunteer / both).
    Body: { "user_id": "...", "roles": ["researcher"] | ["volunteer"] | both }
    """
    if request.method == "OPTIONS":
        return "", 200
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing request body"}), 400
        user_id = data.get("user_id")
        roles = data.get("roles")
        if not user_id or roles is None:
            return jsonify({"error": "user_id and roles are required"}), 400
        try:
            role_string = normalize_roles_input(roles=roles)
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        user = set_user_roles(user_id, role_string)
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify({
            "success": True,
            "user_id": user.user_id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
        }), 200
    except Exception as e:
        logging.error(f"[ERROR] patch_user_roles: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/login", methods=["POST", "OPTIONS"])
def login():
    """POST /api/login — authenticate by email; body: { "email" }."""
    if request.method == "OPTIONS":
        return "", 200
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing request body"}), 400
        email = (data.get("email") or "").strip()
        if not email:
            return jsonify({"error": "email is required"}), 400
        user = get_user_by_email(email)
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify({
            "user_id": user.user_id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
        }), 200
    except Exception as e:
        logging.error(f"[ERROR] login: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/researcher/<researcher_id>/projects", methods=["GET", "OPTIONS"])
def get_researcher_projects(researcher_id):
    """
    Endpoint: GET /api/researcher/<researcher_id>/projects
    Purpose: Get all projects for a researcher with aggregated statistics.

    Response:
    {
        "projects": [
            {
                "id": "project-123",
                "title": "Project Title",
                "description": "Description",
                "progress": 75,
                "resultUrl": "/results/project-123.json",
                "totalContributors": 50,
                "activeContributors": 10,
                "completedContributors": null,
                "totalTasks": 1000,
                "completedTasks": 750,
                "failedTasks": 5,
                "createdAt": "2024-01-15T10:00:00",
                "updatedAt": "2024-03-20T14:30:00",
                "totalRuns": 2,
                "averageTaskTime": 45.2
            },
            ...
        ]
    }
    """
    try:
        # Validate user exists
        user = get_user_by_id(researcher_id)
        if not user:
            return jsonify({"error": f"User {researcher_id} not found"}), 404

        # Validate user has researcher role
        if not user_has_role(researcher_id, "researcher"):
            return jsonify({
                "error": f"User {researcher_id} does not have 'researcher' role"
            }), 403

        # Get projects with statistics
        projects = get_researcher_projects_with_stats(researcher_id)

        return jsonify({
            "projects": projects
        }), 200

    except Exception as e:
        logging.error(f"[ERROR] Error in get_researcher_projects endpoint: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# @app.route("/api/signup", methods=["POST"])
# def signup():
#     """
#     Endpoint: POST /api/signup
#     Purpose: Register a new user (researcher and/or volunteer).
#     Request body: { "full_name", "email", "user_id", "role" } (role: researcher, volunteer, or researcher,volunteer)
#     """
#     try:
#         data = request.get_json()
#         if not data:
#             return jsonify({"error": "Missing request body"}), 400
#         full_name = data.get("full_name") or data.get("name")
#         email = data.get("email")
#         user_id = data.get("user_id")
#         role = data.get("role", "volunteer")
#         if not all([full_name, email, user_id]):
#             return jsonify({"error": "Missing required fields: full_name, email, and user_id"}), 400
#         valid_roles = ("researcher", "volunteer", "researcher,volunteer")
#         if role not in valid_roles:
#             return jsonify({"error": f"role must be one of: {valid_roles}"}), 400
#         user, err = create_user(user_id=user_id, email=email, name=full_name, role=role)
#         if err:
#             return jsonify({"error": err}), 409
#         return jsonify({"user_id": user.user_id, "message": "User registered successfully"}), 201
#     except Exception as e:
#         logging.error(f"[ERROR] Signup: {e}")
#         return jsonify({"error": str(e)}), 500


# -------------------------------------------------
# Dashboard and stats API (Phase 1.2)
# -------------------------------------------------

def _project_to_dict(p):
    # AWS project objects are returned as SimpleNamespace and may not contain
    # SQLite-specific fields like `status`, `created_at`, or `updated_at`.
    created_at = getattr(p, "created_at", None) or getattr(p, "date_created", None)
    updated_at = getattr(p, "updated_at", None)
    status = getattr(p, "status", None)
    if not status:
        status = "pending"

    return {
        "project_id": getattr(p, "project_id", None),
        "researcher_id": getattr(p, "researcher_id", None),
        "title": getattr(p, "title", None) or getattr(p, "name", None),
        "description": getattr(p, "description", None) or "",
        "status": status,
        "created_at": created_at.isoformat() if created_at else None,
        "updated_at": updated_at.isoformat() if updated_at else None,
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


# @app.route("/api/projects", methods=["GET"])
# def list_projects():
#     """GET /api/projects - list projects (optional ?researcher_id=)."""
#     researcher_id = request.args.get("researcher_id")
#     projects = get_all_projects(researcher_id=researcher_id)
#     return jsonify({"projects": [_project_to_dict(p) for p in projects]}), 200


# @app.route("/api/projects/<project_id>", methods=["GET"])
# def get_project_route(project_id):
#     """GET /api/projects/<project_id> - get one project."""
#     p = get_project(project_id)
#     if not p:
#         return jsonify({"error": "Project not found"}), 404
#     return jsonify(_project_to_dict(p)), 200


# @app.route("/api/projects/<project_id>/runs", methods=["GET"])
# def list_runs_for_project(project_id):
#     """GET /api/projects/<project_id>/runs - list runs for a project."""
#     if not get_project(project_id):
#         return jsonify({"error": "Project not found"}), 404
#     runs = get_runs_for_project(project_id)
#     connected = get_connected_worker_count()
#     return jsonify({"runs": [_run_to_dict(r, worker_count=connected) for r in runs]}), 200


# Duplicate route block (kept earlier in file). Disabled to avoid Flask collisions.
# @app.route("/api/runs/<run_id>", methods=["GET"])
# @app.route("/api/runs/<run_id>/status", methods=["GET"])
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


# @app.route("/api/runs/<run_id>/tasks", methods=["GET"])
def list_tasks_for_run(run_id):
    """GET /api/runs/<run_id>/tasks - list tasks for a run."""
    if not get_run(run_id):
        return jsonify({"error": "Run not found"}), 404
    tasks = get_tasks_for_run(run_id)
    return jsonify({"tasks": [_task_to_dict(t) for t in tasks]}), 200


# @app.route("/api/workers", methods=["GET"])
def list_workers():
    """GET /api/workers - list all workers."""
    workers = get_all_workers()
    return jsonify({"workers": [_worker_to_dict(w) for w in workers]}), 200


# @app.route("/api/runs/<run_id>/results/download", methods=["GET"])
def download_run_results(run_id):
    """GET /api/runs/<run_id>/results/download - download aggregated results as JSON file."""
    r = get_run(run_id)
    if not r:
        return jsonify({"error": "Run not found"}), 404
    try:
        results = get_task_results_for_run(run_id)
    except ValueError as e:
        msg = str(e)
        code = 404 if msg == "Run not found" else 409
        return jsonify({"error": msg}), code
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


# @app.route("/api/workers/register", methods=["POST"])
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
        worker = register_worker(
            worker_id=f"worker-{uuid.uuid4()}",
            worker_name=worker_name,
            user_id=user_id,
            ip_address=client_ip,
            cpu_cores=cpu_cores,
            memory_gb=memory_gb,
            ray_node_id=node_id,
            user_email=getattr(user, "email", None),
        )
        worker_id = worker.worker_id
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


# @app.route("/api/signup", methods=["POST"])
# def signup():
#     """
#     Endpoint: POST /api/signup
#     Purpose: Register a new user (researcher and/or volunteer).
#     Request body: { "full_name", "email", "user_id", "role" } (role: researcher, volunteer, or researcher,volunteer)
#     """
#     try:
#         data = request.get_json()
#         if not data:
#             return jsonify({"error": "Missing request body"}), 400
#         full_name = data.get("full_name") or data.get("name")
#         email = data.get("email")
#         user_id = data.get("user_id")
#         role = data.get("role", "volunteer")
#         if not all([full_name, email, user_id]):
#             return jsonify({"error": "Missing required fields: full_name, email, and user_id"}), 400
#         valid_roles = ("researcher", "volunteer", "researcher,volunteer")
#         if role not in valid_roles:
#             return jsonify({"error": f"role must be one of: {valid_roles}"}), 400
#         user, err = create_user(user_id=user_id, email=email, name=full_name, role=role)
#         if err:
#             return jsonify({"error": err}), 409
#         return jsonify({"user_id": user.user_id, "message": "User registered successfully"}), 201
#     except Exception as e:
#         logging.error(f"[ERROR] Signup: {e}")
#         return jsonify({"error": str(e)}), 500


# -------------------------------------------------
# Dashboard and stats API (Phase 1.2)
# -------------------------------------------------

def _project_to_dict(p):
    # AWS project objects are returned as SimpleNamespace and may not contain
    # SQLite-specific fields like `status`, `created_at`, or `updated_at`.
    created_at = getattr(p, "created_at", None) or getattr(p, "date_created", None)
    updated_at = getattr(p, "updated_at", None)
    status = getattr(p, "status", None)
    if not status:
        status = "pending"

    return {
        "project_id": getattr(p, "project_id", None),
        "researcher_id": getattr(p, "researcher_id", None),
        "title": getattr(p, "title", None) or getattr(p, "name", None),
        "description": getattr(p, "description", None) or "",
        "status": status,
        "created_at": created_at.isoformat() if created_at else None,
        "updated_at": updated_at.isoformat() if updated_at else None,
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


# @app.route("/api/projects", methods=["GET"])
# def list_projects():
#     """GET /api/projects - list projects (optional ?researcher_id=)."""
#     researcher_id = request.args.get("researcher_id")
#     projects = get_all_projects(researcher_id=researcher_id)
#     return jsonify({"projects": [_project_to_dict(p) for p in projects]}), 200


# @app.route("/api/projects/<project_id>", methods=["GET"])
# def get_project_route(project_id):
#     """GET /api/projects/<project_id> - get one project."""
#     p = get_project(project_id)
#     if not p:
#         return jsonify({"error": "Project not found"}), 404
#     return jsonify(_project_to_dict(p)), 200


# @app.route("/api/projects/<project_id>/runs", methods=["GET"])
# def list_runs_for_project(project_id):
#     """GET /api/projects/<project_id>/runs - list runs for a project."""
#     if not get_project(project_id):
#         return jsonify({"error": "Project not found"}), 404
#     runs = get_runs_for_project(project_id)
#     connected = get_connected_worker_count()
#     return jsonify({"runs": [_run_to_dict(r, worker_count=connected) for r in runs]}), 200


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
    try:
        results = get_task_results_for_run(run_id)
    except ValueError as e:
        msg = str(e)
        code = 404 if msg == "Run not found" else 409
        return jsonify({"error": msg}), code
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
    resp.headers["Content-Disposition"] = (
        f"attachment; filename=\"results_{run_id}.json\""
    )
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

        worker_id = f"worker-{uuid.uuid4()}"
        ip_address = matching_node.get("NodeManagerAddress") or client_ip
        register_worker(
            worker_id=worker_id,
            worker_name=worker_name,
            user_id=user_id,
            ip_address=ip_address,
            cpu_cores=cpu_cores,
            memory_gb=memory_gb,
            ray_node_id=str(node_id) if node_id is not None else None,
        )
        dispatched_runs = api.try_dispatch_queued_runs()
        if dispatched_runs:
            logging.info(f"[INFO] Dispatched {dispatched_runs} queued run(s) after worker register")

        return jsonify({
            "worker_id": worker_id,
            "status": "registered",
            "ray_node_id": str(node_id) if node_id is not None else None,
            "message": "Worker registered successfully",
            "queued_runs_dispatched": dispatched_runs,
        }), 200

    except Exception as e:
        logging.error(f"[ERROR] register_worker_endpoint: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/researcher/<researcher_id>/stats", methods=["GET", "OPTIONS"])
def get_researcher_stats(researcher_id):
    """GET /api/researcher/<researcher_id>/stats — profile aggregate stats."""
    try:
        from backend.core.database import Project, Run, Task, TaskResult, Worker
        from sqlalchemy import distinct

        user = get_user_by_id(researcher_id)
        if not user:
            return jsonify({"error": f"User {researcher_id} not found"}), 404

        if not user_has_role(researcher_id, "researcher"):
            return jsonify({
                "error": f"User {researcher_id} does not have 'researcher' role"
            }), 403

        with get_session() as session:
            projects = session.query(Project).filter_by(
                researcher_id=researcher_id,
                status="active"
            ).all()

            total_projects = len(projects)
            completed_projects = 0
            all_contributors = set()

            for project in projects:
                runs = session.query(Run).filter_by(project_id=project.project_id).all()
                total_tasks = 0
                completed_tasks = 0

                tasks = session.query(Task).join(Run).filter(
                    Run.project_id == project.project_id
                ).all()

                for task in tasks:
                    total_tasks += 1
                    if task.status == "completed":
                        completed_tasks += 1

                if total_tasks > 0 and completed_tasks >= total_tasks:
                    completed_projects += 1

                contributor_rows = (
                    session.query(distinct(Worker.user_id))
                    .join(Task, Task.assigned_worker_id == Worker.worker_id)
                    .join(TaskResult, TaskResult.task_id == Task.task_id)
                    .filter(
                        TaskResult.project_id == project.project_id,
                        Worker.user_id.isnot(None),
                    )
                    .all()
                )
                for contrib in contributor_rows:
                    if contrib[0]:
                        all_contributors.add(contrib[0])

            total_contributors = len(all_contributors)

            return jsonify({
                "totalProjects": total_projects,
                "completedProjects": completed_projects,
                "totalContributors": total_contributors
            }), 200

    except Exception as e:
        logging.error(f"[ERROR] Error in get_researcher_stats endpoint: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/workers/connect", methods=["POST"])
def connect_worker():
    """
    Endpoint: POST /api/workers/connect
    Purpose: Volunteer joins a project's Ray cluster as a worker node.

    The head IP is looked up from the AWS projects table (set when the
    researcher submitted the project). Pass project_id so the endpoint
    knows which cluster to join. Optionally pass head_node_ip to override.

    Request body:
    {
        "user_id": "user-123",          // optional if email is provided
        "email": "user@example.com",    // optional if user_id is provided
        "worker_name": "MyLaptop",
        "project_id": 42               // used to look up head IP from AWS
        "head_node_ip": "10.0.0.5"     // optional override
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing request body"}), 400

        user_id = data.get("user_id")
        email = data.get("email")
        worker_name = data.get("worker_name")
        project_id = data.get("project_id")
        head_node_ip = data.get("head_node_ip")

        if (not user_id and not email) or not worker_name:
            return jsonify({
                "error": "Missing required fields: provide user_id or email, plus worker_name"
            }), 400

        # Resolve user
        user = None
        if user_id:
            user = get_user_by_id(user_id)
            if not user:
                return jsonify({"error": f"User {user_id} not found"}), 404
        else:
            user = get_user_by_email(email)
            if not user:
                return jsonify({"error": f"User with email {email} not found"}), 404
            user_id = user.user_id

        if email and user and user.email != email:
            return jsonify({
                "error": "Provided user_id and email do not match the same user"
            }), 400

        if not user_has_role(user_id, "volunteer"):
            return jsonify({
                "error": f"User {user_id} does not have 'volunteer' role. Current role: {user.role}"
            }), 403

        # Resolve head IP: explicit override > AWS lookup
        if not head_node_ip and project_id:
            head_node_ip = get_aws_project_ip(project_id)
        if not head_node_ip:
            return jsonify({
                "error": "Cannot determine head node IP. Provide project_id (with a running head) or head_node_ip."
            }), 400

        # Join the cluster as a Ray worker (subprocess on this machine)
        try:
            Cluster.join_as_worker(head_node_ip)
        except Exception as e:
            logging.error(f"[ERROR] Failed to join Ray cluster at {head_node_ip}: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({
                "error": f"Failed to join Ray cluster at {head_node_ip}: {str(e)}"
            }), 500

        # Register worker in local DB
        worker = register_worker(
            worker_id=f"worker-{uuid.uuid4()}",
            worker_name=worker_name,
            user_id=user_id,
            ip_address=Cluster._get_local_ip(),
            user_email=getattr(user, "email", None),
        )

        logging.info(f"[INFO] Volunteer {user_id} joined cluster at {head_node_ip}")

        return jsonify({
            "worker_id": worker.worker_id,
            "status": "connected",
            "user_id": user_id,
            "email": user.email,
            "head_node_ip": head_node_ip,
            "message": "Worker joined the project's Ray cluster successfully"
        }), 200

    except Exception as e:
        logging.error(f"[ERROR] Error in connect_worker endpoint: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/cluster/start-head", methods=["POST"])
def start_head():
    """
    Endpoint: POST /api/cluster/start-head
    Purpose: Explicitly start the Ray head node on this machine.

    Request body (optional):
    {
        "researcher_id": "user-456",
        "project_id": 42          // if provided, stores the IP in AWS
    }
    """
    try:
        data = request.get_json() or {}
        researcher_id = data.get("researcher_id")
        project_id = data.get("project_id")

        if researcher_id:
            user = get_user_by_id(researcher_id)
            if user and not user_has_role(researcher_id, "researcher"):
                return jsonify({
                    "error": f"User {researcher_id} does not have 'researcher' role. Current role: {user.role}"
                }), 403

        head_ip = api.start_ray_head()

        if project_id:
            update_aws_project_ip(project_id, head_ip)

        nodes = ray.nodes() if ray.is_initialized() else []
        resources = ray.cluster_resources() if ray.is_initialized() else {}

        return jsonify({
            "status": "started",
            "head_node_ip": head_ip,
            "ray_port": 6379,
            "connected_nodes": len(nodes),
            "resources": {
                "cpu": resources.get("CPU", 0),
                "memory_gb": resources.get("memory", 0) / (1024**3) if resources.get("memory") else 0
            },
            "message": f"Head node running at {head_ip}:6379. Volunteers can now join."
        }), 200

    except Exception as e:
        logging.error(f"[ERROR] start_head: {e}")
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
    app.run(host="0.0.0.0", port=5001, debug=True)