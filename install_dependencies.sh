#!/bin/bash
# Quick script to install all Python dependencies
# Usage: ./install_dependencies.sh

echo "=================================="
echo "Installing Constellation Dependencies"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "requirements.txt" ]; then
    echo "❌ Error: requirements.txt not found"
    echo "   Make sure you're in the project root directory"
    exit 1
fi

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 not found"
    echo "   Please install Python 3.8+"
    exit 1
fi

echo "Python version:"
python3 --version
echo ""

# Check if pip is available
if ! command -v pip3 &> /dev/null && ! python3 -m pip --version &> /dev/null; then
    echo "❌ Error: pip3 not found"
    echo "   Installing pip..."
    python3 -m ensurepip --upgrade
fi

echo "Installing dependencies from requirements.txt..."
echo ""

# Install dependencies
if python3 -m pip install -r requirements.txt; then
    echo ""
    echo "=================================="
    echo "✅ Dependencies installed successfully!"
    echo "=================================="
    echo ""
    echo "Verifying installation..."
    python3 -c "import flask, flask_cors, sqlalchemy, ray, dill; print('✓ All packages imported successfully!')" 2>/dev/null

    if [ $? -eq 0 ]; then
        echo ""
        echo "Next steps:"
        echo "1. Initialize database: python3 -c \"from backend.core.database import init_db; init_db()\""
        echo "2. Create debug users: python3 backend/create_debug_user.py"
        echo "3. Add sample project: python3 backend/test/add_sample_project.py"
        echo "4. Start backend: python3 -m flask --app backend.app run --host 0.0.0.0 --port 5000"
    else
        echo ""
        echo "⚠️  Warning: Some packages may not be installed correctly"
        echo "   Try running: pip3 install --upgrade -r requirements.txt"
    fi
else
    echo ""
    echo "❌ Error installing dependencies"
    echo "   Try running: pip3 install --user -r requirements.txt"
    exit 1
fi
