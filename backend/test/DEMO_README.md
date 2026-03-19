# Demo Readme: Sequential vs Distributed Text Processing

## Quick Start

### 1. Generate Dataset (if needed)
```bash
python3 backend/test/generate_text_dataset.py
# Choose Option 2 for synthetic data
# Default: 2,231 documents (good for quick demo, ~1 minute distributed)
# For larger demo: 50,000+ documents (shows scalability)
```

### 2. Run Sequential Test (Show the Problem)
```bash
python3 backend/test/test_text_sequential.py
```
**What it shows:**
- Documents processed ONE AT A TIME (very slow)
- Live progress bar: `Progress: X/Y docs | Elapsed: Xs | Rate: X docs/sec | ETA: Xs`
- Times out after **1 minute** (matches distributed test runtime for comparison)
- Only processes ~150-200 documents in 1 minute
- Estimates how long full dataset would take (~8-9 minutes for 2,231 docs)

### 3. Run Distributed Test (Show the Solution)
```bash
python3 backend/test/test_text_distributed.py
```
**What it shows:**
- Documents processed IN PARALLEL (fast!)
- Live progress bar: `Progress: X/Y docs | Elapsed: Xs | Rate: X docs/sec | ETA: Xs`
- Completes in **~1 minute** (processes ALL 2,231 documents!)
- Shows complete results: all documents processed, tokens extracted, database verification
- Ray setup overhead: ~5-10 seconds (first run only)

---

## For Presentation

- Both tests run for **~1 minute**, making side-by-side comparison easy
- Sequential: Shows the problem (only ~150-200 docs processed)
- Distributed: Shows the solution (ALL 2,231 docs processed in same time)
- Both show live progress bars for real-time monitoring

---

## Files

- **`test_text_sequential.py`**: Sequential processing (no Ray, one-at-a-time)
- **`test_text_distributed.py`**: Distributed processing (with Ray, parallel)
- **`text_processing_project.py`**: The NLP processing function
- **`generate_text_dataset.py`**: Dataset generator
- **`PRESENTATION_GUIDE.md`**: Complete presentation guide
