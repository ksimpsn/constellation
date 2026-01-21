# Fix "Failed to Fetch" Error

## Quick Fix Steps

### 1. Verify Backend is Running

```bash
# Start the backend server
python3 -m flask --app backend.app run --host 0.0.0.0 --port 5000
```

Keep this terminal open! The backend must be running for the frontend to work.

### 2. Test Backend Connection

In another terminal:
```bash
# Test if backend is accessible
curl http://localhost:5000/

# Should return: {"message": "Welcome to the Constellation API!", "status": "running"}
```

### 3. Verify Complete Setup

```bash
python3 backend/test/verify_setup.py
```

This checks:
- ✅ Database is initialized
- ✅ Debug researcher exists
- ✅ Projects exist
- ✅ Backend API is running
- ✅ API endpoints work

### 4. Create Test Data (if needed)

```bash
# Create debug users
python3 backend/create_debug_user.py

# Add a sample project
python3 backend/test/add_sample_project.py
```

### 5. Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for error messages
4. Check Network tab to see failed requests

## Common Issues & Solutions

### Issue: "Failed to fetch" or "NetworkError"

**Cause:** Backend not running or wrong URL

**Solution:**
1. Make sure backend is running on port 5000
2. Check frontend is using `http://localhost:5000`
3. Verify no firewall blocking localhost

### Issue: CORS Error

**Cause:** Backend CORS not configured correctly

**Solution:**
- Backend now has CORS enabled for all origins
- Restart backend after code changes
- Check browser console for specific CORS error

### Issue: "404 Not Found"

**Cause:** API endpoint doesn't exist

**Solution:**
- Verify endpoint: `GET /api/researcher/debug-id`
- Test with: `curl http://localhost:5000/api/researcher/debug-id`

### Issue: "500 Internal Server Error"

**Cause:** Backend code error

**Solution:**
1. Check backend terminal for error messages
2. Verify database exists: `ls constellation.db`
3. Run: `python3 backend/test/verify_setup.py`

### Issue: No Projects Showing

**Cause:** Database has no projects

**Solution:**
```bash
# Add a sample project
python3 backend/test/add_sample_project.py

# Verify it was created
python3 backend/test/inspect_database.py
```

## Debugging Steps

### Step 1: Check Backend Logs

Look at the terminal where backend is running. You should see:
```
 * Running on http://0.0.0.0:5000
```

### Step 2: Test API Manually

```bash
# Test health endpoint
curl http://localhost:5000/

# Test debug researcher endpoint
curl http://localhost:5000/api/researcher/debug-id

# Should return JSON with researcher_id
```

### Step 3: Check Frontend Console

Open browser console (F12) and look for:
- Network errors
- CORS errors
- Failed fetch requests
- Console.log messages from ResearcherDashboard

### Step 4: Verify API URL

The frontend uses: `http://localhost:5000` by default

If your backend runs on a different port, set environment variable:
```bash
# In frontend directory
export VITE_API_URL=http://localhost:5001
npm run dev
```

## Complete Working Setup

```bash
# Terminal 1: Setup database
python3 backend/create_debug_user.py
python3 backend/test/add_sample_project.py

# Terminal 2: Start backend
python3 -m flask --app backend.app run --host 0.0.0.0 --port 5000

# Terminal 3: Verify setup
python3 backend/test/verify_setup.py

# Terminal 4: Start frontend
cd frontend
npm run dev

# Open browser to http://localhost:5173
# Navigate to Researcher Dashboard
```

## What I Fixed

1. **Better Error Messages**: Frontend now shows detailed error messages with troubleshooting steps
2. **Improved CORS**: Backend CORS configuration updated to allow all origins
3. **Console Logging**: Added debug logs to help identify issues
4. **Verification Script**: Created `verify_setup.py` to check everything

## Still Not Working?

1. **Check browser console** - Look for specific error messages
2. **Check backend terminal** - Look for error logs
3. **Run verify script** - `python3 backend/test/verify_setup.py`
4. **Test API manually** - Use `curl` to test endpoints
5. **Check ports** - Make sure nothing else is using port 5000

The error message in the frontend should now tell you exactly what's wrong!
