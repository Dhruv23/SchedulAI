# classes/course_model.py

from sqlalchemy import func
from db import db

# create course table for db
class Course(db.Model):
    __tablename__ = "courses"
    
    id = db.Column(db.Integer, primary_key=True)
    department = db.Column(db.String(10), nullable=False)  
    course_number = db.Column(db.String(10), nullable=False) 
    category = db.Column(db.String(100), nullable=False)  
    requirement_name = db.Column(db.String(255), nullable=False)   
        
    def to_dict(self):
        """Convert course to dictionary for API responses."""
        return {
            "id": self.id,
            "department": self.department,
            "course_number": self.course_number,
            "category": self.category,
            "requirement_name": self.requirement_name,
            "full_code": f"{self.department} {self.course_number}"
        }
    
    def __repr__(self):
        return f"<Course {self.department} {self.course_number}: {self.requirement_name}>"