import dill
import ray
import time

@ray.remote
def compute_task(payload: dict):
    """
        Minimal compute function for MVP.

        Accepts a payload dict containing:
          - task_id: int
          - rows: Any (e.g., number, dict, string)
          - params: dict or None

        For now, simply returns the chunk squared if numeric,
        or echoes the chunk if not numeric.
        """

    time.sleep(1)
    task_id = payload["task_id"]
    chunk = payload["chunk"]
    params = payload["params"]

    try:
        results = chunk * chunk
    except:
        results = chunk
    return {"task_id": task_id, "results": results}

@ray.remote
def compute_uploaded_task(payload, func_bytes):
    """
    Executes a user-uploaded function against a batch of rows.

    payload:
        {
            "task_id": int,
            "rows": [dict, dict, ...]
        }
    """

    # Get Ray runtime context for worker tracking
    runtime_context = ray.get_runtime_context()
    node_id = runtime_context.get_node_id()
    ray_worker_id = runtime_context.get_worker_id()
    
    # Measure execution time
    start_time = time.time()
    
    task_id = payload.get("task_id")

    # 1. Try to load the uploaded function
    try:
        fn = dill.loads(func_bytes)
    except Exception as e:
        print("[WORKER ERROR] Failed to load function bytes:", e)
        runtime_seconds = time.time() - start_time
        return {
            "task_id": task_id,
            "error": f"Function load failed: {type(e).__name__}: {e}",
            "runtime_seconds": runtime_seconds,
            "node_id": node_id,  # For mapping to Worker.ray_node_id
            "ray_worker_id": ray_worker_id
        }

    # 2. Retrieve rows from payload
    rows = payload.get("rows", [])

    results = []
    for idx, row in enumerate(rows):
        try:
            out = fn(row)
        except Exception as e:
            print(f"[WORKER ERROR] Function failed on row {idx}: {e}")
            results.append({
                "row_index": idx,
                "error": f"Row failed: {type(e).__name__}: {e}"
            })
            continue

        results.append({
            "row_index": idx,
            "output": out
        })

    # Calculate total execution time
    runtime_seconds = time.time() - start_time

    return {
        "task_id": task_id,
        "results": results,
        "runtime_seconds": runtime_seconds,
        "node_id": node_id,  # For mapping to Worker.ray_node_id
        "ray_worker_id": ray_worker_id
    }