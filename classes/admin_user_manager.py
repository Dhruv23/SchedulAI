# classes/admin_user_manager.py

from typing import Dict, Any, Tuple
from db import db
from classes.student_model import Student
from classes.auth_manager import AuthManager

class AdminUserManager:
    """
    Handles admin-level user management:
    - create / update / delete students
    - assign roles (student, admin, advisor, etc.)
    """

    def __init__(self):
        self.auth = AuthManager()

    def manage_user(self, action: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main entry point used by /admin/user/manage in main.py.
        Supported actions: create, update, delete
        """
        action = action.lower().strip()
        if action == "create":
            return self._create_user(data)
        elif action == "update":
            return self._update_user(data)
        elif action == "delete":
            return self._delete_user(data)
        else:
            raise ValueError(f"Unsupported admin action: {action}")

    # -----------------------------------------------------------
    # 🟢 CREATE USER
    # -----------------------------------------------------------
    def _create_user(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new user account (admin or student).
        """
        required_fields = ["full_name", "email", "password", "major", "grad_year"]
        missing = [f for f in required_fields if f not in data]
        if missing:
            raise ValueError(f"Missing required fields: {', '.join(missing)}")

        success, student, msg = self.auth.create_student_account(
            full_name=data["full_name"],
            email=data["email"],
            password=data["password"],
            major=data["major"],
            grad_year=data["grad_year"],
            role=data.get("role", "student"),
            bio=data.get("bio"),
            pronouns=data.get("pronouns"),
        )

        if not success:
            raise ValueError(msg)
        return {"status": "SUCCESS", "user": student.to_safe_dict()}

    # -----------------------------------------------------------
    # 🟡 UPDATE USER
    # -----------------------------------------------------------
    def _update_user(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update an existing user's profile or role.
        """
        user_id = data.get("user_id") or data.get("id")  # Support both formats
        if not user_id:
            raise ValueError("Missing user id for update.")

        student = Student.query.get(user_id)
        if not student:
            raise ValueError(f"No student found with id {user_id}.")

        # Update role separately
        if "role" in data:
            student.assign_role(data["role"])

        # Update profile fields
        student.update_profile(**data)

        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise ValueError(f"Failed to update student: {str(e)}")

        print(f"[ADMIN] Updated student id={student.id}")
        return {"status": "SUCCESS", "user": student.to_safe_dict()}

    # -----------------------------------------------------------
    # 🔴 DELETE USER
    # -----------------------------------------------------------
    def _delete_user(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Delete a user from the system.
        """
        user_id = data.get("user_id") or data.get("id")  # Support both formats
        if not user_id:
            raise ValueError("Missing user id for deletion.")

        student = Student.query.get(user_id)
        if not student:
            raise ValueError(f"No student found with id {user_id}.")

        try:
            db.session.delete(student)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise ValueError(f"Failed to delete user: {str(e)}")

        print(f"[ADMIN] Deleted student id={student.id}, email={student.email}")
        return {"status": "SUCCESS", "message": f"Deleted user id={student.id}."}