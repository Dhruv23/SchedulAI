# main.py
import os
from datetime import timedelta
from flask import Flask, jsonify, send_file

# password hashing and token verification
from flask import request, url_for, redirect
from werkzeug.security import generate_password_hash, check_password_hash
import re
from itsdangerous import BadSignature, SignatureExpired

# transcript utilities
from werkzeug.utils import secure_filename

# CORS for frontend-backend communication
from flask_cors import CORS
from db import db # because we only have one instance of SQLAlchemy
from dotenv import load_dotenv

# import classes
from classes.student_model import Student
from classes.course_model import Course
from classes.auth_manager import AuthManager
from classes.admin_user_manager import AdminUserManager
from classes.schedule_planner import SchedulePlanner
from classes.course_search_engine import CourseSearchEngine
from classes.transcript_to_df import TranscriptParser
from classes.transcript_course_model import TranscriptCourse
from classes.student_progress_tracker import StudentProgressTracker
from classes.chatbot_interface import ChatbotInterface
from flask import session
import pandas as pd
import re
from classes.transcript_to_df import TranscriptParser
# load environment variables
load_dotenv()

# initialize flask
app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"]) # to enable communication with frontend

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
app.secret_key = os.environ.get("SECRET_KEY")
if not app.secret_key:
    raise ValueError("[ERROR] secret key not set. please configure in .env file")

# token serializer for password reset link
serializer = URLSafeTimedSerializer(app.secret_key)

# password reset helper functions
RESET_SALT = "schedulai-password-reset" # extra security exclusive to password reset tokens

def generate_reset_token(email: str) -> str:
    """
    create a signed, url-safe token (encodes user email)
    stateless token, and no db rows are written
    """
    return serializer.dumps(email, salt=RESET_SALT)

def verify_reset_token(token: str, max_age_seconds: int = 600) -> str | None:
    """
    verify token signature and age
    return embedded email if valid, else return none
    """
    try:
        email = serializer.loads(token, salt=RESET_SALT, max_age=max_age_seconds)
        return email
    except (BadSignature, SignatureExpired):
        return None

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

# configure upload folder
UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# import health check route (to confirm server is running)
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "HEALTHY", "message": "[INFO] flask backend is running"}), 200

# Debug endpoint for troubleshooting
@app.route("/debug", methods=["GET"])
def debug_info():
    """Provide debug information for troubleshooting"""
    try:
        import sys
        import platform
        return jsonify({
            "status": "SUCCESS",
            "debug_info": {
                "python_version": sys.version,
                "platform": platform.platform(),
                "flask_running": True,
                "database_file_exists": os.path.exists("schedulai.db"),
                "env_file_exists": os.path.exists(".env"),
                "upload_folder_exists": os.path.exists(UPLOAD_FOLDER),
                "cors_origins": ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"]
            }
        }), 200
    except Exception as e:
        return jsonify({
            "status": "ERROR",
            "message": f"Debug info error: {str(e)}"
        }), 500

# Global error handlers for better debugging
@app.errorhandler(500)
def internal_error(error):
    print(f"[ERROR] Internal server error: {error}")
    return jsonify({
        "status": "ERROR", 
        "message": "Internal server error. Check server logs for details.",
        "error_type": "INTERNAL_ERROR"
    }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "status": "ERROR", 
        "message": "Endpoint not found",
        "error_type": "NOT_FOUND"
    }), 404

@app.errorhandler(400)
def bad_request(error):
    return jsonify({
        "status": "ERROR", 
        "message": "Bad request. Check your request format.",
        "error_type": "BAD_REQUEST"
    }), 400

# CORS preflight handler
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "*")
        response.headers.add('Access-Control-Allow-Methods', "*")
        return response

