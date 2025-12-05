import requests
from bs4 import BeautifulSoup
import pandas as pd

class MajorCourseScraper:
    """
    A class for scraping major course listings and descriptions
    from Santa Clara University's online bulletin.
    """

    def __init__(self, url: str):
        """
        Initialize the scraper with a target SCU major URL.

        Args:
            url (str): URL of the major's bulletin page.
        """
        self.url = url
        self.html = None
        self.soup = None
        self.df = None

    def fetch_html(self) -> str:
        """
        Fetch the HTML page for the provided major URL.
        Returns the HTML text.
        """
        print(f"[FETCH] Fetching: {self.url}")
        response = requests.get(self.url)
        response.raise_for_status()
        self.html = response.text
        print("[INFO] HTML fetched successfully.")
        return self.html

    def parse_html(self) -> pd.DataFrame:
        """
        Parse the HTML and extract course numbers, names, and descriptions.
        Returns a pandas DataFrame.
        """
        if self.html is None:
            self.fetch_html()

        self.soup = BeautifulSoup(self.html, "html.parser")
        courses = []

        # Each course is usually listed in an <h3> with a bolded <span>
        for header in self.soup.find_all("h3"):
            title_tag = header.find("span", class_="gdbold")
            if not title_tag:
                continue

            title_text = title_tag.get_text(strip=True)
            if not title_text:
                continue

            # Extract course number and name
            parts = title_text.split('.', 1)
            if len(parts) == 2 and parts[0].strip().isdigit():
                course_number = parts[0].strip()
                course_name = parts[1].strip()
            else:
                course_number = None
                course_name = title_text.strip()

            # Get the next <p> (description)
            desc_tag = header.find_next_sibling("p")
            description = desc_tag.get_text(" ", strip=True) if desc_tag else ""

            courses.append({
                "Course Number": course_number,
                "Course Name": course_name,
                "Description": description
            })

        self.df = pd.DataFrame(courses)
        print(f"[INFO] Extracted {len(self.df)} courses.")
        return self.df

    def save_to_csv(self, filename: str = "major_courses.csv") -> None:
        """
        Save the parsed course DataFrame to a CSV file.

        Args:
            filename (str): The CSV file path to save the data.
        """
        if self.df is None:
            raise ValueError("[ERROR] No data to save. Run parse_html() first.")
        self.df.to_csv(filename, index=False)
        print(f"[SAVE] Saved courses to {filename}")

    def run_full_pipeline(self, output_csv: str = "major_courses.csv") -> pd.DataFrame:
        """
        Runs the full pipeline:
          1. Fetch the HTML
          2. Parse the courses
          3. Save to CSV

        Returns:
            pd.DataFrame: Parsed course DataFrame.
        """
        self.fetch_html()
        df = self.parse_html()
        self.save_to_csv(output_csv)
        return df


# Example usage
if __name__ == "__main__":
    url = "https://www.scu.edu/bulletin//undergraduate/chapter-5-school-of-engineering/computer-science-and-engineering.html#59ffa8ec905c"
    scraper = MajorCourseScraper(url)
    df = scraper.run_full_pipeline("CSEN_courses.csv")
    print(df.head())
