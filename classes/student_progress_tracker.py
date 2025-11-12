# classes/student_progress_tracker.py

import os
import pandas as pd
from typing import Dict, Any
from db import db
from classes.student_model import Student
from classes.transcript_to_df import TranscriptParser
from classes.transcript_course_model import TranscriptCourse


class StudentProgressTracker:
    """
    Simplified tracker: computes progress by comparing total completed units
    vs. total required units for the student's major.
    """

    def __init__(self):
        self.requirements_path = os.path.join(os.getcwd(), "majors_csvs", "degree_requirements.csv")

    # -----------------------------------------------------------
    # 🔍 LOAD STUDENT PROGRESS
    # -----------------------------------------------------------
    def load_student_progress(self, student_id: int) -> Dict[str, Any]:
        """
        Retrieve a student and analyze their progress.
        Returns a dict with summary info and missing requirements.
        """
        student = Student.query.get(student_id)
        if not student:
            raise ValueError(f"No student found with id {student_id}.")

        major = student.major.strip()
        total_required = self._get_total_units_for_major(major)

        # Load transcript from DB instead of PDF
        from classes.transcript_course_model import TranscriptCourse
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
                },
            }

        import pandas as pd
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

        completed_units = transcript_df["Units"].sum()
        remaining_units = max(total_required - completed_units, 0)
        completion_ratio = round(completed_units / total_required, 2) if total_required else 0

        summary = {
            "student": student.to_safe_dict(),
            "major": major,
            "completed_units": completed_units,
            "total_units": total_required,
            "remaining_units": remaining_units,
            "completion_ratio": completion_ratio,
        }

        print(f"[PROGRESS] {student.full_name}: {completed_units}/{total_required} units complete ({completion_ratio*100:.1f}%)")
        return {"status": "SUCCESS", "progress": summary}

    # -----------------------------------------------------------
    # 🎓 GET REQUIRED UNITS FOR MAJOR
    # -----------------------------------------------------------
    def _get_total_units_for_major(self, major: str) -> int:
        """Load total required units for a given major from degree_requirements.csv"""
        print(f"[DEBUG] Reading degree requirements for major: '{major}'")

        if not os.path.exists(self.requirements_path):
            print("[WARN] degree_requirements.csv not found")
            return 175  # fallback default

        df = pd.read_csv(self.requirements_path, quotechar='"', skipinitialspace=True)
        print(f"[DEBUG] Loaded {len(df)} majors from CSV")
        print("[DEBUG] CSV majors:", list(df["Major"][:5]))  # show first few

        row = df[df["Major"].str.lower() == major.lower()]
        if row.empty:
            print(f"[WARN] Major '{major}' not found in CSV, falling back to 180")
            return 175

        total_units = int(row["Total Units Required"].values[0])
        print(f"[DEBUG] Found major '{major}' → {total_units} units required")
        return total_units


    def __repr__(self):
        return "<StudentProgressTracker>"