# Start Here: Complete Setup Guide

This guide walks you through starting the backend and frontend step-by-step.

## Prerequisites

Make sure you have:
- Python 3.8+ installed
- Node.js and npm installed (for frontend)

## Step 0: Install Dependencies (IMPORTANT!)

**Before starting, install all Python dependencies:**

```bash
# Option 1: Use the install script (easiest)
./install_dependencies.sh

# Option 2: Install manually
pip install -r requirements.txt

# Option 3: Install individually
pip install flask flask-cors ray sqlalchemy dill
```

**If you see "No module named 'sqlalchemy'" or similar errors, you need to install dependencies first!**

See `INSTALL_DEPENDENCIES.md` for detailed instructions.

## Step-by-Step Setup

### Step 1: Open Terminal/Command Prompt

You'll need **multiple terminal windows** open. I recommend:
- **Terminal 1**: For backend server
- **Terminal 2**: For running setup scripts
- **Terminal 3**: For frontend (optional, can use Terminal 2)

### Step 2: Navigate to Project Directory

In **Terminal 1** (for backend):
```bash
cd /Users/shruthikunjur/projects/constellation
```

Or if you're already in the project:
```bash
pwd  # Should show: /Users/shruthikunjur/projects/constellation
```

### Step 3: Create Debug Users and Test Data

In **Terminal 2** (or same terminal before starting backend):
```bash
# Make sure you're in the project root
cd /Users/shruthikunjur/projects/constellation

# Create debug users (researcher, volunteer, etc.)
python3 backend/create_debug_user.py

# Add a sample project to the database
python3 backend/test/add_sample_project.py

# Verify everything is set up
python3 backend/test/verify_setup.py
```

**Expected output:**
- ✓ Database initialized
- ✓ Debug researcher exists
- ✓ Projects created
- ⚠ Backend not running (this is OK, we'll start it next)

### Step 4: Start the Backend Server

In **Terminal 1** (keep this running!):
```bash
# Make sure you're in the project root
cd /Users/shruthikunjur/projects/constellation

# Start the Flask backend server
python3 -m flask --app backend.app run --host 0.0.0.0 --port 5000
```

**What you should see:**
```
 * Serving Flask app 'backend.app'
 * Debug mode: on
WARNING: This is a development server. Do not use it in a production deployment.
 * Running on http://0.0.0.0:5000
Press CTRL+C to quit
```

**Important:**
- ✅ Keep this terminal open and running!
- ✅ Don't close it or press Ctrl+C (that stops the server)
- ✅ The server is now running and waiting for requests

### Step 5: Test Backend is Working

Open **Terminal 2** (new terminal, or use another one):
```bash
# Test if backend is responding
curl http://localhost:5000/
```

**Expected output:**
```json
{
  "message": "Welcome to the Constellation API!",
  "status": "running",
  "endpoints": {
    "debug_researcher": "/api/researcher/debug-id",
    "researcher_projects": "/api/researcher/<researcher_id>/projects",
    "debug_users": "/api/debug-users"
  }
}
```

If you see this, **backend is working!** ✅

### Step 6: Verify Complete Setup

In **Terminal 2**:
```bash
python3 backend/test/verify_setup.py
```

**Expected output:**
- ✓ Database: OK
- ✓ Debug researcher: OK
- ✓ Projects: OK
- ✓ Backend API: OK

All checks should pass now!

### Step 7: Start the Frontend

In **Terminal 3** (or Terminal 2 if backend is in Terminal 1):
```bash
# Navigate to frontend directory
cd /Users/shruthikunjur/projects/constellation/frontend

# Start the frontend development server
npm run dev
```

**What you should see:**
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Important:**
- ✅ Keep this terminal open too!
- ✅ Frontend is now running on http://localhost:5173

### Step 8: Open the Dashboard

1. Open your web browser
2. Go to: `http://localhost:5173`
3. Navigate to the Researcher Dashboard
4. You should now see your projects!

## Visual Guide: Terminal Layout

```
┌─────────────────────────────────────┐
│ Terminal 1: Backend Server          │
│ (Keep running!)                      │
├─────────────────────────────────────┤
│ $ python3 -m flask --app backend... │
│ * Running on http://0.0.0.0:5000    │
│ Press CTRL+C to quit                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Terminal 2: Setup & Testing         │
├─────────────────────────────────────┤
│ $ python3 backend/create_debug...   │
│ $ python3 backend/test/add_sample...│
│ $ curl http://localhost:5000/       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Terminal 3: Frontend Server          │
│ (Keep running!)                      │
├─────────────────────────────────────┤
│ $ cd frontend                        │
│ $ npm run dev                        │
│ ➜  Local: http://localhost:5173/    │
└─────────────────────────────────────┘
```

## Troubleshooting

### Problem: "Command not found: python3"

**Solution:**
- Try `python` instead of `python3`
- Or install Python 3.8+

### Problem: "ModuleNotFoundError: No module named 'flask'"

**Solution:**
```bash
# Install Python dependencies
pip3 install flask flask-cors
# Or if you have a requirements.txt:
pip3 install -r requirements.txt
```

### Problem: "Port 5000 already in use"

**Solution:**
```bash
# Find what's using port 5000
lsof -ti:5000

# Kill it (replace PID with the number from above)
kill -9 <PID>

# Or use a different port
python3 -m flask --app backend.app run --host 0.0.0.0 --port 5001
# Then update frontend API_BASE_URL to use port 5001
```

### Problem: Backend starts but shows errors

**Check:**
1. Database exists: `ls constellation.db`
2. Dependencies installed: `pip3 list | grep flask`
3. Python version: `python3 --version` (should be 3.8+)

### Problem: Frontend still shows "Failed to fetch"

**Check:**
1. Backend is running (Terminal 1 should show "Running on...")
2. Test backend: `curl http://localhost:5000/`
3. Check browser console (F12) for errors
4. Verify API URL in frontend matches backend port

## Quick Reference Commands

```bash
# Start backend
python3 -m flask --app backend.app run --host 0.0.0.0 --port 5000

# Test backend
curl http://localhost:5000/

# Verify setup
python3 backend/test/verify_setup.py

# Start frontend
cd frontend && npm run dev

# View database
python3 backend/test/inspect_database.py
```

## What's Running Where

- **Backend API**: http://localhost:5000
- **Frontend UI**: http://localhost:5173
- **Database**: `constellation.db` (in project root)

## Next Steps

Once everything is running:
1. ✅ Backend shows "Running on http://0.0.0.0:5000"
2. ✅ Frontend shows "Local: http://localhost:5173"
3. ✅ Open browser to http://localhost:5173
4. ✅ Navigate to Researcher Dashboard
5. ✅ You should see your projects!

If you still see errors, check:
- Browser console (F12 → Console tab)
- Backend terminal for error messages
- Run `verify_setup.py` again
