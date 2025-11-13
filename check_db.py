# check_db.py
# ulimately an extension can be used to see what tables/info populates the db
# but this can also be used in case data cannot be displayed properly

import sqlite3

# connect to database
conn = sqlite3.connect('schedulai.db')
cursor = conn.cursor()

# get table names
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print("existing tables:")
for table in tables:
    print(f"- {table[0]}")

# get schema for each table
for table in tables:
    table_name = table[0]
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = cursor.fetchall()
    print(f"\ntable: {table_name}")
    print("columns:")
    for col in columns:
        print(f"  - {col[1]} ({col[2]})")
    
    # show row count
    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    count = cursor.fetchone()[0]
    print(f"rows: {count}")

# show some sample data from courses table if it exists
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='courses'")
if cursor.fetchone():
    print("\n[INFO] sample courses data:")
    cursor.execute("SELECT department, course_number, category, requirement_name FROM courses LIMIT 5")
    sample_courses = cursor.fetchall()
    for course in sample_courses:
        print(f"  - {course[0]} {course[1]}: {course[3]} ({course[2]})")

conn.close()