import ray
import time

@ray.remote
def compute_task(payload: dict):
    """
        Minimal compute function for MVP.

        Accepts a payload dict containing:
          - task_id: int
          - chunk: Any (e.g., number, dict, string)
          - params: dict or None

        For now, simply returns the chunk squared if numeric,
        or echoes the chunk if not numeric.
        """

    time.sleep(1)
    task_id = payload["task_id"]
    chunk = payload["chunk"]
    params = payload["params"]

    try:
        result = chunk * chunk
    except:
        result = chunk
    return {"task_id": task_id, "result": result}