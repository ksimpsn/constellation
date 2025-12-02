# 🌌 Constellation

**Constellation** is a distributed computing platform that connects researchers with volunteers who contribute spare computing power to accelerate scientific discovery.

Researchers can upload computational projects, which are broken into small tasks and distributed across participating machines. Volunteers earn recognition for their contributions while supporting real-world research in areas like climate modeling, biology, and AI.

The system is built on **Ray**, enabling scalable task distribution, progress tracking, and result aggregation. Future iterations will include security mechanisms for sandboxing and verification to ensure correctness and trustworthiness across volunteer devices.

### Backend Setup

1. **Navigate to the project directory:**
   cd constellation
2. **Create and activate a virtual environment:**
    python3 -m venv env
    source env/bin/activate  # On Windows: env\Scripts\activate
3. **Install Python dependencies:**
    pip install flask flask-cors ray sqlalchemy dill
4. **Initialize the database:**
    python3 -c "from backend.core.database import init_db; init_db()"
5. **Run the Flask backend server:**
    python3 -m flask --app backend.app run --reload --host 0.0.0.0 --port 5001

    The backend API will be available at `http://localhost:5001`

### Frontend Setup

1. **Navigate to the frontend directory:**
   cd frontend
2. **Install Node.js dependencies:**
   npm install
3. **Run the development server:**   
   npm run dev:web
      The frontend will be available at `http://localhost:5173`

## Usage

1. **Submit a Project:**
   - Navigate to `http://localhost:5173/submit`
   - Enter project title and description
   - Upload a Python script (must contain a `main(row)` function)
   - Upload a CSV or JSON dataset
   - Click "Submit Project"

2. **Monitor Status:**
   - Status automatically updates every 2 seconds
   - Status transitions: `submitted` → `running` → `complete`
   - Results are automatically fetched when the job completes

3. **View Results:**
   - Results appear automatically when status becomes `complete`
   - Results are displayed in JSON format below the status
