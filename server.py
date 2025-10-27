import ray
from worker import compute_task

class ConstellationServer:
    def __init__(self):
        ray.init()
        self.jobs = {}

    def submit_tasks(self, data):
        job_id = len(self.jobs)
        future_ref = [compute_task.remote(x) for x in data]
        self.jobs[job_id] = future_ref
        return job_id

    def get_results(self, job_id):
        futures = self.jobs[job_id]
        return ray.get(futures)