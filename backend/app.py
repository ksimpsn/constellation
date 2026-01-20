"""
Constellation Flask API

Need to expose endpoints for:
  - submitting jobs
  - checking status
  - retrieving results

Later, it will connect to:
  backend/core/api.py → ConstellationAPI → Cluster (Ray)
"""

from flask import Flask, request, jsonify
from backend.core.api import ConstellationAPI
from backend.core.database import get_user_by_id, user_has_role, register_worker, get_session
from backend.core.server import Cluster
import os
import uuid
import logging
import ray
import socket
from flask_cors import CORS

app = Flask(__name__)
# More explicit CORS configuration for file uploads
CORS(app)
# CORS(app, 
#      origins="http://localhost:5173",
#      methods=["GET", "POST", "OPTIONS"],
#      allow_headers=["Content-Type"],
#      supports_credentials=False)

# Module-level variable that persists across Flask reloads
_api_instance = None

def get_api():
    global _api_instance
    if _api_instance is None:
        _api_instance = ConstellationAPI()
    return _api_instance

api = get_api()

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

    # ✨ CALL THE CORRECT API FUNCTION
    job_id = api.submit_uploaded_project(
        code_path=py_path,
        dataset_path=data_path,
        file_type=ext,
        func_name="main"  # optional
    )

    return jsonify({
        "message": "Job submitted successfully",
        "job_id": job_id
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
                logging.warning("[WARNING] Head node may not accept remote connections. Consider starting Ray manually: ray start --head --port=6379 --node-ip-address=0.0.0.0")
            
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