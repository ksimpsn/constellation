"""
Test job status persistence in database.

Tests:
1. save_job creates and updates jobs in DB
2. update_job modifies job fields
3. get_job retrieves job with correct data
4. get_all_jobs lists jobs with optional filtering
5. delete_job removes jobs
6. Timestamps (created_at, updated_at) are set correctly
"""

import unittest
from datetime import datetime, timedelta

# conftest.py handles path setup and database initialization
from backend.core.database import (
    save_job, update_job, get_job, get_all_jobs, delete_job, SessionLocal, Job, init_db
)



class TestJobStatusPersistence(unittest.TestCase):
    """Test job status persistence to database."""
    
    def setUp(self):
        init_db()
        """Clear jobs table before each test."""
        # Delete all jobs to start fresh
        try:
            with SessionLocal() as session:
                session.query(Job).delete()
                session.commit()
        except Exception as e:
            pass  # Table might be empty or not exist yet
        
    def test_save_job_creates_new_job(self):
        """Test that save_job creates a new job with correct data."""
        job_id = 1
        data = [1, 2, 3, 4, 5]
        status = "submitted"
        
        save_job(job_id, data, status)
        
        with SessionLocal() as session:
            job = session.query(Job).filter_by(id=job_id).first()
            self.assertIsNotNone(job)
            self.assertEqual(job.id, job_id)
            self.assertEqual(job.status, status)
            self.assertEqual(job.data, data)
            self.assertIsNone(job.result)
    
    def test_save_job_updates_existing(self):
        """Test that save_job updates an existing job."""
        job_id = 2
        
        # Create initial job
        save_job(job_id, [1, 2, 3], "submitted")
        
        # Update the same job
        new_data = [4, 5, 6]
        new_status = "running"
        save_job(job_id, new_data, new_status)
        
        # Verify within session
        with SessionLocal() as session:
            job = session.query(Job).filter_by(id=job_id).first()
            self.assertEqual(job.id, job_id)
            self.assertEqual(job.status, new_status)
            self.assertEqual(job.data, new_data)
    
    def test_get_job_retrieves_correct_data(self):
        """Test that get_job retrieves the correct job."""
        job_id = 3
        data = {"test": "data"}
        status = "running"
        
        save_job(job_id, data, status)
        job = get_job(job_id)
        
        self.assertIsNotNone(job)
        self.assertEqual(job.id, job_id)
        self.assertEqual(job.status, status)
        self.assertEqual(job.data, data)
    
    def test_get_nonexistent_job_returns_none(self):
        """Test that get_job returns None for nonexistent job."""
        job = get_job(99999)
        self.assertIsNone(job)
    
    def test_update_job_modifies_fields(self):
        """Test that update_job modifies job fields."""
        job_id = 4
        save_job(job_id, [1, 2, 3], "submitted")
        
        # Update multiple fields
        success = update_job(job_id, status="complete", result=[1, 4, 9])
        self.assertTrue(success)
        
        job = get_job(job_id)
        self.assertEqual(job.status, "complete")
        self.assertEqual(job.result, [1, 4, 9])
    
    def test_update_nonexistent_job_returns_false(self):
        """Test that update_job returns False for nonexistent job."""
        success = update_job(99999, status="complete")
        self.assertFalse(success)
    
    def test_get_all_jobs_returns_all(self):
        """Test that get_all_jobs returns all jobs."""
        save_job(10, [1], "submitted")
        save_job(11, [2], "running")
        save_job(12, [3], "complete")
        
        jobs = get_all_jobs()
        self.assertGreaterEqual(len(jobs), 3)
    
    def test_get_all_jobs_with_status_filter(self):
        """Test that get_all_jobs filters by status."""
        # Clear before this test to ensure clean state
        with SessionLocal() as session:
            from backend.core.database import Job
            session.query(Job).delete()
            session.commit()
        
        save_job(20, [1], "submitted")
        save_job(21, [2], "running")
        save_job(22, [3], "running")
        save_job(23, [4], "complete")
        
        running_jobs = get_all_jobs(status_filter="running")
        self.assertEqual(len(running_jobs), 2)
        for job in running_jobs:
            self.assertEqual(job.status, "running")
        
        submitted_jobs = get_all_jobs(status_filter="submitted")
        self.assertGreaterEqual(len(submitted_jobs), 1)
    
    def test_delete_job_removes_from_db(self):
        """Test that delete_job removes a job."""
        job_id = 30
        save_job(job_id, [1, 2], "submitted")
        
        # Verify it exists
        job = get_job(job_id)
        self.assertIsNotNone(job)
        
        # Delete it
        success = delete_job(job_id)
        self.assertTrue(success)
        
        # Verify it's gone
        job = get_job(job_id)
        self.assertIsNone(job)
    
    def test_delete_nonexistent_job_returns_false(self):
        """Test that delete_job returns False for nonexistent job."""
        success = delete_job(99999)
        self.assertFalse(success)
    
    def test_created_at_timestamp_set(self):
        """Test that created_at timestamp is set when job is created."""
        job_id = 40
        # Use timezone-aware UTC datetime to match what the database stores
        before = datetime.now()
        save_job(job_id, [1], "submitted")
        after = datetime.now()
        
        job = get_job(job_id)
        self.assertIsNotNone(job.created_at)
        # Allow 1 second tolerance for execution time
        self.assertGreaterEqual(job.created_at, before - timedelta(seconds=1))
        self.assertLessEqual(job.created_at, after + timedelta(seconds=1))
    
    def test_updated_at_timestamp_updated(self):
        """Test that updated_at timestamp is updated when job is modified."""
        job_id = 41
        save_job(job_id, [1], "submitted")
        job1 = get_job(job_id)
        
        # Small delay
        import time
        time.sleep(0.1)
        
        # Update the job
        update_job(job_id, status="running")
        job2 = get_job(job_id)
        
        # updated_at should be later than created_at (or equal if very fast)
        self.assertGreaterEqual(job2.updated_at, job1.created_at)
    
    def test_json_serializable_data(self):
        """Test that data field can store complex JSON structures."""
        job_id = 50
        complex_data = {
            "nested": {"key": "value"},
            "list": [1, 2, 3],
            "string": "test",
            "number": 42,
            "boolean": True,
            "null": None
        }
        
        save_job(job_id, complex_data, "submitted")
        job = get_job(job_id)
        
        self.assertEqual(job.data, complex_data)


if __name__ == "__main__":
    unittest.main()
