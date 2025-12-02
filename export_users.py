import sqlite3
import csv

def export_users_to_csv():
    try:
        conn = sqlite3.connect('schedulai.db')
        cursor = conn.cursor()
        
        # Get all users from the database
        cursor.execute("SELECT id, email, full_name, role, major, grad_quarter FROM students ORDER BY role, id")
        users = cursor.fetchall()
        
        # Write to CSV
        with open('users_export.csv', 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(['id', 'email', 'full_name', 'role', 'major', 'grad_quarter'])  # Header
            writer.writerows(users)
        
        conn.close()
        print(f"Exported {len(users)} users to users_export.csv")
        
        # Also create a text file for easy viewing
        with open('users_export.txt', 'w', encoding='utf-8') as txtfile:
            txtfile.write("User Data Export\n")
            txtfile.write("=" * 50 + "\n\n")
            for user in users:
                txtfile.write(f"ID: {user[0]}\n")
                txtfile.write(f"Email: {user[1]}\n")
                txtfile.write(f"Full Name: {user[2]}\n")
                txtfile.write(f"Role: {user[3]}\n")
                txtfile.write(f"Major: {user[4]}\n")
                txtfile.write(f"Grad Quarter: {user[5]}\n")
                txtfile.write("-" * 30 + "\n")
        
        print(f"Also exported to users_export.txt for easy viewing")
        
        return users
        
    except Exception as e:
        print(f"Export failed: {e}")
        return []

if __name__ == "__main__":
    export_users_to_csv()