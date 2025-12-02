import sqlite3

try:
    conn = sqlite3.connect('schedulai.db')
    cursor = conn.cursor()
    
    # Check tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    print('Tables:', cursor.fetchall())
    
    # Check students table schema
    cursor.execute('PRAGMA table_info(students)')
    print('Students table schema:', cursor.fetchall())
    
    # Count students
    cursor.execute('SELECT COUNT(*) FROM students')
    print('Total students:', cursor.fetchone())
    
    # Sample data
    cursor.execute('SELECT id, email, role FROM students LIMIT 3')
    print('Sample data:', cursor.fetchall())
    
    conn.close()
    print("Database check completed successfully")
    
except Exception as e:
    print(f"Database error: {e}")