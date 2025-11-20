#!/bin/bash
echo starting SchedulAI...

# check virtual environment
if [ ! -d "venv" ]; then
    echo "creating virtual environment..."
    python3 -m venv venv
fi

# activate virtual environment
echo "activating virtual environment..."
source venv/bin/activate

# install python dependencies if needed
echo "checking python dependencies..."
pip install -r requirements.txt --quiet

# check frontend dependencies
if [ ! -d "frontend/node_modules" ]; then
    echo "installing frontend dependencies..."
    cd frontend
    npm install --silent
    cd ..
fi

# check if .env file exists
if [ ! -f ".env" ]; then
    echo "ERROR: .env file is missing!"
    exit 1
fi

echo starting backend...

# start backend in background
python main.py &
BACKEND_PID=$!

sleep 3
    
echo starting frontend...

# start frontend
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo "backend:  http://localhost:5000"
echo "frontend: http://localhost:3000"
echo "health:   http://localhost:5000/health"

# cleanup processes
cleanup() {
    echo "stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# trap interrupt signal
trap cleanup INT

# wait for both processes
wait