# student registration endpoint
@app.post("/student/register")
def register_student():
    """
    [POST] register a new student account
    accepts: full_name, email, password, major, grad_year, grad_quarter (optional), bio (optional), pronouns (optional)
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
    grad_quarter = data.get("grad_quarter", "Spring")
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
        grad_quarter=grad_quarter,
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
    accepts: email, password, rememberMe
    """
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    remember_me = data.get("rememberMe", False)
    
    if not email or not password:
        return {"status": "ERROR", "message": "Email and password are required."}, 400
    
    user = auth_manager.login(email, password)
    if not user:
        return {"status": "ERROR", "message": "Invalid email or password."}, 401
    
    # Clear any existing session first
    session.clear()
    
    session["user_id"] = user.id
    session["user_type"] = user.__class__.__name__
    session["remember_me"] = remember_me
    
    # Set session permanence based on remember me
    if remember_me:
        session.permanent = True
        # Set a longer expiration (30 days) for remember me
        app.permanent_session_lifetime = timedelta(days=30)
    else:
        session.permanent = False
        # Set a very short session timeout (30 minutes) when not remembering
        app.permanent_session_lifetime = timedelta(minutes=30)
        
    return {"status": "SUCCESS", "message": "Login successful.", "user": user.to_safe_dict()}, 200

@app.get("/session")
def check_session():
    """
    [GET] Check if a user session is still active.
    Returns basic user info if logged in.
    """
    user_id = session.get("user_id")
    user_type = session.get("user_type")
    remember_me = session.get("remember_me", False)

    if not user_id or not user_type:
        return {"status": "UNAUTHORIZED", "message": "No active session"}, 401

    # If remember_me was False, clear the session
    if not remember_me:
        session.clear()
        return {"status": "UNAUTHORIZED", "message": "Session expired"}, 401

    try:
        if user_type == "Student":
            user = Student.query.get(user_id)
        else:
            user = None  # Extend later if you have AdminUser, etc.

        if not user:
            session.clear()
            return {"status": "UNAUTHORIZED", "message": "User not found"}, 401

        return {
            "status": "SUCCESS",
            "message": "Session active",
            "user": user.to_safe_dict()
        }, 200

    except Exception as e:
        print(f"[ERROR] session check failed: {e}")
        session.clear()
        return {"status": "ERROR", "message": "Internal server error"}, 500

@app.post("/logout")
def logout():
    """
    [POST] user logout
    """
    session.clear()
    return {"status": "SUCCESS", "message": "Logout successful."}, 200

# @app.route("/test_email")
# def test_email():
#     msg = Message("sdiybt <3", recipients=["ddpatel@scu.edu"])
#     msg.body = "if you see this message, it means two things:\n\n1. the test worked\n2. start diggin' in yo butt twin <3"
#     mail.send(msg)
#     return {"status": "[INFO]", "message": "test email sent successfully"}

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

@app.post("/user/password/reset")
def recover_password():
    """
    [POST] request password reset link
    body: { "email": "user@example.com" }
    """
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    if not email:
        return {"status": "ERROR", "message": "Email is required."}, 400

    user = Student.query.filter_by(email=email).first()
    if user:
        token = generate_reset_token(email)
        reset_link = url_for("user_password_reset_landing", token=token, _external=True)
        
        subject = "[SchedulAI] Password Reset Request"
        body = (
            "Hello,\n\nA password reset has been initiated for your SchedulAI account.\n\n"
            "Please follow the instructions at the link below.\nThis link will expire in 10 minutes.\n\n"
            f"{reset_link}\n\n"
            "If you didn't request a password reset, you can safely ignore this email.\n\n"
            "Best,\nThe SchedulAI Team"
        )
        
        try:
            msg = Message(subject=subject, recipients=[email], body=body)
            mail.send(msg)
        except Exception as e:
            print(f"[ERROR] mail sending failure: {e}")
            
    return {
        "status": "SUCCESS",
        "message": "[INFO] if the email is registered, a password reset link has been sent"
    }, 200
    
@app.get("/user/password/reset/<token>")
def user_password_reset_landing(token):
    """
    [GET] validate password reset token from email and redirect to frontend
    """
    email = verify_reset_token(token, max_age_seconds=600)
    if not email:
        # Redirect to login with error parameter or show error page
        return redirect(f"http://localhost:3000/login?error=invalid_reset_link")
    
    # Redirect to frontend password reset page with token
    return redirect(f"http://localhost:3000/password-reset/{token}")
    
PASSWORD_REGEX = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"

