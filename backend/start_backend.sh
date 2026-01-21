#!/bin/bash
# Quick script to start the backend server
# Usage: ./start_backend.sh

echo "=================================="
echo "Starting Constellation Backend"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "backend/app.py" ]; then
    echo "❌ Error: backend/app.py not found"
    echo "   Make sure you're in the project root directory"
    exit 1
fi

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 not found"
    echo "   Please install Python 3.8+"
    exit 1
fi

# Check if Flask is installed
if ! python3 -c "import flask" 2>/dev/null; then
    echo "⚠️  Warning: Flask not found"
    echo "   Installing Flask..."
    pip3 install flask flask-cors
fi

echo "✓ Starting backend server on http://localhost:5000"
echo ""
echo "Press CTRL+C to stop the server"
echo "=================================="
echo ""

# Try port 5000, fallback to 5001 if busy
if lsof -ti:5000 > /dev/null 2>&1; then
    echo "⚠️  Port 5000 is in use, using port 5001 instead"
    PORT=5001
else
    PORT=5000
fi

# Start the Flask server
python3 -m flask --app backend.app run --host 0.0.0.0 --port $PORT
