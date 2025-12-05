# classes/chatbot_interface.py

from typing import Dict, Any
from classes.course_search_engine import CourseSearchEngine
from classes.schedule_planner import SchedulePlanner
from classes.student_model import Student
from db import db

class ChatbotInterface:
    """
    Provides an AI-assisted conversational layer for students and admins.
    Can answer questions about schedules, courses, or student progress.
    """

    def __init__(self):
        self.course_engine = CourseSearchEngine()
        self.planner = SchedulePlanner()

    # -----------------------------------------------------------
    # 🧠 MAIN CHAT ENTRY POINT
    # -----------------------------------------------------------
    def handle_query(self, user_input: str, student_id: int = None) -> Dict[str, Any]:
        """
        Respond to a user's question using internal logic.
        This is a rule-based placeholder you can later connect to an LLM.
        """
        user_input_lower = user_input.lower()

        if "course" in user_input_lower and "find" in user_input_lower:
            return self._handle_course_search(user_input_lower)

        elif "schedule" in user_input_lower:
            return self._handle_schedule_request(student_id)

        elif "advisor" in user_input_lower or "comment" in user_input_lower:
            return {"response": "You can view advisor comments under your profile tab."}

        elif "help" in user_input_lower:
            return {"response": "You can ask about available courses, schedules, or progress."}

        else:
            return {"response": "I'm still learning! Try asking about your schedule or a course."}

    # -----------------------------------------------------------
    # 🔍 COURSE SEARCH
    # -----------------------------------------------------------
    def _handle_course_search(self, query: str) -> Dict[str, Any]:
        """
        Parse a basic text query to find courses that match.
        """
        keywords = query.replace("find", "").replace("course", "").strip().split()
        if not keywords:
            return {"response": "Please provide a keyword to search for courses."}

        df = self.course_engine.df
        matches = df[df["Course Name"].str.contains("|".join(keywords), case=False, na=False)]

        if matches.empty:
            return {"response": "No matching courses found."}

        top_matches = matches.head(5)[["Course ID", "Course Name", "Instructor", "Days", "Time"]]
        results = top_matches.to_dict(orient="records")

        return {
            "response": f"Here are {len(results)} course(s) matching your search:",
            "results": results,
        }

    # -----------------------------------------------------------
    # 📅 SCHEDULE RETRIEVAL
    # -----------------------------------------------------------
    def _handle_schedule_request(self, student_id: int) -> Dict[str, Any]:
        """
        Return a student's schedule summary.
        """
        if not student_id:
            return {"response": "Please log in so I can access your schedule."}

        student = Student.query.get(student_id)
        if not student:
            return {"response": "Student not found."}

        # Placeholder — in the future you could query a schedule table
        return {
            "response": f"Hello {student.full_name}, I don’t have your full schedule yet, "
                        f"but I can help you plan one!",
        }

    # -----------------------------------------------------------
    # 🗣️ CHATBOT SUMMARY
    # -----------------------------------------------------------
    def get_help_menu(self) -> Dict[str, Any]:
        """
        Returns a menu of sample chatbot commands.
        """
        return {
            "available_commands": [
                "Find course <keyword>",
                "Show my schedule",
                "Show advisor comments",
                "Help",
            ],
            "description": "SchedulAI Chatbot can help you search courses, view schedules, and track progress.",
        }

    def __repr__(self):
        return "<ChatbotInterface>"