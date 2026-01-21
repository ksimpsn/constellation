# Fix "Port 5000 is in use" Error

## Quick Fix: Use a Different Port

The easiest solution is to use port 5001 instead:

```bash
python3 -m flask --app backend.app run --host 0.0.0.0 --port 5001
```

Then update the frontend to use port 5001, or set the environment variable:
```bash
export VITE_API_URL=http://localhost:5001
```

## Option 1: Find and Kill What's Using Port 5000

### On macOS:

```bash
# Find what's using port 5000
lsof -ti:5000

# Kill it (replace PID with the number from above)
kill -9 <PID>

# Or kill all processes on port 5000
lsof -ti:5000 | xargs kill -9
```

### Check if it's AirPlay Receiver:

On macOS, AirPlay Receiver often uses port 5000. To disable it:
1. Open **System Settings** (or System Preferences)
2. Go to **General** → **AirDrop & Handoff**
3. Turn off **AirPlay Receiver**

## Option 2: Use a Different Port (Recommended)

Since port 5000 is commonly used, let's use 5001:

```bash
# Start backend on port 5001
python3 -m flask --app backend.app run --host 0.0.0.0 --port 5001
```

Then update frontend API URL. The frontend will automatically use the port you specify.

## Option 3: Check What's Using the Port

```bash
# See what's using port 5000
lsof -i :5000

# Or use netstat
netstat -an | grep 5000
```

## Recommended Solution

**Use port 5001** - it's less likely to conflict:

```bash
# Backend
python3 -m flask --app backend.app run --host 0.0.0.0 --port 5001

# Frontend will automatically use http://localhost:5001
# (or set VITE_API_URL=http://localhost:5001)
```
