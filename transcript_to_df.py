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
        course_pattern = re.compile(r"([A-Z]{2,4}\s\d{1,3}[A-Z]?)\s*-\s*(.+)")
        grade_pattern = re.compile(r"([A-F][+-]?)\s+([\d.]+)\s+(\d+)\s+([\d.]+)")

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
        """Convert parsed courses to a Pandas DataFrame."""
        courses = self._extract_courses()
        df = pd.DataFrame(courses)
        return df

    def save_to_csv(self, output_path="transcript_courses.csv"):
        """Save the extracted courses to a CSV file."""
        df = self.to_dataframe()
        df.to_csv(output_path, index=False)
        print(f"✅ Saved to {output_path}")

# --- Example usage ---
if __name__ == "__main__":
    parser = TranscriptParser("Transcript - Dhruv Patel - 2025.pdf")
    df = parser.to_dataframe()
    print(df.head())  # Preview the first few rows
    parser.save_to_csv()
