# db.py
from flask_sqlalchemy import SQLAlchemy

# single instance of SQLAlchemy for the entire app
db = SQLAlchemy()

from classes.student_model import Student
from classes.course_model import Course
# from classes.advisor_comment_model import AdvisorComment
# from classes.analytics_model import AnalyticsRecord

def init_db(app):
    """Initialize the database with the Flask app."""
    db.init_app(app)
    with app.app_context():
        db.create_all()