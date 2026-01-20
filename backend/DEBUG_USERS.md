# Debug Users Guide

This guide explains how to create and use debug users for testing the Constellation multi-device setup.

## What are Debug Users?

Debug users are test accounts created in the database that allow you to test the worker connection and role-based access features without setting up full user accounts. They're useful for:

- Testing the `/api/workers/connect` endpoint
- Testing role-based access control (researcher vs volunteer)
- Local development and testing
- Demonstrating the multi-device setup

## Creating Debug Users

Run the debug user creation script:

```bash
python3 backend/create_debug_user.py
```

This will create three debug users:

1. **Debug Volunteer** - Can connect machines as workers
   - Email: `debug-volunteer@constellation.test`
   - Role: `volunteer`
   - Use this to test worker connections

2. **Debug Researcher** - Can start head node and submit projects
   - Email: `debug-researcher@constellation.test`
   - Role: `researcher`
   - Use this to test researcher-only features

3. **Debug Both** - Has both researcher and volunteer roles
   - Email: `debug-both@constellation.test`
   - Role: `researcher,volunteer`
   - Use this to test users who can do both

## Using Debug Users

### Connect a Worker (Volunteer Role)

Use the volunteer user to connect a machine as a worker:

```bash
curl -X POST http://localhost:5001/api/workers/connect \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-112aa97a-98f0-43e6-b141-207da45fa97a",
    "worker_name": "MyLaptop",
    "head_node_ip": "10.5.0.2"
  }'
```

**Note:** Replace the `user_id` with the actual ID returned by the creation script (it will be different each time).

### Start Head Node (Researcher Role)

Use the researcher user to start the head node:

```bash
curl -X POST http://localhost:5001/api/cluster/start-head \
  -H "Content-Type: application/json" \
  -d '{
    "researcher_id": "user-a5b62e90-0025-41c4-b08a-f8539efe1a3a"
  }'
```

### Get Your User IDs

After running the creation script, it will display all the user IDs. Copy the relevant ID for your test.

Alternatively, check the database:

```python
from backend.core.database import get_user_by_email

volunteer = get_user_by_email("debug-volunteer@constellation.test")
print(f"Volunteer user_id: {volunteer.user_id}")

researcher = get_user_by_email("debug-researcher@constellation.test")
print(f"Researcher user_id: {researcher.user_id}")
```

## Example Workflow

1. **Create debug users:**
   ```bash
   python3 backend/create_debug_user.py
   ```

2. **Start Flask server:**
   ```bash
   python3 -m flask --app backend.app run --host 0.0.0.0 --port 5001
   ```

3. **Start head node (optional, can use researcher user_id or omit):**
   ```bash
   curl -X POST http://localhost:5001/api/cluster/start-head \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

4. **Connect a worker using volunteer user:**
   ```bash
   # Replace with your volunteer user_id from step 1
   curl -X POST http://localhost:5001/api/workers/connect \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": "user-112aa97a-98f0-43e6-b141-207da45fa97a",
       "worker_name": "TestWorker",
       "head_node_ip": "10.5.0.2"
     }'
   ```

## Troubleshooting

### User Not Found Error

If you get `{"error":"User user-xxx not found"}`, make sure you:
1. Ran the creation script successfully
2. Used the correct user_id (copy from script output)
3. The database file exists (`constellation.db`)

### Role Validation Error

If you get a role validation error:
- **For worker connection:** Use a user with `volunteer` role (or `researcher,volunteer`)
- **For head node start:** Use a user with `researcher` role (or omit researcher_id entirely)

### User Already Exists

If you run the script multiple times, it will skip creating users that already exist and just display their information. This is safe and won't cause errors.

## Database Location

Debug users are stored in the same database as production users:
- Database file: `constellation.db` (in project root)
- Table: `users`

## Production Usage

⚠️ **Important:** Debug users are for development and testing only. In production:
- Create real user accounts through your authentication system
- Don't use debug emails or test roles
- Validate and sanitize user input properly
- Use proper authentication tokens instead of hardcoded user_ids

## Cleaning Up

To remove debug users from the database:

```python
from backend.core.database import get_user_by_email, get_session
from backend.core.database import User

with get_session() as session:
    volunteer = get_user_by_email("debug-volunteer@constellation.test")
    if volunteer:
        session.delete(volunteer)
    
    researcher = get_user_by_email("debug-researcher@constellation.test")
    if researcher:
        session.delete(researcher)
    
    both = get_user_by_email("debug-both@constellation.test")
    if both:
        session.delete(both)
    
    session.commit()
    print("Debug users removed")
```
