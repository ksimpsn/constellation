import unittest
from unittest.mock import MagicMock

from backend.core.api import ConstellationAPI
from backend.core.database import (
    save_job,
    get_job,
    update_job,
    delete_job,
    SessionLocal,
    Base,
    engine,
)


class TestAPIBasic(unittest.TestCase):
    """Tests ConstellationAPI integration with the database layer."""

    def setUp(self):
        """Fresh test database before each test."""
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

        # Ensure DB empty
        with SessionLocal() as session:
            session.query(get_job(1).__class__ if get_job(1) else None)
            session.commit()

    def test_api_submit_project_creates_job(self):
        """submit_project should create a DB row with status=submitted."""
        api = ConstellationAPI()

        # mock ray submit
        api.server.submit_tasks = MagicMock(return_value=["fake_future"])

        job_id = api.submit_project([1, 2, 3])

        job = get_job(job_id)
        self.assertIsNotNone(job)
        self.assertEqual(job.status, "submitted")

        # expected DB format
        expected_data = [
            {"task_id": 0, "chunk": 1, "params": None},
            {"task_id": 1, "chunk": 2, "params": None},
            {"task_id": 2, "chunk": 3, "params": None},
        ]
        print("JOB.DATA: ", job.data)
        self.assertEqual(job.data, expected_data)

    def test_api_check_status_no_futures_yet(self):
        """If no futures exist, job status should remain submitted."""
        api = ConstellationAPI()
        api.server.submit_tasks = MagicMock(return_value=["f"])

        job_id = api.submit_project([1])

        # override futures: pretend they aren't done
        api.futures = {job_id: []}

        status = api.check_status(job_id)
        self.assertEqual(status, "submitted")

    def test_api_get_results_updates_db(self):
        """Calling get_results should update DB status and results."""
        api = ConstellationAPI()

        api.server.submit_tasks = MagicMock(return_value=["fake_future"])
        api.server.get_results = MagicMock(return_value=[100, 200])

        job_id = api.submit_project([10, 20])
        results = api.get_results(job_id)

        self.assertEqual(results, [100, 200])

        job = get_job(job_id)
        self.assertEqual(job.status, "complete")
        self.assertEqual(job.results, [100, 200])


if __name__ == "__main__":
    unittest.main()
