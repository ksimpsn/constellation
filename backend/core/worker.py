import ray
import time

@ray.remote
def compute_task(x):
    time.sleep(1)
    return x * x