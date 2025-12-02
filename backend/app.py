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
import os
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


# -------------------------------------------------
# Server Entry Point
# -------------------------------------------------
if __name__ == "__main__":
    """
    Run the Flask development server.
    In production, you’ll use Gunicorn or uvicorn instead.
    """
    app.run(host="0.0.0.0", port=5000, debug=True)