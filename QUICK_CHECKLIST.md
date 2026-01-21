# Quick Checklist: Get Everything Running

Follow these steps in order. Check off each one as you complete it.

## ✅ Setup Checklist

### 1. Open Terminal
- [ ] Open Terminal (or Command Prompt on Windows)
- [ ] Navigate to project: `cd /Users/shruthikunjur/projects/constellation`

### 2. Create Test Data
- [ ] Run: `python3 backend/create_debug_user.py`
  - Should see: "✓ Created researcher user: user-xxx"
- [ ] Run: `python3 backend/test/add_sample_project.py`
  - Should see: "✓ Project submitted successfully!"

### 3. Start Backend Server
- [ ] Run: `python3 -m flask --app backend.app run --host 0.0.0.0 --port 5000`
- [ ] See message: "Running on http://0.0.0.0:5000"
- [ ] **Keep this terminal open!** (Don't close it)

### 4. Test Backend (New Terminal)
- [ ] Open a NEW terminal window
- [ ] Run: `curl http://localhost:5000/`
- [ ] Should see JSON response with "status": "running"

### 5. Start Frontend (Another Terminal)
- [ ] Open another terminal (or use the same one from step 4)
- [ ] Run: `cd frontend && npm run dev`
- [ ] See message: "Local: http://localhost:5173"
- [ ] **Keep this terminal open too!**

### 6. Open Browser
- [ ] Go to: http://localhost:5173
- [ ] Navigate to Researcher Dashboard
- [ ] Should see your projects!

## 🚨 If Something Doesn't Work

### Backend won't start?
```bash
# Check if port 5000 is in use
lsof -ti:5000

# Install Flask if missing
pip3 install flask flask-cors
```

### Frontend shows "Failed to fetch"?
1. Check backend is running (step 3)
2. Test: `curl http://localhost:5000/`
3. Check browser console (F12)

### No projects showing?
```bash
# Add a project
python3 backend/test/add_sample_project.py

# Check database
python3 backend/test/inspect_database.py
```

## 📝 Terminal Commands Summary

**Terminal 1 (Backend - keep running):**
```bash
cd /Users/shruthikunjur/projects/constellation
python3 -m flask --app backend.app run --host 0.0.0.0 --port 5000
```

**Terminal 2 (Setup & Testing):**
```bash
cd /Users/shruthikunjur/projects/constellation
python3 backend/create_debug_user.py
python3 backend/test/add_sample_project.py
curl http://localhost:5000/  # Test backend
```

**Terminal 3 (Frontend - keep running):**
```bash
cd /Users/shruthikunjur/projects/constellation/frontend
npm run dev
```

## 🎯 Success Looks Like

✅ **Backend Terminal:**
```
 * Running on http://0.0.0.0:5000
Press CTRL+C to quit
```

✅ **Frontend Terminal:**
```
➜  Local:   http://localhost:5173/
```

✅ **Browser:**
- Dashboard shows projects
- No "Failed to fetch" error
- Projects display with stats

## 💡 Pro Tip

You can also use the helper script:
```bash
./backend/start_backend.sh
```

This automatically checks dependencies and starts the server!
