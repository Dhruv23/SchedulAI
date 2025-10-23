import pandas as pd
import os

def parse_courses_from_excel(excel_path: str, csv_path: str = "courses_output.csv") -> pd.DataFrame:
    """
    Reads an Excel file containing course and section data,
    saves it as a CSV, and returns a combined DataFrame.
    """
    # Read all sheets
    excel_data = pd.read_excel(excel_path, sheet_name=None)
    
    # Combine all sheets
    combined_df = pd.concat(excel_data.values(), ignore_index=True)
    
    # Save to a single master CSV
    combined_df.to_csv(csv_path, index=False)
    print(f"✅ Saved combined CSV: {csv_path}")
    
    return combined_df


def split_by_course_subject(df: pd.DataFrame, output_dir: str = "majors_csvs") -> None:
    """
    Splits the DataFrame by the 'Course Subject' column and
    saves each subset to its own CSV file in the specified directory.
    """
    os.makedirs(output_dir, exist_ok=True)
    
    if "Course Subject" not in df.columns:
        raise ValueError("❌ The DataFrame does not contain a 'Course Subject' column.")
    
    # Group by the Course Subject column
    for subject, group_df in df.groupby("Course Subject"):
        # Clean up file name
        safe_subject = "".join(c for c in str(subject) if c.isalnum() or c in (' ', '_')).rstrip()
        output_path = os.path.join(output_dir, f"{safe_subject}.csv")
        group_df.to_csv(output_path, index=False)
        print(f"📁 Saved: {output_path} ({len(group_df)} rows)")


# Example usage
if __name__ == "__main__":
    excel_file = "SCU_Find_Course_Sections.xlsx"  # <-- or full path if needed
    df = parse_courses_from_excel(excel_file)
    split_by_course_subject(df)
