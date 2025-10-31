# main.py
from flask import Flask, jsonify
from flask_cors import CORS
# from flask_sqlalchemy import SQLAlchemy
from db import db # because we only have one instance of SQLAlchemy
import os

# initialize flask
app = Flask(__name__)
CORS(app) # to enable communication with frontend

# configure database
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(BASE_DIR, "schedulai.db")

app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# # initialize SQLAlchemy
# db = SQLAlchemy(app)

# attach db to app
db.init_app(app)

# import health check route (to confirm server is running)
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "message": "[INFO] flask backend is running"}), 200

from classes.student_model import Student # ensure student model is imported
if __name__ == "__main__":
    # create tables inside app context
    with app.app_context():
        db.create_all()
        print("[INFO] database connection successful. if model exists, tables created")
    app.run(debug=True)