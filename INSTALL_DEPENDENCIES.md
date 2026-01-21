# Install Dependencies: Fix "No module named 'sqlalchemy'"

## Quick Fix

Run this command in your terminal:

```bash
pip install -r requirements.txt
```

Or install individually:

```bash
pip install flask flask-cors ray sqlalchemy dill
```

## Detailed Setup

### Option 1: Using Virtual Environment (Recommended)

This keeps your project dependencies separate from your system Python:

```bash
# 1. Navigate to project directory
cd /Users/shruthikunjur/projects/constellation

# 2. Create virtual environment
python3 -m venv env

# 3. Activate virtual environment
source env/bin/activate  # On macOS/Linux
# OR
env\Scripts\activate     # On Windows

# 4. Install dependencies
pip install -r requirements.txt

# 5. Verify installation
python3 -c "import flask, sqlalchemy, ray, dill; print('All dependencies installed!')"
```

**Important:** Always activate the virtual environment before running the backend:
```bash
source env/bin/activate  # Activate first
python3 -m flask --app backend.app run --host 0.0.0.0 --port 5000
```

### Option 2: Install Globally (Simpler, but less isolated)

```bash
# Navigate to project directory
cd /Users/shruthikunjur/projects/constellation

# Install all dependencies
pip install flask flask-cors ray sqlalchemy dill

# Or use requirements.txt
pip install -r requirements.txt
```

## Verify Installation

Test that all dependencies are installed:

```bash
python3 -c "import flask; print('Flask:', flask.__version__)"
python3 -c "import flask_cors; print('Flask-CORS: OK')"
python3 -c "import sqlalchemy; print('SQLAlchemy:', sqlalchemy.__version__)"
python3 -c "import ray; print('Ray:', ray.__version__)"
python3 -c "import dill; print('Dill: OK')"
```

If any command fails, that package isn't installed.

## Troubleshooting

### "pip: command not found"

**Solution:**
- Use `pip3` instead of `pip`
- Or install pip: `python3 -m ensurepip --upgrade`

### "Permission denied" error

**Solution:**
- Use `pip install --user -r requirements.txt` (installs for your user only)
- Or use a virtual environment (Option 1 above)

### "No module named 'sqlalchemy'" after installing

**Possible causes:**
1. **Wrong Python version** - Make sure you're using the same Python that has the packages:
   ```bash
   which python3
   python3 --version
   ```

2. **Virtual environment not activated** - If using venv, make sure it's activated:
   ```bash
   source env/bin/activate
   ```

3. **Packages installed in different Python** - Check:
   ```bash
   python3 -m pip list | grep sqlalchemy
   ```

### Still having issues?

1. **Check Python version:**
   ```bash
   python3 --version  # Should be 3.8 or higher
   ```

2. **Reinstall dependencies:**
   ```bash
   pip install --upgrade -r requirements.txt
   ```

3. **Use virtual environment** (cleanest solution):
   ```bash
   python3 -m venv env
   source env/bin/activate
   pip install -r requirements.txt
   ```

## What Each Package Does

- **flask**: Web framework for the backend API
- **flask-cors**: Enables cross-origin requests (needed for frontend to connect)
- **ray**: Distributed computing framework
- **sqlalchemy**: Database ORM (Object-Relational Mapping)
- **dill**: Extended pickle for serializing Python functions

## After Installing

Once dependencies are installed:

1. **Initialize database:**
   ```bash
   python3 -c "from backend.core.database import init_db; init_db()"
   ```

2. **Create test data:**
   ```bash
   python3 backend/create_debug_user.py
   python3 backend/test/add_sample_project.py
   ```

3. **Start backend:**
   ```bash
   python3 -m flask --app backend.app run --host 0.0.0.0 --port 5000
   ```

## Quick Command Reference

```bash
# Install all dependencies
pip install -r requirements.txt

# Check if installed
python3 -c "import sqlalchemy; print('OK')"

# Start backend (after installing)
python3 -m flask --app backend.app run --host 0.0.0.0 --port 5000
```
