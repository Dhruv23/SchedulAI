# classes/student_model.py

from sqlalchemy import func
from db import db

# model -> SQLite table named 'students'
class Student(db.Model):
    __tablename__ = "students"
    
    # student full name and id
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    
    # unique email for each student
    email = db.Column(db.String(255), unique=True, index=True, nullable=False)
    
    # store ONLY the password hash, NEVER THE PLAINTEXT DUMFUK
    password_hash = db.Column(db.String(255), nullable=False)
    
    # additional student info
    major = db.Column(db.String(100), nullable=False)
    grad_year = db.Column(db.Integer, nullable=False)
    
    # optional fields
    bio = db.Column(db.Text, nullable=True)
    pronouns = db.Column(db.String(64), nullable=True)
    
    # security: new users are always "student." New users cannot self-assign admin roles
    role = db.Column(db.String(32), default="student", nullable=False)
    
    # timestamps
    created_at = db.Column(db.DateTime, default=func.now())
    updated_at = db.Column(db.DateTime, server_default=func.now(), onupdate=func.now())
    
    def to_safe_dict(self):
        """ return user info for API responses, excluding password hash """
        return {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
            "major": self.major,
            "grad_year": self.grad_year,
            "bio": self.bio,
            "pronouns": self.pronouns,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }