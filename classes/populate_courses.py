# populate_courses.py
# script to populate the courses table (CSEN specific)

import pandas as pd
from main import app
from db import db
from classes.course_model import Course

def populate_courses():
    """loaded major requirements from CSV and populated the courses table"""
    
    # read csv
    try:
        df = pd.read_csv('csen_requirements.csv')
        print(f"loaded {len(df)} course requirements from CSV")
    except Exception as e:
        print(f"error reading CSV: {e}")
        return
    
    # create app context
    with app.app_context():
        # if tables don't exist, create them
        db.create_all()

        # clear existing data
        Course.query.delete()
        db.session.commit()
        
        # add each course from csv
        courses_added = 0
        for _, row in df.iterrows():
            course = Course(
                department=row['DEPARTMENT'],
                course_number=row['COURSE_NUMBER'],
                category=row['CATEGORY'],
                requirement_name=row['REQUIREMENT_NAME']
            )
            
            db.session.add(course)
            courses_added += 1
            
            # print progress (debug)
            # if courses_added % 10 == 0:
            #     print(f"added {courses_added} courses")
        
        # commit all changes to db
        try:
            db.session.commit()
            print(f"[INFO] successfully added {courses_added} courses to the database")
        except Exception as e:
            db.session.rollback()
            print(f"[ERROR] cannot commit to database: {e}")
            return
        
        # verify data was added
        total_courses = Course.query.count()
        print(f"total courses in database: {total_courses}")
        
        # show examples (debug)
        # print("\nsample courses added:")
        # sample_courses = Course.query.limit(5).all()
        # for course in sample_courses:
        #     print(f"  - {course.department} {course.course_number}: {course.requirement_name}")

if __name__ == "__main__":
    populate_courses()