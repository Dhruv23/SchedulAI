from pydoc import text
import re
import pandas as pd
import pdfplumber

class TranscriptParser:
    def __init__(self, pdf_path: str):
        """Initialize the parser with a transcript PDF file."""
        self.pdf_path = pdf_path
        self.text = self._extract_text()

    def _extract_text(self) -> str:
        """Extract raw text from the PDF."""
        text = ""
        with pdfplumber.open(self.pdf_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() + "\n"
        return text

    def _extract_courses(self) -> list:
        """
        Extract course information (course code, name, grade, units, grade points)
        using regex patterns that match transcript formatting.
        """
        # Pattern for lines like: "CSEN 140 - Machine Learning and Data Mining"
        # course_pattern = re.compile(r"([A-Z]{2,4}\s\d{1,3}[A-Z]?)\s*-\s*(.+)")
        # grade_pattern = re.compile(r"([A-F][+-]?)\s+([\d.]+)\s+(\d+)\s+([\d.]+)")
        
        course_pattern = re.compile(r"([A-Z]{2,4}\s\d{1,3}[A-Z]?)\s*-\s*([A-Za-z0-9 &,:'-]+)")
        grade_pattern = re.compile(r"([A-FP][+-]?)\s+([\d.]+)\s+(\d+)\s+([\d.]+)")

        courses = []
        lines = self.text.splitlines()
        
        for i, line in enumerate(lines):
            match_course = course_pattern.search(line)
            if match_course:
                course_code, course_name = match_course.groups()
                # Look ahead in following lines for grade info
                for j in range(i + 1, min(i + 4, len(lines))):
                    match_grade = grade_pattern.search(lines[j])
                    if match_grade:
                        grade, grade_points, units, total_points = match_grade.groups()
                        courses.append({
                            "Course Code": course_code.strip(),
                            "Course Name": course_name.strip(),
                            "Grade": grade.strip(),
                            "Grade Points": float(grade_points),
                            "Units": int(units),
                            "Total Points": float(total_points)
                        })
                        break
        return courses

    def to_dataframe(self) -> pd.DataFrame:
        """convert extracted course data to dataframe"""
        courses = self._extract_courses()
        if not courses:
            print("[WARN] no valid courses extracted")
            return pd.DataFrame(columns=["Course Code", "Course Name", "Grade", "Grade Points", "Units", "Total Points"])
        
        df = pd.DataFrame(courses)
        if "Course Name" in df.columns:
            df = df[df["Course Name"].str.len() > 3]
        return df
    
    def save_to_csv(self, output_path="transcript_courses.csv"):
        """Save extracted courses to a CSV file (legacy)."""
        df = self.to_dataframe()
        if df.empty:
            print("[WARN] no valid courses extracted; CSV not saved")
            return None
        df.to_csv(output_path, index=False)
        print(f"[SAVE] Saved to {output_path}")
        return output_path

    def to_json(self) -> list:
        """convert extracted courses to json list of dicts"""
        df = self.to_dataframe()
        if df.empty:
            print("[WARN] no valid courses extracted -> return empty json")
            return []
        return df.to_dict(orient="records")