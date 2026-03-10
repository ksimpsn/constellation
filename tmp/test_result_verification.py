# import requests

# url = "http://localhost:5001/submit_project"

# payload = {
#     "tasks": [
#         {
#             "task_id": 1,
#             "chunk": 2,
#             "expected_result": 4
#         },
#         {
#             "task_id": 2,
#             "chunk": 3,
#             "expected_result": 9
#         }
#     ]
# }

# r = requests.post(url, json=payload)
# # print(r.json())
# print("Status:", r.status_code)
# print("Raw text:", r.text)

import requests

files = {
    "py_file": open("test_func.py", "rb"),
    "data_file": open("test_data.csv", "rb")
}

data = {
    "title": "test",
    "description": "test job"
}

r = requests.post(
    "http://localhost:5001/submit",
    files=files,
    data=data
)

print(r.status_code)
print(r.text)
print(r.json())
