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

app = Flask(__name__)

api = ConstellationAPI()

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


@app.route("/submit", methods=["POST"])
def submit_job():
    """
    Endpoint: POST /submit
    Purpose: Accept a new computation job from the researcher.
    Input: JSON payload like {"data": [1, 2, 3, 4]}
    Output: {"job_id": "<some id>"}
    """

    payload = request.get_json()

    if not payload or "data" not in payload:
        return jsonify({"error": "Missing 'data' field in request"}), 400

    data = payload["data"]

    job_id = api.submit_project(data)

    return jsonify({
        "message": "Job submitted successfully.",
        "job_id": job_id
    }), 200


@app.route("/status/<job_id>", methods=["GET"])
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


@app.route("/results/<job_id>", methods=["GET"])
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