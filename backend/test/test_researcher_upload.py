import time
from backend.core.api import ConstellationAPI
from backend.core.database import init_db

def main():
    print("=== Constellation Uploaded Project End-to-End Test ===")

    if os.path.exists("constellation.db"):
        os.remove("constellation.db")

    init_db()

    api = ConstellationAPI()

    # -----------------------------------------------------
    # GENERATE THE DATASET
    # -----------------------------------------------------

    with open("backend/test/dataset.csv", "w") as f:
        f.write("x\n")
        for i in range(1, 1001):
            f.write(f"{i}\n")

    print("Wrote 1000-line dataset.csv")

    # -----------------------------------------------------
    # LOAD THE RELATIVE PATHS
    # -----------------------------------------------------
    code_path = "backend/test/project.py"
    dataset_path = "backend/test/dataset.csv"

    # -----------------------------------------------------
    # SUBMIT THE PROJECT
    # -----------------------------------------------------
    job_id = api.submit_uploaded_project(
        code_path=code_path,
        dataset_path=dataset_path,
        file_type="csv",
        chunk_size=2,       # chunk 2 rows per Ray task
        func_name="main"    # must exist inside project.py
    )

    print(f"Submitted project, job_id={job_id}")

    # -----------------------------------------------------
    # POLL STATUS UNTIL COMPLETE
    # -----------------------------------------------------
    while True:
        status = api.check_status(job_id)
        print(f"STATUS: {status}")

        if status == "complete":
            break

        time.sleep(0.1)

    # -----------------------------------------------------
    # GET RESULTS
    # -----------------------------------------------------
    results = api.get_results(job_id)
    print("\n=== FINAL RESULTS ===")
    print(results)
    print("======================\n")


if __name__ == "__main__":
    main()