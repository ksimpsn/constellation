import math
import time

def main(row):
    """
    Calculate all prime numbers up to n (from row["n"]).
    This is computationally intensive and will take noticeable time.
    """
    n = int(row["n"])
    
    # Sieve of Eratosthenes algorithm
    if n < 2:
        return {"n": n, "primes": [], "count": 0}
    
    sieve = [True] * (n + 1)
    sieve[0] = sieve[1] = False
    
    for i in range(2, int(math.sqrt(n)) + 1):
        if sieve[i]:
            for j in range(i * i, n + 1, i):
                sieve[j] = False
    
    primes = [i for i in range(2, n + 1) if sieve[i]]
    
    # Add a small delay to make it more noticeable
    time.sleep(0.1)
    
    return {
        "n": n,
        "primes": primes,
        "count": len(primes),
        "largest_prime": primes[-1] if primes else None
    }
