# Debug Users Setup for Researcher Dashboard

This guide explains how the Researcher Dashboard uses the debug users system from `DEBUG_USERS.md`.

## How It Works

The Researcher Dashboard automatically uses the **debug researcher** user created by `create_debug_user.py`:

1. **Frontend** calls `GET /api/researcher/debug-id`
2. **Backend** looks up or creates `debug-researcher@constellation.test`
3. **Backend** returns the researcher's `user_id`
4. **Frontend** uses that `user_id` to fetch projects

## Setup Steps

### 1. Create Debug Users

```bash
python3 backend/create_debug_user.py
```

This creates:
- `debug-researcher@constellation.test` ← **Used by dashboard**
- `debug-volunteer@constellation.test`
- `debug-both@constellation.test`

### 2. View Debug User Info

```bash
python3 backend/test/get_debug_users.py
```

Shows all debug users and their IDs.

### 3. Add Sample Projects

```bash
python3 backend/test/add_sample_project.py
```

This automatically uses the debug researcher to create a project.

### 4. Start Backend

```bash
python3 -m flask --app backend.app run --host 0.0.0.0 --port 5000
```

### 5. Open Frontend

The dashboard will automatically:
- Fetch the debug researcher ID
- Load all projects for that researcher
- Display them in the dashboard

## API Endpoints

### Get Debug Researcher ID
```bash
GET /api/researcher/debug-id
```

Response:
```json
{
  "researcher_id": "user-xxx",
  "email": "debug-researcher@constellation.test",
  "name": "Debug Researcher",
  "role": "researcher"
}
```

### Get All Debug Users
```bash
GET /api/debug-users
```

Response:
```json
{
  "volunteer": {
    "user_id": "user-xxx",
    "email": "debug-volunteer@constellation.test",
    "name": "Debug Volunteer",
    "role": "volunteer"
  },
  "researcher": {
    "user_id": "user-xxx",
    "email": "debug-researcher@constellation.test",
    "name": "Debug Researcher",
    "role": "researcher"
  },
  "both": {
    "user_id": "user-xxx",
    "email": "debug-both@constellation.test",
    "name": "Debug Both",
    "role": "researcher,volunteer"
  }
}
```

## How Frontend Uses It

The frontend (`ResearcherDashboard.tsx`) automatically:

1. **Fetches debug researcher ID** on mount:
   ```typescript
   fetch(`${API_BASE_URL}/api/researcher/debug-id`)
   ```

2. **Gets researcher ID from response**:
   ```typescript
   const data = await response.json();
   setResearcherId(data.researcher_id);
   ```

3. **Fetches projects for that researcher**:
   ```typescript
   fetch(`${API_BASE_URL}/api/researcher/${researcherId}/projects`)
   ```

No manual configuration needed! The dashboard automatically uses the debug researcher.

## Consistency with DEBUG_USERS.md

- ✅ Uses same email: `debug-researcher@constellation.test`
- ✅ Uses same creation method: `create_user()` with same parameters
- ✅ Creates user if it doesn't exist (same as `create_debug_user.py`)
- ✅ Returns same user_id format

## Troubleshooting

### "Failed to fetch" Error

1. **Check backend is running:**
   ```bash
   curl http://localhost:5000/
   ```

2. **Check debug users exist:**
   ```bash
   python3 backend/test/get_debug_users.py
   ```

3. **Create debug users if missing:**
   ```bash
   python3 backend/create_debug_user.py
   ```

4. **Test API endpoint:**
   ```bash
   curl http://localhost:5000/api/researcher/debug-id
   ```

### No Projects Showing

1. **Add a sample project:**
   ```bash
   python3 backend/test/add_sample_project.py
   ```

2. **Check database:**
   ```bash
   python3 backend/test/inspect_database.py
   ```

### Wrong Researcher ID

The frontend automatically fetches the correct ID. If you see a different ID:
- The debug researcher was recreated (new ID)
- This is normal - the API will return the current ID
- Just refresh the frontend

## Full Workflow Example

```bash
# 1. Create debug users
python3 backend/create_debug_user.py

# 2. View debug user info
python3 backend/test/get_debug_users.py

# 3. Add sample project (uses debug researcher automatically)
python3 backend/test/add_sample_project.py

# 4. Inspect database
python3 backend/test/inspect_database.py

# 5. Start backend
python3 -m flask --app backend.app run --host 0.0.0.0 --port 5000

# 6. Open frontend - dashboard will automatically use debug researcher!
```

The dashboard is now fully integrated with the DEBUG_USERS.md system! 🎉
