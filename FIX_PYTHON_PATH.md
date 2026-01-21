# Fix "No module named 'backend'" Error

## The Problem

When running scripts from `backend/test/`, Python can't find the `backend` module because the project root isn't in the Python path.

## The Solution

I've fixed all the test scripts to correctly add the project root to the Python path.

**The scripts should now work when run from the project root:**

```bash
# Make sure you're in the project root
cd /Users/shruthikunjur/projects/constellation

# Then run scripts
python3 backend/test/verify_setup.py
python3 backend/test/add_sample_project.py
python3 backend/test/inspect_database.py
```

## Alternative: Run from Project Root

Always run scripts from the project root directory:

```bash
# ✅ Correct - from project root
cd /Users/shruthikunjur/projects/constellation
python3 backend/test/verify_setup.py

# ❌ Wrong - from backend/test/ directory
cd backend/test
python3 verify_setup.py  # This won't work
```

## Why This Happens

Python needs to find the `backend` module. The module structure is:
```
constellation/          ← Project root (needs to be in Python path)
  backend/              ← Module we want to import
    core/
      database.py
    test/
      verify_setup.py   ← Script location
```

When the script runs, it needs the project root (`constellation/`) in the path so it can import `backend.core.database`.

## Verify It's Fixed

Run this to test:

```bash
cd /Users/shruthikunjur/projects/constellation
python3 backend/test/verify_setup.py
```

You should see output like:
```
==================================
Verifying Constellation Setup
==================================
...
```

If you still get "No module named 'backend'", make sure:
1. You're in the project root directory
2. The script was updated (check the path setup code)
3. Python can see the backend directory: `ls backend/` should show directories

## Quick Test

```bash
# Test if Python can find backend module
cd /Users/shruthikunjur/projects/constellation
python3 -c "import sys; sys.path.insert(0, '.'); from backend.core.database import init_db; print('✓ Backend module found!')"
```

If this works, the scripts should work too!
