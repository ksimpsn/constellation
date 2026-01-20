# Multi-Machine LAN Setup Guide

Quick guide for setting up Constellation across multiple machines on the same network.

## Architecture

**Researcher Machine (Head Node):**
- Runs Flask API + Ray head node
- Accepts worker connections and distributes tasks

**Volunteer Machines (Workers):**
- Connect to head node via API
- Receive and process tasks automatically

## Prerequisites

- All machines on same Wi-Fi network
- Python 3.8+ and Ray installed: `pip install ray`
- User accounts in database (use debug users for testing)

## Debug Users

For testing, create debug users:

```bash
python3 backend/create_debug_user.py
```

This creates three test users:
- **Volunteer**: `debug-volunteer@constellation.test` (can connect workers)
- **Researcher**: `debug-researcher@constellation.test` (can submit projects)
- **Both**: `debug-both@constellation.test` (can do both)

Copy the `user_id` from the output to use in commands below.

## Step 1: Start Head Node (Researcher)

On the researcher's machine:

```bash
cd constellation
python3 -m flask --app backend.app run --host 0.0.0.0 --port 5001
```

The Flask server automatically starts the Ray head node. Note the IP address shown (e.g., `10.5.0.2`).

**Note:** If port 5001 is in use, use a different port and update commands accordingly.

## Step 2: Connect Workers (Volunteers)

### Same Machine (Localhost Testing)

```bash
curl -X POST http://localhost:5001/api/workers/connect \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-xxx",
    "worker_name": "MyLaptop",
    "head_node_ip": "10.5.0.2"
  }'
```

Replace `user-xxx` with your volunteer user_id from debug users script.

### Multiple Machines (LAN)

On each volunteer's machine:

```bash
curl -X POST http://<HEAD_NODE_IP>:5001/api/workers/connect \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-xxx",
    "worker_name": "MyLaptop",
    "head_node_ip": "<HEAD_NODE_IP>"
  }'
```

Replace:
- `<HEAD_NODE_IP>`: The head node IP from Step 1 (e.g., `10.5.0.2`)
- `user-xxx`: Your volunteer user_id

**Response:**
```json
{
  "worker_id": "worker-abc123",
  "status": "connected",
  "message": "Worker connected successfully"
}
```

## Step 3: Submit Projects

Once workers are connected, submit projects:

```bash
curl -X POST http://localhost:5001/submit \
  -F "title=My Project" \
  -F "description=Processing data" \
  -F "py_file=@project.py" \
  -F "data_file=@dataset.csv"
```

Tasks will automatically distribute across connected workers.

## Troubleshooting

**Cannot connect:**
- Verify both machines on same Wi-Fi network
- Check firewall (ports 5001 and 6379)
- Use `localhost` for same-machine testing
- Use network IP (not `127.0.0.1`) for multi-machine

**User not found:**
- Run `python3 backend/create_debug_user.py` to create test users
- Use the `user_id` from the script output

**Ray connection issues:**
- Ensure Ray is installed: `pip install ray`
- Verify head node is running (check Flask server logs)
- Head node should show "listening on 0.0.0.0" in logs
