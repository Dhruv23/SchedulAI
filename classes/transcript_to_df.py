from pydoc import text
import re
import pandas as pd
import pdfplumber
import os
from classes.transcript_course_model import TranscriptCourse
from classes.student_model import Student
from db import db

class TranscriptParser:
    def __init__(self, pdf_path: str):
        """Initialize the parser with a transcript PDF file."""
        self.pdf_path = pdf_path
        self.text = self._extract_text()
        self.course_names_map = self._load_course_names()
        self.transcript_type = self._detect_transcript_type()

    def _load_course_names(self) -> dict:
        """load course names from course_names.txt file"""
        course_map = {}
        course_names_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'course_names.txt')
        
        try:
            with open(course_names_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and ' - ' in line:
                        parts = line.split(' - ', 1)
                        if len(parts) == 2:
                            course_code = parts[0].strip()
                            course_name = parts[1].strip()
                            course_map[course_code] = course_name
        except Exception as e:
            print(f"warning: could not load course names file: {e}")
        
        return course_map

    def _extract_text(self) -> str:
        """Extract raw text from the PDF."""
        text = ""
        with pdfplumber.open(self.pdf_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() + "\n"
        return text

    def _detect_transcript_type(self) -> str:
        """detect whether this is an 'unofficial' or 'official' transcript format."""
        if "Unofficial Transcript" in self.text or "unofficial transcript" in self.text.lower():
            return "unofficial"
        else:
            return "official"  # default to original format

    # holy shit someone just kill me already please this parser and i have become sworn enemies
    def _extract_courses(self) -> list:
        """
        extract course information from any SCU transcript, using course_names.txt for course code -> course name mapping
        """
        if self.transcript_type == "unofficial":
            return self._extract_courses_unofficial()
        else:
            return self._extract_courses_official()

    def _extract_courses_official(self) -> list:
        """extract courses from the original 'official' transcript format."""
        main_course_pattern = re.compile(
            r".+ - .+ and ([A-Z]{2,4}\s\d{1,3}[A-Z]?)\s*-\s*.+?\s+([A-FP][+-]?)\s+([\d.]+)\s+(\d+)\s+([\d.]+)$"
        )
        
        courses = []
        lines = self.text.splitlines()
        
        for line in lines:
            line = line.strip()
            
            # look for course lines
            match = main_course_pattern.match(line)
            if match:
                course_code, grade, grade_points, units, total_points = match.groups()
                
                # get course name from lookup table
                course_name = self.course_names_map.get(course_code, f"Unknown Course ({course_code})")
                
                try:
                    courses.append({
                        "Course Code": course_code,
                        "Course Name": course_name,
                        "Grade": grade.strip(),
                        "Grade Points": round(0.0 if grade in ["P", "CR", "In Progress", "W"] else float(grade_points), 1),
                        "Units": round(float(units), 1),
                        "Total Points": round(float(total_points), 1)
                    })
                except Exception as e:
                    print(f"error processing course {course_code}: {e}")
                    continue

        return courses

    def _extract_courses_unofficial(self) -> list:
        """extract courses from the 'unofficial' transcript format (cleaner format)."""
        courses = []
        lines = self.text.splitlines()
        
        # pattern for unofficial transcript course lines:
        course_pattern = re.compile(
            r"^([A-Z]{2,4}\s\d{1,3}[A-Z]?)\s+(.+?)\s+([\d.]+)\s+([\d.]+)\s+([A-FP][+-]?|W|CR|P|I)\s+([\d.]+)$"
        )
        
        # grade point mapping for SCU grading scale
        grade_scale = {
            'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'D-': 0.7,
            'F': 0.0, 'P': 0.0, 'CR': 0.0, 'W': 0.0, 'I': 0.0
        }
        
        for line in lines:
            line = line.strip()
            
            # skip header lines and other non-course lines
            skip_keywords = [
                "Course Transcript", "Term GPA", "Cum GPA", "Quarter", "Student Name", "Page",
                "Unofficial Transcript", "Santa Clara University", "Prepared On", "Date of Birth",
                "Academic Programs", "Total Transfer Credit", "External Test Credit", 
                "Attempted Earned Grade Units Points", "Term Totals", "Cumulated Totals"
            ]
            
            if any(keyword in line for keyword in skip_keywords):
                continue
            
            # skip lines that are too short or don't look like course lines
            if len(line) < 20:
                continue
            
            match = course_pattern.match(line)
            if match:
                course_code, course_title, attempted, earned, grade, points = match.groups()
                
                # clean up course title and validate
                course_title = course_title.strip()
                if len(course_title) < 3: 
                    continue
                
                try:
                    # get grade points from our scale
                    grade_points = grade_scale.get(grade, 0.0)
                    units = float(earned)
                    total_points = grade_points * units if grade not in ['P', 'CR', 'W', 'I'] else 0.0
                    
                    # validate that units make sense (between 0.5 and 10)
                    if units < 0.5 or units > 10:
                        print(f"[WARN] Unusual unit count for {course_code}: {units}")
                    
                    courses.append({
                        "Course Code": course_code,
                        "Course Name": course_title,
                        "Grade": grade.strip(),
                        "Grade Points": round(grade_points, 1),
                        "Units": round(units, 1),
                        "Total Points": round(total_points, 1)
                    })
                except Exception as e:
                    print(f"error processing unofficial course {course_code}: {e}")
                    continue

        return courses


    def to_dataframe(self) -> pd.DataFrame:
        """convert extracted course data to dataframe"""
        print(f"[INFO] detected transcript type: {self.transcript_type}")
        courses = self._extract_courses()
        if not courses:
            print(f"[WARN] no valid courses extracted from {self.transcript_type} transcript")
            return pd.DataFrame(columns=["Course Code", "Course Name", "Grade", "Grade Points", "Units", "Total Points"])
        
        print(f"[INFO] extracted {len(courses)} courses from {self.transcript_type} transcript")
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