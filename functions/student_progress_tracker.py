# classes/student_progress_tracker.py

import os
import pandas as pd
from typing import Dict, Any, List
from db import db
from classes.student_model import Student
from classes.transcript_course_model import TranscriptCourse


class StudentProgressTracker:
    """
    Tracks student progress by analyzing units completed,
    evaluating which requirements are satisfied,
    and recommending next-quarter courses from multiple departments.
    """

    def __init__(self):
        self.requirements_path = os.path.join(os.getcwd(), "data", "csen_requirements.csv")

        # ALL departments that may offer required CSEN-major courses
        self.department_files = {
            "CSEN": "Computer Science and Engineering.csv",
            "MATH": "Mathematics.csv",
            "ECEN": "Electrical and Computer Engineering.csv",
            "PHYS": "Physics.csv"
        }

    # -----------------------------------------------------------
    # 🔍 LOAD STUDENT PROGRESS
    # -----------------------------------------------------------
    def load_student_progress(self, student_id: int) -> Dict[str, Any]:
        """Retrieve a student and analyze their academic progress."""
        
        student = Student.query.get(student_id)
        if not student:
            raise ValueError(f"No student found with id {student_id}.")

        major = student.major.strip()
        total_required = self._get_total_units_for_major(major)

        # Load transcript rows
        records = TranscriptCourse.query.filter_by(student_id=student_id).all()
        if not records:
            return {
                "status": "SUCCESS",
                "message": "No transcript data found.",
                "progress": {
                    "major": major,
                    "completed_units": 0,
                    "total_units": total_required,
                    "remaining_units": total_required,
                    "completion_ratio": 0.0,
                    "requirements": {},
                    "recommended_courses": []
                },
            }

        # Convert transcript to DataFrame
        transcript_df = pd.DataFrame([
            {
                "Course Code": r.course_code,
                "Course Name": r.course_name,
                "Units": r.units,
                "Grade": r.grade,
                "Total Points": r.total_points
            }
            for r in records
        ])

        # Compute units
        completed_units = transcript_df["Units"].sum()
        remaining_units = max(total_required - completed_units, 0)
        completion_ratio = round(completed_units / total_required, 2) if total_required else 0

        # Requirement evaluation
        requirements = self.evaluate_missing_requirements(transcript_df)

        # Next-quarter course recommendations
        next_quarter_recos = self.suggest_next_quarter_courses(requirements["missing_courses"])

        # Final summary
        summary = {
            "student": student.to_safe_dict(),
            "major": major,
            "completed_units": completed_units,
            "total_units": total_required,
            "remaining_units": remaining_units,
            "completion_ratio": completion_ratio,
            "requirements": requirements,
            "recommended_courses": next_quarter_recos
        }

        return {"status": "SUCCESS", "progress": summary}

    # -----------------------------------------------------------
    # 📘 REQUIREMENT EVALUATION
    # -----------------------------------------------------------
    def evaluate_missing_requirements(self, transcript_df: pd.DataFrame) -> Dict[str, Any]:
        """Find which CSEN requirements are completed or missing."""

        if not os.path.exists(self.requirements_path):
            print("[ERROR] CSEN Requirements CSV missing.")
            return {}

        df = pd.read_csv(self.requirements_path)

        # Normalize requirement course code (e.g., "CSEN 146")
        df["Course Code"] = df["DEPARTMENT"].astype(str) + " " + df["COURSE_NUMBER"].astype(str)

        # Normalize student courses
        student_courses = transcript_df["Course Code"].str.upper().str.strip().tolist()

        # Check completion
        df["Completed"] = df["Course Code"].apply(lambda code: code.upper().strip() in student_courses)

        completed = df[df["Completed"]]
        missing = df[~df["Completed"]]

        # Group summary by category
        category_summary = {}
        for category, group in df.groupby("CATEGORY"):
            category_summary[category] = {
                "completed": int(group["Completed"].sum()),
                "total": len(group),
                "remaining": len(group) - int(group["Completed"].sum()),
                "missing_courses": group[~group["Completed"]]["Course Code"].tolist()
            }

        return {
            "completed_courses": completed["Course Code"].tolist(),
            "missing_courses": missing["Course Code"].tolist(),
            "category_summary": category_summary,
        }

    # -----------------------------------------------------------
    # 📅 NEXT QUARTER COURSE RECOMMENDER
    # -----------------------------------------------------------
    def suggest_next_quarter_courses(self, missing_courses: List[str]) -> List[Dict[str, Any]]:
        """Search all department CSV files for next-quarter offerings that match missing requirements."""

        missing_norm = set([m.upper().strip() for m in missing_courses])

        all_suggestions = []

        for dept_prefix, filename in self.department_files.items():
            offerings_path = os.path.join(os.getcwd(), "data", filename)

            if not os.path.exists(offerings_path):
                print(f"[WARN] Offerings file missing: {filename}")
                continue

            df = pd.read_csv(offerings_path)

            # Normalize course code in offerings (e.g., "CSEN 10", "MATH 14")
            df["Course Code"] = df["Course Subject"].astype(str) + " " + df["Course Number"].astype(str)

            # Find intersection
            offered_matches = df[df["Course Code"].str.upper().isin(missing_norm)]

            for _, row in offered_matches.iterrows():
                all_suggestions.append({
                    "course_code": row["Course Code"],
                    "course_title": row["Course Section"].split(" - ")[1] if " - " in row["Course Section"] else row["Course Section"],
                    "units": row["Units"],
                    "instructor": row["All Instructors"],
                    "meeting": row["Meeting Patterns"],
                    "location": row["Locations"],
                    "delivery_mode": row["Delivery Mode"],
                    "section_status": row["Section Status"],
                    "department_file": filename
                })

        return all_suggestions

    # -----------------------------------------------------------
    # 🎓 GET TOTAL REQUIRED UNITS (Hardcoded fallback)
    # -----------------------------------------------------------
    def _get_total_units_for_major(self, major: str) -> int:
        """Your CSEN requirements CSV does not store total units → fallback to 175."""
        return 175

    def __repr__(self):
        return "<StudentProgressTracker>"
