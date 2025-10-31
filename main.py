# main.py
from flask import Flask, jsonify
from flask_cors import CORS
# from flask_sqlalchemy import SQLAlchemy
from db import db # because we only have one instance of SQLAlchemy
import os

# initialize flask
app = Flask(__name__)
CORS(app) # to enable communication with frontend

# configure database
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(BASE_DIR, "schedulai.db")

app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# # initialize SQLAlchemy
# db = SQLAlchemy(app)

# attach db to app
db.init_app(app)

# import health check route (to confirm server is running)
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "HEALTHY", "message": "[INFO] flask backend is running"}), 200

from flask import request
from werkzeug.security import generate_password_hash
import re
from classes.student_model import Student # ensure student model is imported
from db import db

# student registration endpoint
@app.post("/student/register")
def register_student():
    """
    [POST] register a new student account
    accepts: full_name, email, password, major, grad_year, bio (optional), pronouns (optional)
    """
    
    data = request.get_json()
    
    # validate required fields
    required_fields = ["full_name", "email", "password", "major", "grad_year"]
    missing = [f for f in required_fields if f not in data or not data[f]]
    if missing:
        return {
            "status": "ERROR",
            "message": f"missing required fields: {', '.join(missing)}"
        }, 400
        
    full_name = data["full_name"].strip()
    email = data["email"].strip().lower()
    password = data["password"]
    major = data["major"].strip()
    grad_year = data["grad_year"]
    bio = data.get("bio")
    pronouns = data.get("pronouns")
    
    # validate password (8 characters, 1 uppercase/lowercase, 1 number, 1 special character)
    password_regex = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
    if not re.match(password_regex, password):
        return {
            "status": "ERROR",
            "message": ("password must be at least 8 characters long and include "
                        "one uppercase, one lowercase, one number, and one special character")
        }, 400
        
    # validate unique email
    existing = Student.query.filter_by(email=email).first()
    if existing:
        return {
            "status": "ERROR",
            "message": "an account with this email already exists"
        }, 409 # signifies conflict (duplicate resource) error
        
    # hash password
    password_hash = generate_password_hash(password)
    
    # create new student instance
    student = Student(
        full_name=full_name,
        email=email,
        password_hash=password_hash,
        major=major,
        grad_year=grad_year,
        bio=bio,
        pronouns=pronouns
    )
    
    # add and commit to database
    db.session.add(student)
    db.session.commit()
    
    # return successful account creation
    return {
        "status": "SUCCESS",
        "message": "student account created successfully",
        "student": student.to_safe_dict()
    }, 201 # signifies resource created successfully

if __name__ == "__main__":
    # create tables inside app context
    with app.app_context():
        db.create_all()
        print("[INFO] database connection successful. if model exists, tables created")
    app.run(debug=True)