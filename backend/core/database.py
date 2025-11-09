from sqlalchemy import create_engine, Column, Integer, String, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

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
    result = Column(JSON, nullable=True)  # Store job result after completion


# Create tables in the database
def init_db():
    Base.metadata.create_all(bind=engine)
    print("Database initialized and tables created.")


# Helper for getting a new database session
def get_session():
    return SessionLocal()


# Simple test connection function
if __name__ == "__main__":
    init_db()
    session = SessionLocal()
    print("Test DB session created successfully.")
    session.close()
