from pydoc import text
import re
import pandas as pd
import pdfplumber
from classes.transcript_course_model import TranscriptCourse
from classes.student_model import Student
from db import db

class TranscriptParser:
    def __init__(self, pdf_path: str):
        """Initialize the parser with a transcript PDF file."""
        self.pdf_path = pdf_path
        self.text = self._extract_text()

    def _extract_text(self) -> str:
        """Extract raw text from the PDF."""
        text = ""
        with pdfplumber.open(self.pdf_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() + "\n"
        return text

    def _extract_courses(self) -> list:
        """
        Extract course information for SCU-style transcripts.
        Matches lines like:
        'COEN 10 Introduction to Programming 4.000 4.000 B+ 0.000'
        """
        # Pattern: CourseCode (e.g., COEN 10), CourseName (text), 4 numbers/grades at end
        course_pattern = re.compile(
            r"^([A-Z]{2,4}\s\d{1,3}[A-Z]?)\s+(.+?)\s+([\d.]+)\s+([\d.]+)\s+([A-FP][+-]?)\s+([\d.]+)$"
        )

        courses = []
        lines = self.text.splitlines()

        for line in lines:
            match = course_pattern.search(line.strip())
            if match:
                course_code, course_name, attempted, earned, grade, points = match.groups()
                try:
                    courses.append({
                        "Course Code": course_code,
                        "Course Name": course_name.strip(),
                        "Grade": grade.strip(),
                        "Grade Points": 0.0 if grade in ["P", "CR", "In Progress", "W"] else float(points),
                        "Units": float(earned),
                        "Total Points": float(points)
                    })
                except Exception:
                    continue

        return courses


    def to_dataframe(self) -> pd.DataFrame:
        """convert extracted course data to dataframe"""
        courses = self._extract_courses()
        if not courses:
            print("[WARN] no valid courses extracted")
            return pd.DataFrame(columns=["Course Code", "Course Name", "Grade", "Grade Points", "Units", "Total Points"])
        
        df = pd.DataFrame(courses)
        if "Course Name" in df.columns:
            df = df[df["Course Name"].str.len() > 3]
        return df
    
    def save_to_csv(self, output_path="transcript_courses.csv"):
        """Save extracted courses to a CSV file (legacy)."""
        df = self.to_dataframe()
        if df.empty:
            print("[WARN] no valid courses extracted; CSV not saved")
            return None
        df.to_csv(output_path, index=False)
        print(f"[SAVE] Saved to {output_path}")
        return output_path

    def to_json(self) -> list:
        """convert extracted courses to json list of dicts"""
        df = self.to_dataframe()
        if df.empty:
            print("[WARN] no valid courses extracted -> return empty json")
            return []
        return df.to_dict(orient="records")
    
    def load_transcript_for_student(self, email: str) -> pd.DataFrame:
        """
        Loads transcript data for a student by email.
        Pulls from the TranscriptCourse table (not from PDF).
        Returns a DataFrame with all course info.
        """
        # 1. Find the student by email
        student = Student.query.filter_by(email=email).first()
        if not student:
            print(f"[WARN] No student found with email {email}")
            return pd.DataFrame()

        # 2. Get all transcript records linked to that student
        records = TranscriptCourse.query.filter_by(student_id=student.id).all()
        if not records:
            print(f"[WARN] No transcript records found for {email}")
            return pd.DataFrame()

        # 3. Convert each record to a dict and build a DataFrame
        df = pd.DataFrame([r.to_dict() for r in records])
        return df