@app.post("/user/password/reset/confirm")
def user_password_reset_confirm():
    """
    [POST] finalize password reset
    body: { "token": "<token>", "new_password": "ExamplePassword1!"}
    """
    data = request.get_json(silent=True) or {}
    token = data.get("token", "")
    new_password = data.get("new_password", "")
    
    if not token or not new_password:
        return {"status": "ERROR", "message": "token and new password are required"}, 400
    
    # verify token
    email = verify_reset_token(token, max_age_seconds=600)
    if not email:
        return {"status": "ERROR", "message": "invalid or expired link"}, 400
    
    # validate new password
    if not re.match(PASSWORD_REGEX, new_password):
        return {
            "status": "ERROR",
            "message": ("password must be at least 8 characters long and include "
                        "one uppercase, one lowercase, one number, and one special character")
        }, 400

    # find user (both student and admin)
    user = Student.query.filter_by(email=email).first()
    if not user:
        return {"status": "ERROR", "message": "user not found"}, 404
    
    # hash and update password
    user.password_hash = generate_password_hash(new_password)
    db.session.commit()
    
    return {"status": "SUCCESS", "message": "[INFO] password successfully reset"}, 200

@app.post("/user/password/change")
def change_password():
    """
    [POST] change password for logged-in user
    body: { "current_password": "current", "new_password": "new" }
    """
    if "user_id" not in session:
        return {"status": "ERROR", "message": "unauthorized access. please log in."}, 401
    
    data = request.get_json(silent=True) or {}
    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")
    
    if not current_password or not new_password:
        return {"status": "ERROR", "message": "current password and new password are required"}, 400
    
    # validate new password
    if not re.match(PASSWORD_REGEX, new_password):
        return {
            "status": "ERROR",
            "message": ("password must be at least 8 characters long and include "
                        "one uppercase, one lowercase, one number, and one special character")
        }, 400
    
    # find user
    user_id = session["user_id"]
    user = Student.query.get(user_id)
    if not user:
        return {"status": "ERROR", "message": "user not found"}, 404
    
    # verify current password
    if not check_password_hash(user.password_hash, current_password):
        return {"status": "ERROR", "message": "current password is incorrect"}, 400
    
    # hash and update password
    user.password_hash = generate_password_hash(new_password)
    db.session.commit()
    
    return {"status": "SUCCESS", "message": "password successfully changed"}, 200

@app.route("/user/password/change", methods=["PUT"])
def change_password_put():
    """
    [PUT] change password for logged-in user (alternative endpoint)
    body: { "newPassword": "new" }
    """
    if "user_id" not in session:
        return {"status": "ERROR", "message": "unauthorized access. please log in."}, 401
    
    data = request.get_json(silent=True) or {}
    new_password = data.get("newPassword", "")
    
    if not new_password:
        return {"status": "ERROR", "message": "new password is required"}, 400
    
    # validate new password
    if not re.match(PASSWORD_REGEX, new_password):
        return {
            "status": "ERROR",
            "message": ("password must be at least 8 characters long and include "
                        "one uppercase, one lowercase, one number, and one special character")
        }, 400
    
    # find user
    user_id = session["user_id"]
    user = Student.query.get(user_id)
    if not user:
        return {"status": "ERROR", "message": "user not found"}, 404
    
    # hash and update password
    user.password_hash = generate_password_hash(new_password)
    db.session.commit()
    
    return {"status": "SUCCESS", "message": "password successfully changed"}, 200

