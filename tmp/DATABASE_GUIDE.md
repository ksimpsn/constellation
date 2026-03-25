# Database Guide: How to Inspect and Add Data

This guide explains how to work with the Constellation database.

## Database Location

The database is a SQLite file located at:
```
constellation.db
```
(in the project root directory)

## Quick Start

### 1. Inspect What's in the Database

```bash
python3 backend/test/inspect_database.py
```

This will show you:
- All users (researchers, volunteers)
- All projects
- All runs (executions of projects)
- All tasks (individual work units)
- All task results
- All workers (volunteer machines)

### 2. Add a Sample Project

```bash
python3 backend/test/add_sample_project.py
```

This will:
- Create a researcher user (if it doesn't exist)
- Create a sample dataset (100 rows)
- Create a sample Python function
- Submit a project via the API (creates Project, Run, Tasks in database)
- Show you the job ID

### 3. Create Test Data for Dashboard

```bash
python3 backend/test/setup_test_data.py
```

This creates:
- A debug researcher user
- 3 sample projects with various completion states
- Runs and tasks with different statuses

### 4. Create Debug Users

```bash
python3 backend/create_debug_user.py
```

This creates:
- `debug-volunteer@constellation.test` (volunteer role)
- `debug-researcher@constellation.test` (researcher role)
- `debug-both@constellation.test` (both roles)

## How Projects Are Created

Projects are created through the API using `ConstellationAPI.submit_uploaded_project()`:

```python
from backend.core.api import ConstellationAPI

api = ConstellationAPI()
job_id = api.submit_uploaded_project(
    code_path="path/to/project.py",
    dataset_path="path/to/dataset.csv",
    file_type="csv",
    chunk_size=10,  # rows per task
    func_name="main",
    researcher_id="user-xxx",
    title="My Project",
    description="Project description"
)
```

This automatically creates:
1. **Project** record in `projects` table
2. **Run** record in `runs` table
3. **Task** records in `tasks` table (one per chunk)

## Database Structure

### Users Table
- `user_id` (primary key)
- `email`
- `name`
- `role` (researcher, volunteer, or both)
- `created_at`, `updated_at`

### Projects Table
- `project_id` (primary key)
- `researcher_id` (foreign key to users)
- `title`
- `description`
- `status` (active, archived, deleted)
- `created_at`, `updated_at`

### Runs Table
- `run_id` (primary key)
- `project_id` (foreign key to projects)
- `status` (pending, running, completed, failed)
- `total_tasks`, `completed_tasks`, `failed_tasks`
- `started_at`, `completed_at`

### Tasks Table
- `task_id` (primary key)
- `run_id` (foreign key to runs)
- `task_index` (chunk index)
- `status` (pending, assigned, running, completed, failed)
- `assigned_worker_id` (foreign key to workers)
- `started_at`, `completed_at`

### TaskResults Table
- `task_result_id` (primary key)
- `task_id` (foreign key to tasks)
- `worker_id` (foreign key to workers)
- `result_data` (JSON)
- `runtime_seconds`
- `completed_at`

## API Endpoints

### Get Debug Researcher ID
```bash
curl http://localhost:5000/api/researcher/debug-id
```

Response:
```json
{
  "researcher_id": "user-xxx",
  "email": "debug-researcher@constellation.test"
}
```

### Get Researcher Projects
```bash
curl http://localhost:5000/api/researcher/{researcher_id}/projects
```

Response:
```json
{
  "projects": [
    {
      "id": "project-xxx",
      "title": "My Project",
      "description": "...",
      "progress": 75,
      "totalContributors": 10,
      "activeContributors": 3,
      "totalTasks": 100,
      "completedTasks": 75,
      "failedTasks": 2,
      ...
    }
  ]
}
```

## Troubleshooting

### "Failed to fetch" Error

1. **Check if backend is running:**
   ```bash
   python3 -m flask --app backend.app run --host 0.0.0.0 --port 5000
   ```

2. **Check CORS settings** - The backend should have CORS enabled (it does by default)

3. **Check the API URL** - Frontend uses `http://localhost:5000` by default

4. **Check browser console** - Look for CORS errors or network errors

### No Projects Showing

1. **Run the setup script:**
   ```bash
   python3 backend/test/setup_test_data.py
   ```

2. **Or add a sample project:**
   ```bash
   python3 backend/test/add_sample_project.py
   ```

3. **Check the database:**
   ```bash
   python3 backend/test/inspect_database.py
   ```

### Database Not Found

The database is created automatically when you:
- Run `init_db()` (happens in most scripts)
- Submit a project via the API
- Run any test script

If you want to start fresh:
```bash
rm constellation.db
python3 backend/test/setup_test_data.py
```

## Example: Full Workflow

```bash
# 1. Create debug users
python3 backend/create_debug_user.py

# 2. Add a sample project
python3 backend/test/add_sample_project.py

# 3. Inspect the database
python3 backend/test/inspect_database.py

# 4. Start the backend server
python3 -m flask --app backend.app run --host 0.0.0.0 --port 5000

# 5. Open frontend (in another terminal)
# The dashboard should now show your project!
```
