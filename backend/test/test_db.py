# backend/tests/test_db_helpers_unittest.py
import unittest
from backend.core.database import (
    save_job,
    update_job,
    get_job,
    init_db,
    Base,
    engine,
    SessionLocal,
)


class TestDBHelpers(unittest.TestCase):
    """Test save_job, update_job, and get_job functions."""

    def setUp(self):
        """Reset database before each test."""
        init_db()
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

    def test_save_and_get_job(self):
        """Test saving a job and retrieving it."""
        job_id = 123
        data = [1, 2, 3]
        status = "submitted"

        save_job(job_id, data, status)

        with SessionLocal() as session:
            job = get_job(job_id)
            self.assertIsNotNone(job)
            self.assertEqual(job.id, job_id)
            self.assertEqual(job.status, status)
            self.assertEqual(job.data, data)
            self.assertIsNone(job.results)

    def test_update_job(self):
        """Test updating an existing job."""
        job_id = 5
        save_job(job_id, [10], "submitted")

        # Update status and result
        success = update_job(job_id, status="complete", results=[100])
        self.assertTrue(success)

        job = get_job(job_id)
        self.assertEqual(job.status, "complete")
        self.assertEqual(job.results, [100])


if __name__ == "__main__":
    unittest.main()