@app.post("/student/transcript/upload")
def upload_transcript():
    """
    [POST] upload and parse transcript PDF
    body: multipart/form-data
    accepts: file (.pdf)
    returns: json data extracted from transcript
    """
    if "file" not in request.files:
        return {"status": "ERROR", "message": "no file part in request"}, 400
    
    file = request.files["file"]
    if file.filename == "":
        return {"status": "ERROR", "message": "no file selected"}, 400
    
    if not file.filename.lower().endswith(".pdf"):
        return {"status": "ERROR", "message": "invalid file type. please upload a PDF file"}, 400
    
    student_id = session.get("user_id")
    if not student_id:
        return {"status": "ERROR", "message": "unauthorized access. please log in."}, 401
    
    try:
        # Read PDF content into memory
        pdf_content = file.read()
        original_filename = secure_filename(file.filename)
        
        print(f"[DEBUG] Received PDF file: {original_filename}, Size: {len(pdf_content)} bytes")
        
        # Save to temporary file for parsing
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
            temp_file.write(pdf_content)
            temp_file_path = temp_file.name
        
        print(f"[DEBUG] Created temporary file: {temp_file_path}")
        
        # Parse the PDF from temporary file
        parser = TranscriptParser(temp_file_path)
        transcript_data = parser.to_json()
        
        # Clean up temporary file
        import os
        os.unlink(temp_file_path)
        print(f"[DEBUG] Cleaned up temporary file")
        
        if not transcript_data:
            return {"status": "ERROR", "message": "no valid course data extracted from transcript"}, 400

        # Clear previous transcript data if reuploaded
        TranscriptCourse.query.filter_by(student_id=student_id).delete()
        
        # Store PDF content directly in database
        student = Student.query.get(student_id)
        if student:
            student.transcript_pdf_content = pdf_content
            student.transcript_pdf_filename = original_filename
            print(f"[DEBUG] Stored PDF content in database for student {student_id}")
        
        # Store parsed courses in database
        for course in transcript_data:
            new_entry = TranscriptCourse(
                student_id=student_id,
                course_code=course.get("Course Code"),
                course_name=course.get("Course Name"),
                grade=course.get("Grade"),
                grade_points=course.get("Grade Points"),
                units=course.get("Units"),
                total_points=course.get("Total Points"),
            )
            db.session.add(new_entry)
        db.session.commit()
        
        print(f"[DEBUG] Successfully processed transcript for student {student_id}")
        
        return {
            "status": "SUCCESS",
            "message": "transcript parsed successfully",
            "courses": transcript_data
        }, 200
        
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] transcript parsing failed: {e}")
        return {"status": "ERROR", "message": f"failed to parse transcript: {str(e)}"}, 500

@app.get("/student/transcript")
def get_transcript():
    """
    [GET] fetch parsed transcript data for the logged-in student
    """
    student_id = session.get("user_id")
    if not student_id:
        return {"status": "ERROR", "message": "unauthorized access. please log in."}, 401
    
    try:
        records = TranscriptCourse.query.filter_by(student_id=student_id).all()
        if not records:
            return {
                "status": "SUCCESS",
                "message": "[INFO] no transcript data found for this student",
                "courses": []
            }, 200
            
        return {
            "status": "SUCCESS",
            "message": "[INFO] transcript data retrieved successfully",
            "courses": [record.to_dict() for record in records]
        }, 200

    except Exception as e:
        print(f"[ERROR] fetching transcript data failed: {e}")
        return {"status": "ERROR", "message": f"failed to fetch transcript data: {e}"}, 500

@app.get("/student/transcript/pdf")
def get_transcript_pdf():
    """
    [GET] serve the uploaded transcript PDF content from database for the logged-in student
    """
    student_id = session.get("user_id")
    if not student_id:
        return {"status": "ERROR", "message": "unauthorized access. please log in."}, 401
    
    try:
        student = Student.query.get(student_id)
        if not student or not student.transcript_pdf_content:
            return {"status": "ERROR", "message": "no transcript PDF found for this student"}, 404
        
        # Create response with PDF content from database
        from flask import Response
        
        filename = student.transcript_pdf_filename or "transcript.pdf"
        
        response = Response(
            student.transcript_pdf_content,
            mimetype="application/pdf",
            headers={
                "Content-Disposition": f"inline; filename={filename}",
                "Content-Type": "application/pdf"
            }
        )
        
        print(f"[DEBUG] Serving PDF from database for student {student_id}, filename: {filename}")
        return response
        
    except Exception as e:
        print(f"[ERROR] serving transcript PDF failed: {e}")
        return {"status": "ERROR", "message": f"failed to serve transcript PDF: {e}"}, 500

@app.delete("/student/transcript/clear")
def clear_transcript():
    """
    [DELETE] clear all transcript data for the logged-in student
    """
    student_id = session.get("user_id")
    if not student_id:
        return {"status": "ERROR", "message": "unauthorized access. please log in."}, 401
    
    try:
        # Clear transcript courses
        TranscriptCourse.query.filter_by(student_id=student_id).delete()
        
        # Clear PDF content from student record
        student = Student.query.get(student_id)
        if student:
            student.transcript_pdf_content = None
            student.transcript_pdf_filename = None
        
        db.session.commit()
        
        print(f"[DEBUG] Cleared transcript data for student {student_id}")
        return {"status": "SUCCESS", "message": "transcript data cleared successfully"}, 200
        
    except Exception as e:
        db.session.rollback()
        print(f"[DEBUG] Error clearing transcript: {e}")
        return {"status": "ERROR", "message": f"failed to clear transcript: {e}"}, 500

