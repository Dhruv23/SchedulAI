# data_utils.py - Data loading and processing utility functions
import pandas as pd
import os

def load_course_sections():
    """
    Load course section data for schedule planning
    """
    data_path = os.path.join("data", "courses_output.csv")
    if os.path.exists(data_path):
        try:
            sections_df = pd.read_csv(data_path)
            return sections_df
        except Exception as e:
            print(f"Error loading course sections: {e}")
            return pd.DataFrame()
    else:
        print(f"Course sections file not found at {data_path}")
        return pd.DataFrame()

def load_and_transform_sections(csv_path):
    """Transform course sections data for schedule generation"""
    try:
        sections_df = pd.read_csv(csv_path)
        
        if sections_df.empty:
            return {}
        
        # Group by course code and aggregate section data
        course_dict = {}
        
        for _, row in sections_df.iterrows():
            course_code = f"{row['Subject']} {row['Course Number']}"
            
            if course_code not in course_dict:
                course_dict[course_code] = {
                    'title': row.get('Course Title', 'Unknown'),
                    'units': row.get('Units', 4),
                    'sections': []
                }
            
            # Add section information
            section_info = {
                'section': row.get('Section', 'Unknown'),
                'instructor': row.get('Instructor', 'Staff'),
                'days': row.get('Days', 'TBA'),
                'time': f"{row.get('Begin Time', 'TBA')} - {row.get('End Time', 'TBA')}",
                'location': row.get('Location', 'TBA'),
                'available_seats': row.get('Available', 0),
                'total_seats': row.get('Capacity', 0)
            }
            
            course_dict[course_code]['sections'].append(section_info)
        
        return course_dict
        
    except Exception as e:
        print(f"Error loading course sections: {e}")
        return {}