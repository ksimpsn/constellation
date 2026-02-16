import requests

url = "http://localhost:5001/submit_project"

payload = {
    "tasks": [
        {
            "task_id": 1,
            "chunk": 2,
            "expected_result": 4
        },
        {
            "task_id": 2,
            "chunk": 3,
            "expected_result": 9
        }
    ]
}

r = requests.post(url, json=payload)
print(r.json())
