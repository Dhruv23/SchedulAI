# classes/auth_manager.py

from typing import Tuple, Optional
from db import db
from classes.student_model import Student

class AuthManager:
    """
    Handles authentication-related logic:
    - login (email + password check)
    - password recovery flow (stubbed)
    """

    def login(self, email: str, password: str) -> Optional[Student]:
        """
        Attempt to authenticate a user.
        Returns the Student object on success, or None on failure.
        """
        # normalize email
        normalized_email = email.strip().lower()

        # look up user
        user = Student.query.filter_by(email=normalized_email).first()
        if not user:
            print(f"[AUTH] login failed: no user with {normalized_email}")
            return None

        # verify password
        if not user.check_password(password):
            print(f"[AUTH] login failed: bad password for {normalized_email}")
            return None

        print(f"[AUTH] login success for {normalized_email} (id={user.id})")
        return user

    def create_student_account(
        self,
        full_name: str,
        email: str,
        password: str,
        major: str,
        grad_year: int,
        role: str = "student",
        bio: str = None,
        pronouns: str = None,
    ) -> Tuple[bool, Optional[Student], str]:
        """
        Admin / registration helper.
        Creates a new student row, hashes password, commits to DB.
        Returns (success, student_obj_or_None, message).
        """
        normalized_email = email.strip().lower()

        # check if email already exists
        existing = Student.query.filter_by(email=normalized_email).first()
        if existing:
            return (
                False,
                None,
                f"Account with email {normalized_email} already exists.",
            )

        # create new student
        student = Student(
            full_name=full_name,
            email=normalized_email,
            major=major,
            grad_year=grad_year,
            role=role if role else "student",
            bio=bio,
            pronouns=pronouns,
        )
        student.set_password(password)

        try:
            db.session.add(student)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return (False, None, f"DB error creating student: {str(e)}")

        print(f"[AUTH] created new student id={student.id}, email={student.email}")
        return (True, student, "Account successfully created.")

    def recover_password(self, email: str) -> Tuple[bool, str]:
        """
        Begin password recovery for a given email.
        Right now this is a stub that:
        - checks if the email exists
        - returns a message you can show to the frontend

        You can later:
        - generate a secure token
        - email a reset link
        - or issue a temporary password
        """
        normalized_email = email.strip().lower()
        user = Student.query.filter_by(email=normalized_email).first()

        if not user:
            print(f"[AUTH] recover_password: no account for {normalized_email}")
            # Security best practice: don't reveal whether account exists.
            # But for internal/debug you *are* returning False.
            return (False, "If this email exists, a reset link will be sent.")

        # TODO: generate token + email it
        print(f"[AUTH] recover_password requested for {normalized_email} (id={user.id})")

        # For now we just say "ok"
        return (
            True,
            "Password recovery initiated. Check your email for reset instructions.",
        )