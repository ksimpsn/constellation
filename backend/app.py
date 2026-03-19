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
    get_user_by_id, user_has_role, register_worker, get_session, get_researcher_projects_with_stats, create_user, get_user_by_email, init_db, create_user,
    get_project, get_run, get_all_projects, get_runs_for_project, get_tasks_for_run,
    get_all_workers, get_task_results_for_run,
)
from backend.core.database_aws import init_aws_db
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
            "debug_users": "/api/debug-users"
        }
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
    replication_factor = request.form.get("replication_factor", type=int) or 2
    max_verification_attempts = request.form.get("max_verification_attempts", type=int) or 2

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

    try:
        chunk_size = int(request.form.get("chunk_size", 1000))
    except (TypeError, ValueError):
        chunk_size = 1000

    # ✨ CALL THE CORRECT API FUNCTION
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
    )
    job_id, run_id, project_id, total_tasks = out

    return jsonify({
        "message": "Job submitted successfully",
        "job_id": job_id,
        "run_id": run_id,
        "project_id": project_id,
        "total_tasks": total_tasks,
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
        logging.exception("get_results failed")
        return jsonify({
            "error": str(e),
            "job_id": job_id
        }), 500


@app.route("/api/signup", methods=["POST", "OPTIONS"])
def signup():
    """
    Endpoint: POST /api/signup
    Purpose: Create a new user account (volunteer or researcher).

    Request body:
    {
        "name": "John Doe",
        "email": "john@example.com",
        "role": "volunteer" or "researcher",
        "reasons": ["reason1", "reason2"]  # optional
    }

    Response:
    {
        "success": true,
        "user_id": "user-xxx",
        "message": "User created successfully"
    }
    """
    if request.method == "OPTIONS":
        return "", 200

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing request body"}), 400

        name = data.get("name")
        email = data.get("email")
        role = data.get("role")
        reasons = data.get("reasons", [])

        # Validate required fields
        if not name or not email or not role:
            return jsonify({
                "error": "Missing required fields: name, email, and role are required"
            }), 400

        # Validate role
        if role not in ["volunteer", "researcher", "contributor"]:
            return jsonify({
                "error": "Invalid role. Must be 'volunteer', 'researcher', or 'contributor'"
            }), 400

        # Map "contributor" to "volunteer" (same thing)
        if role == "contributor":
            role = "volunteer"

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
        user, err = create_user(user_id=user_id, email=email, name=name, role=role)
        if err:
            return jsonify({"error": err}), 409
        if not user:
            return jsonify({"error": "AWS database not configured. Set AWS_DATABASE_URL to create users."}), 503

        logging.info(f"[INFO] Created new user: {user.user_id} ({role})")

        return jsonify({
            "success": True,
            "user_id": user.user_id,
            "email": user.email,
            "role": user.role,
            "message": "User created successfully"
        }), 201

    except Exception as e:
        logging.error(f"[ERROR] Error in signup endpoint: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/login", methods=["POST", "OPTIONS"])
def login():
    """
    Endpoint: POST /api/login
    Purpose: Authenticate a user by email and return user info.

    Request body:
    {
        "email": "user@example.com"
    }

    Response:
    {
        "success": true,
        "user_id": "user-xxx",
        "email": "user@example.com",
        "name": "User Name",
        "role": "volunteer" or "researcher"
    }
    """
    if request.method == "OPTIONS":
        return "", 200

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing request body"}), 400

        email = data.get("email")

        if not email:
            return jsonify({"error": "Email is required"}), 400

        # Initialize database if needed
        init_db()

        # Find user by email
        user = get_user_by_email(email)
        if not user:
            return jsonify({
                "error": "User not found. Please sign up first."
            }), 404

        logging.info(f"[INFO] User logged in: {user.user_id} ({user.role})")

        return jsonify({
            "success": True,
            "user_id": user.user_id,
            "email": user.email,
            "name": user.name,
            "role": user.role
        }), 200

    except Exception as e:
        logging.error(f"[ERROR] Error in login endpoint: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/researcher/debug-id", methods=["GET", "OPTIONS"])
def get_debug_researcher_id():
    """
    Endpoint: GET /api/researcher/debug-id
    Purpose: Get the debug researcher user ID for testing.
    Uses the same debug user system as DEBUG_USERS.md.
    Returns the debug researcher user, or creates one if it doesn't exist.

    This matches the debug users created by: python3 backend/create_debug_user.py

    Response:
    {
        "researcher_id": "user-xxx",
        "email": "debug-researcher@constellation.test",
        "name": "Debug Researcher",
        "role": "researcher"
    }
    """
    try:
        from backend.core.database import get_user_by_email, create_user, init_db

        # Initialize DB if needed
        init_db()

        # Get debug researcher (same email as in DEBUG_USERS.md and create_debug_user.py)
        researcher_email = "debug-researcher@constellation.test"
        researcher = get_user_by_email(researcher_email)

        if not researcher:
            researcher, err = create_user(
                user_id="debug-researcher",
                email=researcher_email,
                name="Debug Researcher",
                role="researcher",
            )
            if err:
                return jsonify({"error": err}), 409
            logging.info(f"[INFO] Created debug researcher: {researcher.user_id}")

        return jsonify({
            "researcher_id": researcher.user_id,
            "email": researcher.email,
            "name": researcher.name,
            "role": researcher.role
        }), 200

    except Exception as e:
        logging.error(f"[ERROR] Error in get_debug_researcher_id endpoint: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/debug-users", methods=["GET"])
def get_debug_users():
    """
    Endpoint: GET /api/debug-users
    Purpose: Get all debug users (matching DEBUG_USERS.md).
    Returns all three debug users: volunteer, researcher, and both.

    Response:
    {
        "volunteer": {
            "user_id": "user-xxx",
            "email": "debug-volunteer@constellation.test",
            "name": "Debug Volunteer",
            "role": "volunteer"
        },
        "researcher": {
            "user_id": "user-xxx",
            "email": "debug-researcher@constellation.test",
            "name": "Debug Researcher",
            "role": "researcher"
        },
        "both": {
            "user_id": "user-xxx",
            "email": "debug-both@constellation.test",
            "name": "Debug Both",
            "role": "researcher,volunteer"
        }
    }
    """
    try:
        from backend.core.database import get_user_by_email, create_user, init_db

        # Initialize DB if needed
        init_db()

        # Get or create all debug users (same as create_debug_user.py)
        debug_users = {}

        # Volunteer
        volunteer_email = "debug-volunteer@constellation.test"
        volunteer = get_user_by_email(volunteer_email)
        if not volunteer:
            volunteer, err = create_user(
                user_id="debug-volunteer",
                email=volunteer_email,
                name="Debug Volunteer",
                role="volunteer",
            )
            if err:
                return jsonify({"error": err}), 409
        debug_users["volunteer"] = {
            "user_id": volunteer.user_id,
            "email": volunteer.email,
            "name": volunteer.name,
            "role": volunteer.role
        }

        # Researcher
        researcher_email = "debug-researcher@constellation.test"
        researcher = get_user_by_email(researcher_email)
        if not researcher:
            researcher, err = create_user(
                user_id="debug-researcher",
                email=researcher_email,
                name="Debug Researcher",
                role="researcher",
            )
            if err:
                return jsonify({"error": err}), 409
        debug_users["researcher"] = {
            "user_id": researcher.user_id,
            "email": researcher.email,
            "name": researcher.name,
            "role": researcher.role
        }

        # Both
        both_email = "debug-both@constellation.test"
        both_user = get_user_by_email(both_email)
        if not both_user:
            both_user, err = create_user(
                user_id="debug-both",
                email=both_email,
                name="Debug Both",
                role="researcher,volunteer",
            )
            if err:
                return jsonify({"error": err}), 409
        debug_users["both"] = {
            "user_id": both_user.user_id,
            "email": both_user.email,
            "name": both_user.name,
            "role": both_user.role
        }

        return jsonify(debug_users), 200

    except Exception as e:
        logging.error(f"[ERROR] Error in get_debug_users endpoint: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/researcher/<researcher_id>/stats", methods=["GET", "OPTIONS"])
def get_researcher_stats(researcher_id):
    """
    Endpoint: GET /api/researcher/<researcher_id>/stats
    Purpose: Get aggregated statistics for a researcher profile.

    Response:
    {
        "totalProjects": 5,
        "completedProjects": 2,
        "totalContributors": 150
    }
    """
    try:
        from backend.core.database import get_user_by_id, user_has_role, get_session
        from backend.core.database import Project, Run, TaskResult
        from sqlalchemy import func, distinct

        # Validate user exists
        user = get_user_by_id(researcher_id)
        if not user:
            return jsonify({"error": f"User {researcher_id} not found"}), 404

        # Validate user has researcher role
        if not user_has_role(researcher_id, "researcher"):
            return jsonify({
                "error": f"User {researcher_id} does not have 'researcher' role"
            }), 403

        with get_session() as session:
            from backend.core.database import Task

            # Get all projects for this researcher
            projects = session.query(Project).filter_by(
                researcher_id=researcher_id,
                status="active"
            ).all()

            total_projects = len(projects)
            completed_projects = 0

            # Get unique contributors across all projects
            all_contributors = set()

            for project in projects:
                # Check if project is completed (all tasks done)
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

                # Get contributors for this project
                contributors = session.query(distinct(TaskResult.worker_id)).filter(
                    TaskResult.project_id == project.project_id,
                    TaskResult.worker_id.isnot(None)
                ).all()

                for contrib in contributors:
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
        "user_id": "user-123",          // optional if email is provided
        "email": "user@example.com",    // optional if user_id is provided
        "worker_name": "MyLaptop",
        "head_node_ip": "192.168.1.100"
    }

    Response:
    {
        "worker_id": "worker-abc123",
        "status": "connected",
        "user_id": "user-123",
        "email": "user@example.com",
        "ray_node_id": "ray-node-xyz",
        "message": "Worker connected successfully"
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing request body"}), 400

        user_id = data.get("user_id")
        email = data.get("email")
        worker_name = data.get("worker_name")
        head_node_ip = data.get("head_node_ip")

        # Validate required fields
        if (not user_id and not email) or not worker_name or not head_node_ip:
            return jsonify({
                "error": "Missing required fields: provide user_id or email, plus worker_name and head_node_ip"
            }), 400

        # Resolve user by user_id or email
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

        # If both identifiers are provided, ensure they refer to the same user
        if email and user and user.email != email:
            return jsonify({
                "error": "Provided user_id and email do not match the same user"
            }), 400

        # Validate user has 'volunteer' role
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
                "user_id": user_id,
                "email": user.email,
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
    app.run(host="0.0.0.0", port=5001, debug=True)