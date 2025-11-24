import time
import ray

# ---- Ray Square Benchmark ----
@ray.remote
def compute_square_chunk(chunk):
    return [x*x for x in chunk]

def ray_square_benchmark(N, num_tasks=8):
    chunk = N // num_tasks
    data = list(range(N))
    chunks = [data[i*chunk:(i+1)*chunk] for i in range(num_tasks)]
    ray.init(ignore_reinit_error=True)
    futures = [compute_square_chunk.remote(ch) for ch in chunks]
    start = time.time()
    results = ray.get(futures)
    end = time.time()
    total = sum(len(r) for r in results)
    print(f"Ray square time: {end-start:.4f} seconds for {total} squares")
    return results

def local_square_benchmark(N):
    data = list(range(N))
    start = time.time()
    results = [x*x for x in data]
    end = time.time()
    print(f"Local square time: {end-start:.4f} seconds for {len(results)} squares")
    return results

# ---- Ray Monte Carlo Pi ----

# Monte Carlo method is chosen for its simplicity and inherent parallelizability.
# This allows us to demonstrate distributed computing using Ray effectively.
# The comparison between Ray and local execution highlights the performance gain
# from parallelism and distributed task execution.

@ray.remote
def compute_task_monte_carlo_pi(n_samples):
    import random
    inside = 0
    for _ in range(n_samples):
        x = random.random()
        y = random.random()
        if x*x + y*y <= 1:
            inside += 1
    return inside

# Purpose: Perform Monte Carlo Pi estimation using Ray distributed tasks.
def ray_monte_carlo_pi(n_samples, num_tasks=8):
    chunk = n_samples // num_tasks
    ray.init(ignore_reinit_error=True)
    tasks = [compute_task_monte_carlo_pi.remote(chunk) for _ in range(num_tasks)]
    start = time.time()
    results = ray.get(tasks)
    end = time.time()
    total_inside = sum(results)
    print(f"Ray Monte Carlo time: {end-start:.4f} seconds")
    return total_inside

# Purpose: Perform Monte Carlo Pi estimation locally in a single thread.
def local_monte_carlo_pi(n_samples):
    import random, time
    start = time.time()
    inside = 0
    for _ in range(n_samples):
        x = random.random()
        y = random.random()
        if x*x + y*y <= 1:
            inside += 1
    end = time.time()
    print(f"Local computation time: {end-start:.4f} seconds")
    return inside

if __name__ == "__main__":
    print("=== Square Benchmark Demo ===")
    N = 50_000_000
    ray_square_benchmark(N)
    local_square_benchmark(N)
    print("=== End Square Demo ===\n")

    # Demonstration of Monte Carlo π estimation comparing distributed Ray computation vs local computation.
    print("=== Monte Carlo Demo ===")
    total_inside_ray = ray_monte_carlo_pi(N)
    print(f"Ray π estimate: {4 * total_inside_ray / N}")
    total_inside_local = local_monte_carlo_pi(N)
    print(f"Local π estimate: {4 * total_inside_local / N}")
    print("=== End Monte Carlo Demo ===\n")