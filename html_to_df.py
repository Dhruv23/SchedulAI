import requests
from bs4 import BeautifulSoup
import pandas as pd

def extract_courses_from_major(url: str):
    # Fetch the HTML (acts like curl)
    response = requests.get(url)
    response.raise_for_status()
    html = response.text

    # Parse the HTML
    soup = BeautifulSoup(html, "html.parser")

    # Find all course blocks — they are marked by <h3> tags with <span class="gdbold"> inside
    courses = []
    for header in soup.find_all("h3"):
        title_tag = header.find("span", class_="gdbold")
        if not title_tag:
            continue

        title_text = title_tag.get_text(strip=True)
        if not title_text:
            continue

        # Extract course number and name
        # e.g., "166. Artificial Intelligence" → ("166", "Artificial Intelligence")
        parts = title_text.split('.', 1)
        if len(parts) == 2 and parts[0].strip().isdigit():
            course_number = parts[0].strip()
            course_name = parts[1].strip()
        else:
            course_number = None
            course_name = title_text.strip()

        # The next <p> (paragraph) usually contains the description
        desc_tag = header.find_next_sibling("p")
        description = desc_tag.get_text(" ", strip=True) if desc_tag else ""

        courses.append({
            "Course Number": course_number,
            "Course Name": course_name,
            "Description": description
        })

    # Convert to DataFrame
    df = pd.DataFrame(courses)
    return df

if __name__ == "__main__":
    url = "https://www.scu.edu/bulletin//undergraduate/chapter-5-school-of-engineering/computer-science-and-engineering.html#59ffa8ec905c"
    df = extract_courses_from_major(url)

    # Display a sample of the result
    print(df.head())

    # Save to CSV (optional)
    df.to_csv("CSEN_courses.csv", index=False)
