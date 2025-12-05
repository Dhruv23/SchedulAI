# classes/transcript_course_model.py
from db import db

class TranscriptCourse(db.Model):
    __tablename__ = "transcript_courses"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)
    course_code = db.Column(db.String(20), nullable=False)
    course_name = db.Column(db.String(255), nullable=False)
    grade = db.Column(db.String(5))
    grade_points = db.Column(db.Float)
    units = db.Column(db.Float)
    total_points = db.Column(db.Float)

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "course_code": self.course_code,
            "course_name": self.course_name,
            "grade": self.grade,
            "grade_points": self.grade_points,
            "units": self.units,
            "total_points": self.total_points,
        }