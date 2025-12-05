import pandas as pd
import os

class CourseExcelParser:
    """
    A utility class for parsing, combining, and splitting
    course/section data from Excel files into structured CSVs.
    """

    def __init__(self, excel_path: str, output_dir: str = "data"):
        self.excel_path = excel_path
        self.output_dir = output_dir
        self.df = None

    def parse_courses(self, csv_path: str = "data/courses_output.csv") -> pd.DataFrame:
        """
        Reads an Excel file containing course and section data,
        combines all sheets into a single DataFrame, and optionally saves as CSV.

        Args:
            csv_path (str): File path to save the combined CSV.
        
        Returns:
            pd.DataFrame: The combined DataFrame.
        """
        # Read all sheets
        excel_data = pd.read_excel(self.excel_path, sheet_name=None)

        # Combine all sheets
        combined_df = pd.concat(excel_data.values(), ignore_index=True)

        # Save to master CSV
        combined_df.to_csv(csv_path, index=False)
        print(f"[INFO] Saved combined CSV: {csv_path}")

        # Store internally for later splitting
        self.df = combined_df
        return combined_df

    def split_by_course_subject(self) -> None:
        """
        Splits the combined DataFrame by the 'Course Subject' column
        and saves each subset as a CSV file inside the output directory.
        """
        if self.df is None:
            raise ValueError("[ERROR] No DataFrame loaded. Run parse_courses() first.")

        if "Course Subject" not in self.df.columns:
            raise ValueError("[ERROR] The DataFrame does not contain a 'Course Subject' column.")

        os.makedirs(self.output_dir, exist_ok=True)

        # Group by the Course Subject column
        for subject, group_df in self.df.groupby("Course Subject"):
            # Clean up filename (safe for saving)
            safe_subject = "".join(c for c in str(subject) if c.isalnum() or c in (' ', '_')).rstrip()
            output_path = os.path.join(self.output_dir, f"{safe_subject}.csv")

            group_df.to_csv(output_path, index=False)
            print(f"[SAVE] Saved: {output_path} ({len(group_df)} rows)")

    def run_full_pipeline(self) -> pd.DataFrame:
        """
        Executes the full pipeline:
        1. Parse Excel → Combined DataFrame
        2. Split by Course Subject → Individual CSVs
        
        Returns:
            pd.DataFrame: The combined DataFrame of all courses.
        """
        df = self.parse_courses()
        self.split_by_course_subject()
        return df


# Example usage (test entry point)
if __name__ == "__main__":
    excel_file = "SCU_Find_Course_Sections.xlsx"
    parser = CourseExcelParser(excel_file)
    df = parser.run_full_pipeline()
    print(df.head())
