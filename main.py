# main.py
import os
from flask import Flask, jsonify
from flask_cors import CORS
from db import db # because we only have one instance of SQLAlchemy
from dotenv import load_dotenv

from classes.auth_manager import AuthManager
from classes.admin_user_manager import AdminUserManager
from classes.schedule_planner import SchedulePlanner
from classes.course_search_engine import CourseSearchEngine
from flask import session

# load environment variables
load_dotenv()

# print("[DEBUG] MAIL_PASSWORD:", os.environ.get("MAIL_PASSWORD"))

# initialize flask
app = Flask(__name__)
CORS(app) # to enable communication with frontend

# configure flask mail and token serializer
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer

app.config["MAIL_SERVER"] = "smtp.gmail.com"
app.config["MAIL_PORT"] = 587
app.config["MAIL_USE_TLS"] = True
app.config["MAIL_USERNAME"] = "scu.schedulai@gmail.com"
app.config["MAIL_PASSWORD"] = os.environ.get("MAIL_PASSWORD") # environment-stored app password
app.config["MAIL_DEFAULT_SENDER"] = ("SchedulAI Support", "scu.schedulai@gmail.com")

mail = Mail(app)

# set secret key and initialize
app.secret_key = "testsecretkey"

# token serializer for password reset link
serializer = URLSafeTimedSerializer(app.secret_key)

# configure database
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(BASE_DIR, "schedulai.db")

app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# attach db to app
db.init_app(app)

auth_manager = AuthManager()
admin_manager = AdminUserManager()
planner = SchedulePlanner()
course_engine = CourseSearchEngine()

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
            "message": f"missing required fields: {", ".join(missing)}"
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

@app.post("/login")
def login():
    """
    [POST] user login
    accepts: email, password
    """
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    if not email or not password:
        return {"status": "ERROR", "message": "Email and password are required."}, 400
    
    user = auth_manager.login(email, password)
    if not user:
        return {"status": "ERROR", "message": "Invalid email or password."}, 401
    
    session["user_id"] = user.id
    session["user_type"] = user.__class__.__name__  # assuming user class name identifies type
    return {"status": "SUCCESS", "message": "Login successful.", "user": user.to_safe_dict()}, 200

@app.post("/logout")
def logout():
    """
    [POST] user logout
    """
    session.clear()
    return {"status": "SUCCESS", "message": "Logout successful."}, 200

@app.post("/student/profile/update")
def update_student_profile():
    """
    [POST] update student profile fields
    requires user to be logged in as student
    """
    if "user_id" not in session or session.get("user_type") != "Student":
        return {"status": "ERROR", "message": "Unauthorized access."}, 401
    
    data = request.get_json()
    user_id = session["user_id"]
    student = Student.query.get(user_id)
    if not student:
        return {"status": "ERROR", "message": "Student not found."}, 404
    
    # Use Student.update_profile method (assumed to exist)
    try:
        student.update_profile(**data)
        db.session.commit()
        return {"status": "SUCCESS", "message": "Profile updated successfully.", "student": student.to_safe_dict()}, 200
    except Exception as e:
        db.session.rollback()
        return {"status": "ERROR", "message": f"Failed to update profile: {str(e)}"}, 400

@app.post("/student/password/recover")
def recover_password():
    """
    [POST] recover student password
    accepts: email
    """
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    if not email:
        return {"status": "ERROR", "message": "Email is required."}, 400
    
    success, message = auth_manager.recover_password(email)
    if success:
        return {"status": "SUCCESS", "message": message}, 200
    else:
        return {"status": "ERROR", "message": message}, 400

@app.post("/admin/user/manage")
def admin_manage_user():
    """
    [POST] admin create/update/delete user
    accepts: action (create/update/delete), data (user info)
    """
    if "user_id" not in session or session.get("user_type") != "AdminUser":
        return {"status": "ERROR", "message": "Unauthorized access."}, 401
    
    data = request.get_json()
    action = data.get("action")
    user_data = data.get("data")
    if not action or not user_data:
        return {"status": "ERROR", "message": "Action and data are required."}, 400
    try:
        result = admin_manager.manage_user(action, user_data)
        return {"status": "SUCCESS", "message": f"User {action} successful.", "data": result}, 200
    except Exception as e:
        return {"status": "ERROR", "message": f"Failed to {action} user: {str(e)}"}, 400