@app.delete("/student/delete")
def delete_student_account():
    """
    [DELETE] delete the entire student account and all associated data
    """
    student_id = session.get("user_id")
    if not student_id:
        return {"status": "ERROR", "message": "unauthorized access. please log in."}, 401
    
    try:
        # Get the student to delete
        student = Student.query.get(student_id)
        if not student:
            return {"status": "ERROR", "message": "student not found"}, 404
        
        # Delete all associated transcript courses first
        TranscriptCourse.query.filter_by(student_id=student_id).delete()
        
        # Delete the student record
        db.session.delete(student)
        
        # Clear the session
        session.clear()
        
        db.session.commit()
        
        print(f"[DEBUG] Deleted student account {student_id}")
        return {"status": "SUCCESS", "message": "account deleted successfully"}, 200
        
    except Exception as e:
        db.session.rollback()
        print(f"[DEBUG] Error deleting student account: {e}")
        return {"status": "ERROR", "message": f"failed to delete account: {e}"}, 500

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

@app.get("/student/progress")
def get_student_progress():
    """
    [GET] Return student's degree progress (completed, missing, ratio)
    """
    student_id = session.get("user_id")
    if not student_id:
        return {"status": "ERROR", "message": "unauthorized access"}, 401

    tracker = StudentProgressTracker()
    try:
        summary = tracker.load_student_progress(student_id)
        return {"status": "SUCCESS", "progress": summary}, 200
    except Exception as e:
        print(f"[ERROR] student progress failed: {e}")
        return {"status": "ERROR", "message": str(e)}, 500
    
chatbot = ChatbotInterface()

@app.post("/chat")
def chat_with_bot():
    """
    [POST] Send a message to the chatbot.
    Request body: {"message": "find course data mining"}
    """
    data = request.get_json(silent=True) or {}
    user_input = data.get("message", "").strip()
    if not user_input:
        return {"status": "ERROR", "message": "Message is required."}, 400

    student_id = session.get("user_id")
    result = chatbot.handle_query(user_input, student_id)
    return {"status": "SUCCESS", "response": result}, 200
# ============================================
#   SCHEDULE PLANNER — CSV LOADING + ENDPOINTS
# ============================================

import re
import pandas as pd

CSV_PATH = "major_csvs/Computer Science and Engineering.csv"

def load_and_transform_sections(csv_path):
    df = pd.read_csv(csv_path)

    # Clean duplicated header lines (your CSV includes header twice)
    df = df[df["Course Section"] != "Course Section"]

    # Extract "Course" short code
    # Example: "CSEN 10-1 - Introduction to Programming" → "CSEN 10-1"
    df["Course"] = df["Course Section"].apply(
        lambda x: re.split(r"\s+-\s+", str(x))[0]
    )

    # Instructor column cleanup
    df["Instructor"] = df["All Instructors"].fillna("TBA")

    # Parse meeting patterns such as:
    #   "M W F | 11:45 AM - 12:50 PM"
    def parse_meeting(m):
        if pd.isna(m):
            return ("", "", "")
        parts = m.split("|")
        if len(parts) != 2:
            return ("", "", "")

        # Convert "M W F" -> "MWF"
        days = parts[0].strip().replace(" ", "")

        times = parts[1].strip()
        if "-" not in times:
            return (days, "", "")
        start, end = times.split(" - ")
        return (days, start.strip(), end.strip())

    parsed = df["Meeting Patterns"].apply(parse_meeting)
    df["Day"] = parsed.apply(lambda x: x[0])
    df["Start Time"] = parsed.apply(lambda x: x[1])
    df["End Time"] = parsed.apply(lambda x: x[2])

    # Select only the columns required by SchedulePlanner
    df_clean = df[["Course", "Day", "Start Time", "End Time", "Instructor"]]

    return df_clean

# Load transformed CSV into SchedulePlanner
try:
    transformed_df = load_and_transform_sections(CSV_PATH)
    planner = SchedulePlanner(transformed_df)
    print(f"[INFO] Loaded {len(transformed_df)} section rows for SchedulePlanner.")
except Exception as e:
    print(f"[ERROR] Failed loading schedule planner CSV: {e}")
    planner = SchedulePlanner(pd.DataFrame())



# ============================================
#       /planner/schedules  (POST)
# ============================================

