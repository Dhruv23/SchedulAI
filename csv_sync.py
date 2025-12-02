import sqlite3
import csv
import os
from datetime import datetime

def sync_users_to_csv():
    """Sync users data from database to CSV file"""
    try:
        conn = sqlite3.connect('schedulai.db')
        cursor = conn.cursor()
        
        # Get all users from the database
        cursor.execute("SELECT id, email, full_name, role, major, grad_quarter FROM students ORDER BY role, id")
        users = cursor.fetchall()
        
        # Write to CSV in both backend and frontend public folder
        csv_paths = [
            'users_data.csv',  # Backend copy
            'frontend/public/users_data.csv'  # Frontend copy
        ]
        
        for csv_path in csv_paths:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(csv_path) if os.path.dirname(csv_path) else '.', exist_ok=True)
            
            with open(csv_path, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow(['id', 'email', 'full_name', 'role', 'major', 'grad_quarter'])  # Header
                writer.writerows(users)
        
        # Also create a timestamp file to track last update
        with open('users_data_last_updated.txt', 'w') as f:
            f.write(datetime.now().isoformat())
        
        conn.close()
        print(f"[INFO] Synced {len(users)} users to CSV files")
        return True
        
    except Exception as e:
        print(f"[ERROR] Failed to sync users to CSV: {e}")
        return False

def get_users_from_csv():
    """Get users data from CSV file"""
    try:
        users = []
        with open('users_data.csv', 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                users.append({
                    'id': int(row['id']),
                    'email': row['email'],
                    'full_name': row['full_name'],
                    'role': row['role'],
                    'major': row['major'],
                    'grad_quarter': row['grad_quarter']
                })
        return users
    except Exception as e:
        print(f"[ERROR] Failed to read users from CSV: {e}")
        return []

if __name__ == "__main__":
    sync_users_to_csv()