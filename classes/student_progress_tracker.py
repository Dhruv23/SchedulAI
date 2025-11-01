# classes/student_progress_tracker.py

import pandas as pd
from typing import Dict, List, Any
from db import db
from classes.student_model import Student
from classes.transcript_to_df import TranscriptParser  # assumed existing
from classes.course_search_engine import CourseSearchEngine


class StudentProgressTracker:
    """
    Tracks student progress by comparing completed courses
    against program requirements.
    """

    def __init__(self):
        self.course_engine = CourseSearchEngine()

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

        # Load transcript into a DataFrame
        transcript_parser = TranscriptParser()
        transcript_df = transcript_parser.load_transcript_for_student(student.email)

        if transcript_df.empty:
            return {
                "status": "SUCCESS",
                "message": "No transcript data found.",
                "progress": None,
            }

        return self._analyze_progress(student, transcript_df)

    # -----------------------------------------------------------
    # 📊 ANALYZE PROGRESS
    # -----------------------------------------------------------
    def _analyze_progress(
        self, student: Student, transcript_df: pd.DataFrame
    ) -> Dict[str, Any]:
        """
        Compare transcript vs. degree requirements.
        """
        completed_courses = set(transcript_df["Course ID"].tolist())
        required_courses = self._get_required_courses(student.major)

        completed = completed_courses.intersection(required_courses)
        missing = required_courses.difference(completed)
        completion_ratio = round(len(completed) / len(required_courses), 2) if required_courses else 0

        summary = {
            "student": student.to_safe_dict(),
            "major": student.major,
            "completed_courses": list(completed),
            "missing_courses": list(missing),
            "completion_ratio": completion_ratio,
        }

        print(f"[PROGRESS] {student.full_name}: {len(completed)} / {len(required_courses)} complete")
        return summary

    # -----------------------------------------------------------
    # 🎓 GET REQUIRED COURSES
    # -----------------------------------------------------------
    def _get_required_courses(self, major: str) -> set:
        """
        Placeholder: get the list of required courses for a given major.
        This could come from a CSV or the course engine.
        """
        try:
            df = pd.read_csv(f"majors_csvs/{major.lower()}_requirements.csv")
            return set(df["Course ID"].tolist())
        except FileNotFoundError:
            print(f"[WARN] No requirement file for major '{major}'.")
            return set()

    # -----------------------------------------------------------
    # 🧮 SUMMARY REPORT
    # -----------------------------------------------------------
    def generate_summary_report(self, student_id: int) -> str:
        """
        Returns a formatted text summary of the student's progress.
        """
        progress = self.load_student_progress(student_id)
        if not progress.get("progress"):
            return "No transcript data available."

        return (
            f"Progress Report for {progress['student']['full_name']}:\n"
            f"Major: {progress['major']}\n"
            f"Completed: {len(progress['completed_courses'])} courses\n"
            f"Missing: {len(progress['missing_courses'])} courses\n"
            f"Completion Ratio: {progress['completion_ratio'] * 100:.0f}%\n"
        )

    def __repr__(self):
        return "<StudentProgressTracker>"