@app.post("/admin/course/manage")
def admin_manage_course():
    """
    [POST] admin manage courses
    accepts: action (add/update/delete), course data
    """
    if "user_id" not in session or session.get("user_type") != "AdminUser":
        return {"status": "ERROR", "message": "Unauthorized access."}, 401
    
    data = request.get_json()
    action = data.get("action")
    course_data = data.get("data")
    if not action or not course_data:
        return {"status": "ERROR", "message": "Action and course data are required."}, 400
    try:
        if action == "add":
            result = course_engine.add_course(course_data)
        elif action == "update":
            result = course_engine.update_course(course_data)
        elif action == "delete":
            result = course_engine.delete_course(course_data)
        else:
            return {"status": "ERROR", "message": "Invalid action."}, 400
        return {"status": "SUCCESS", "message": f"Course {action} successful.", "data": result}, 200
    except Exception as e:
        return {"status": "ERROR", "message": f"Failed to {action} course: {str(e)}"}, 400

# @app.route("/test_email")
# def test_email():
#     msg = Message("sdiybt <3", recipients=["ddpatel@scu.edu"])
#     msg.body = "if you see this message, it means two things:\n\n1. the test worked\n2. start diggin' in yo butt twin <3"
#     mail.send(msg)
#     return {"status": "[INFO]", "message": "test email sent successfully"}

if __name__ == "__main__":
    # create tables inside app context
    with app.app_context():
        db.create_all()
        print("[INFO] database connection successful. if model exists, tables created")

        client = app.test_client()
        print("\n[TEST] Starting feature tests")

        # Test data
        test_student = {
            "full_name": "Test User",
            "email": "testuser@example.com",
            "password": "Password1!",
            "major": "Computer Science",
            "grad_year": 2025,
            "bio": "I am a test user.",
            "pronouns": "they/them"
        }

        # 1. Register student
        resp = client.post("/student/register", json=test_student)
        print("[TEST] /student/register response:", resp.json)

        # 2. Login student
        resp = client.post("/login", json={"email": test_student["email"], "password": test_student["password"]})
        print("[TEST] /login (student) response:", resp.json)

        # 3. Update student profile
        update_data = {"bio": "Updated bio for test user.", "pronouns": "she/her"}
        resp = client.post("/student/profile/update", json=update_data)
        print("[TEST] /student/profile/update response:", resp.json)

        # 4. Recover password
        resp = client.post("/student/password/recover", json={"email": test_student["email"]})
        print("[TEST] /student/password/recover response:", resp.json)

        # Insert admin user directly into DB for testing admin endpoints
        admin_email = "admin@example.com"
        admin_password = "AdminPass1!"
        existing_admin = Student.query.filter_by(email=admin_email, role="admin").first()
        if not existing_admin:
            admin_user = Student(
                full_name="Admin User",
                email=admin_email,
                password_hash=generate_password_hash(admin_password),
                major="Administration",
                grad_year=2025,
                bio="System Administrator account for testing.",
                role="admin"
            )
            db.session.add(admin_user)
            db.session.commit()
        else:
            admin_user = existing_admin

        # Login as admin
        resp = client.post("/login", json={"email": admin_email, "password": admin_password})
        print("[TEST] /login (admin) response:", resp.json)

        # 5. Admin create another student user
        new_student_data = {
            "full_name": "New Student",
            "email": "newstudent@example.com",
            "password": "Password1!",
            "major": "Mathematics",
            "grad_year": 2026
        }
        resp = client.post("/admin/user/manage", json={"action": "create", "data": new_student_data})
        print("[TEST] /admin/user/manage (create student) response:", resp.json)

        # 6. Admin add a course
        new_course_data = {
            "course_code": "CS101",
            "course_name": "Introduction to Computer Science",
            "credits": 4,
            "description": "Basic concepts of computer science."
        }
        resp = client.post("/admin/course/manage", json={"action": "add", "data": new_course_data})
        print("[TEST] /admin/course/manage (add course) response:", resp.json)

        # 7. Health check
        resp = client.get("/health")
        print("[TEST] /health response:", resp.json)

        # 8. Logout
        resp = client.post("/logout")
        print("[TEST] /logout response:", resp.json)

        print("\n[TEST] All feature tests completed successfully.")

    app.run(debug=True)
