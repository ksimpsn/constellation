from sqlalchemy import create_engine, Column, Integer, String, Text, JSON, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager
from datetime import datetime

# Create SQLite database (local file: constellation.db)
DATABASE_URL = "sqlite:///constellation.db"

# SQLAlchemy setup
engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


# Job table mirrors `self.jobs` in api.py
class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, default="pending")
    data = Column(JSON)   # Store job input data (list, dict, etc.)
    results = Column(JSON, nullable=True)  # Store job results after completion
    created_at = Column(DateTime, default=datetime.now)  # Timestamp when job created
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)  # Last update time

# Create tables in the database
def init_db():
    Base.metadata.create_all(bind=engine)
    print("Database initialized and tables created.")


# Context-managed database session helper
@contextmanager
def get_session():
    """
    Context-managed DB session.
    Use like: `with get_session() as session:` so sessions are always closed.
    """
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

def save_job(job_id, data, status):
    with SessionLocal() as session:
        # create or replace job with provided id
        job = session.query(Job).filter_by(id=job_id).first()
        if job is None:
            job = Job(id=job_id, data=data, status=status)
            session.add(job)
        else:
            job.data = data
            job.status = status
            job.updated_at = datetime.now()
        session.commit()
        return job

def update_job(job_id, **kwargs):
    with SessionLocal() as session:
        job = session.query(Job).filter_by(id=job_id).first()
        if not job:
            return False
        for key, value in kwargs.items():
            setattr(job, key, value)
        job.updated_at = datetime.now()
        session.commit()
        return True

# will return None if job_id not found
def get_job(job_id):
    with SessionLocal() as session:
        job = session.query(Job).filter_by(id=job_id).first()
        return job

def get_all_jobs(status_filter=None):
    """
    Retrieve all jobs, optionally filtered by status.
    
    Parameters:
        status_filter: optional status string (e.g., 'submitted', 'running', 'complete')
    
    Returns:
        list of Job objects
    """
    with SessionLocal() as session:
        query = session.query(Job)
        if status_filter:
            query = query.filter_by(status=status_filter)
        jobs = query.all()
        return jobs

def delete_job(job_id):
    """Delete a job from the database."""
    with SessionLocal() as session:
        job = session.query(Job).filter_by(id=job_id).first()
        if not job:
            return False
        session.delete(job)
        session.commit()
        return True

# Simple test connection function
if __name__ == "__main__":
    init_db()
    with get_session() as session:
        print("Test DB session created successfully.")