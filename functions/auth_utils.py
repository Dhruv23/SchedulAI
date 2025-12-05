# auth_utils.py - Authentication utility functions
import os
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

# Password reset helper functions
RESET_SALT = "schedulai-password-reset"  # extra security exclusive to password reset tokens

def generate_reset_token(email: str, secret_key: str) -> str:
    """
    create a signed, url-safe token (encodes user email)
    stateless token, and no db rows are written
    """
    serializer = URLSafeTimedSerializer(secret_key)
    return serializer.dumps(email, salt=RESET_SALT)

def verify_reset_token(token: str, secret_key: str, max_age_seconds: int = 600) -> str | None:
    """
    verify token signature and age
    return embedded email if valid, else return none
    """
    try:
        serializer = URLSafeTimedSerializer(secret_key)
        email = serializer.loads(token, salt=RESET_SALT, max_age=max_age_seconds)
        return email
    except (BadSignature, SignatureExpired):
        return None