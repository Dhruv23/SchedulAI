# db.py
from flask_sqlalchemy import SQLAlchemy

# single instance of SQLAlchemy for the entire app
db = SQLAlchemy()