@app.post("/planner/schedules")
def planner_generate_schedules():
    """
    Generate valid schedules from remaining major requirements + preferences.
    Core requirements removed.
    """
    if "user_id" not in session:
        return {"status": "ERROR", "message": "Unauthorized access."}, 401

    data = request.get_json(silent=True) or {}

    remaining = data.get("remaining_requirements", [])  # now just course codes
    preferred_professor = data.get("preferred_professor", "")
    earliest = data.get("earliest", "")
    latest = data.get("latest", "")

    if not remaining:
        return {"status": "ERROR", "message": "No remaining requirements provided."}, 400

    # Step 1 — generate non-conflicting schedules
    raw_schedules = planner.generate_schedules(
        course_codes=remaining,
        max_results=10
    )

    final_schedules = []

    for schedule_df in raw_schedules:
        df = schedule_df.copy()

        if preferred_professor:
            df = planner.filter_preferred_professor(df, preferred_professor)

        if earliest or latest:
            df = planner.filter_preferred_time(df, earliest, latest)

        # Must still include all requested courses
        if df["Course"].nunique() == len(remaining):
            final_schedules.append(df.to_dict(orient="records"))

    if not final_schedules:
        return {"status": "ERROR", "message": "No schedules matched your filters."}, 200

    return {"status": "SUCCESS", "schedules": final_schedules}, 200

@app.get("/student/progress/detailed")
def get_detailed_progress():
    if "user_id" not in session:
        return {"status": "ERROR", "message": "Unauthorized."}, 401

    student_id = session["user_id"]
    result = evaluate_student_progress(student_id)
    return result, 200



def evaluate_student_progress(student_id: int):
    """
    Compare a student's transcript against ONLY:
      - CSEN major requirements (course-based)

    Core requirements removed from system.
    """

    # ------------------------------------------------------------
    # 1. Load student transcript
    # ------------------------------------------------------------
    student = Student.query.get(student_id)
    if not student:
        return {"status": "ERROR", "message": "Student not found."}

    parser = TranscriptParser(pdf_path=None)
    transcript_df = parser.load_transcript_for_student(student.email)

    if transcript_df.empty:
        return {
            "status": "SUCCESS",
            "major_completed": [],
            "major_missing": []
        }

    # Normalize
    transcript_df["Course Code"] = transcript_df["Course Code"].str.strip()
    transcript_df["DEPT"] = transcript_df["Course Code"].str.extract(r"^([A-Z]+)")
    transcript_df["NUM"] = transcript_df["Course Code"].str.extract(r"(\d+)")
    transcript_df["NUM"] = transcript_df["NUM"].astype(str)

    completed_course_codes = set(transcript_df["Course Code"].tolist())
    completed_numbers = set(transcript_df["NUM"].tolist())

    # ------------------------------------------------------------
    # 2. Load CSEN major requirements
    # ------------------------------------------------------------
    req_df = pd.read_csv("major_csvs/csen_requirements.csv")

    # Only major requirements remain — no CORE department anymore
    major_reqs = req_df.copy()
    major_reqs["COURSE_NUMBER"] = major_reqs["COURSE_NUMBER"].astype(str)

    # ------------------------------------------------------------
    # 3. Determine completed vs missing major requirements
    # ------------------------------------------------------------
    major_completed = []
    major_missing = []

    for _, row in major_reqs.iterrows():
        dept = str(row["DEPARTMENT"])
        num = str(row["COURSE_NUMBER"])
        code_full = f"{dept} {num}"

        if code_full in completed_course_codes or num in completed_numbers:
            major_completed.append({
                "requirement": code_full,
                "category": row.get("CATEGORY", ""),
                "name": row["REQUIREMENT_NAME"]
            })
        else:
            major_missing.append({
                "requirement": code_full,
                "category": row.get("CATEGORY", ""),
                "name": row["REQUIREMENT_NAME"]
            })

    # ------------------------------------------------------------
    # 4. Return ONLY major progress
    # ------------------------------------------------------------
    return {
        "status": "SUCCESS",
        "major_completed": major_completed,
        "major_missing": major_missing
    }

if __name__ == "__main__":
    # create tables inside app context
    with app.app_context():
        db.create_all()
        print("[INFO] database connection successful. if model exists, tables created")

    app.run(debug=True)
