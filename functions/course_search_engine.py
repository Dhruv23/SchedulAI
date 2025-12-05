import pandas as pd
from rapidfuzz import fuzz, process

class CourseSearchEngine:
    """
    A search engine for course data extracted from SCU's bulletin or Excel.
    Supports keyword and fuzzy search, subject filtering, and ranking.
    """

    def __init__(self, course_df=None):
        """
        Initialize CourseSearchEngine.
        course_df: optional DataFrame of available courses.
        """
        import pandas as pd
        self.df = course_df if course_df is not None else pd.DataFrame()

    # SEARCH METHODS
    def search_keyword(self, query: str) -> pd.DataFrame:
        """
        Returns all courses where the query appears in either
        the name or description.
        """
        mask = self.df.apply(
            lambda col: col.astype(str).str.contains(query, case=False, na=False)
        ).any(axis=1)
        results = self.df[mask]
        return results.reset_index(drop=True)

    def search_fuzzy(self, query: str, limit: int = 10) -> pd.DataFrame:
        """
        Performs fuzzy string matching using rapidfuzz.
        Returns the top N closest matches by similarity score.
        """
        courses = self.df["Course Name"].fillna("").tolist()
        matches = process.extract(query, courses, scorer=fuzz.token_sort_ratio, limit=limit)
        matched_names = [m[0] for m in matches]
        results = self.df[self.df["Course Name"].isin(matched_names)].copy()
        results["Match Score"] = [m[1] for m in matches if m[0] in results["Course Name"].values]
        return results.sort_values("Match Score", ascending=False).reset_index(drop=True)

    # FILTERING METHODS
    def filter_by_subject(self, subject: str) -> pd.DataFrame:
        """Filter by course subject prefix (e.g., 'CSEN', 'MATH')."""
        subject = subject.upper().strip()
        mask = self.df["Course Name"].str.startswith(subject, na=False)
        return self.df[mask].reset_index(drop=True)

    def filter_by_units(self, min_units: int = None, max_units: int = None) -> pd.DataFrame:
        """Filter by number of course units."""
        if "Units" not in self.df.columns:
            raise ValueError("[ERROR] DataFrame must include a 'Units' column.")
        df = self.df.copy()
        if min_units is not None:
            df = df[df["Units"] >= min_units]
        if max_units is not None:
            df = df[df["Units"] <= max_units]
        return df.reset_index(drop=True)

    def filter_by_level(self, level: str) -> pd.DataFrame:
        """
        Filter by course level:
        'lower' → 1-99
        'upper' → 100-199
        'graduate' → 200+
        """
        if "Course Number" not in self.df.columns:
            raise ValueError("[ERROR] Missing 'Course Number' column.")

        def level_of(num):
            try:
                num = int(num)
                if 1 <= num < 100:
                    return "lower"
                elif 100 <= num < 200:
                    return "upper"
                else:
                    return "graduate"
            except:
                return None

        self.df["Level"] = self.df["Course Number"].apply(level_of)
        return self.df[self.df["Level"] == level.lower()].reset_index(drop=True)

    # UTILITY
    def export_results(self, df: pd.DataFrame, filename: str):
        """Save a filtered or search result DataFrame to CSV."""
        df.to_csv(filename, index=False)
        print(f"[SAVE] Saved results to {filename}")

    # ADMIN-LEVEL CRUD METHODS
    def add_course(self, course_data: dict):
        """Add a new course to the DataFrame."""
        new_row = pd.DataFrame([course_data])
        self.df = pd.concat([self.df, new_row], ignore_index=True)
        print(f"[ADD] Course '{course_data.get('Course Name', 'Unknown')}' added.")

    def update_course(self, course_name: str, updates: dict):
        """Update existing course(s) matching course_name with provided updates."""
        mask = self.df["Course Name"] == course_name
        if not mask.any():
            print(f"[UPDATE] No course found with name '{course_name}'.")
            return
        for col, val in updates.items():
            if col in self.df.columns:
                self.df.loc[mask, col] = val
            else:
                print(f"[UPDATE] Warning: Column '{col}' does not exist.")
        print(f"[UPDATE] Course(s) named '{course_name}' updated.")

    def delete_course(self, course_name: str):
        """Delete course(s) matching the course_name."""
        initial_count = len(self.df)
        self.df = self.df[self.df["Course Name"] != course_name].reset_index(drop=True)
        final_count = len(self.df)
        deleted = initial_count - final_count
        if deleted > 0:
            print(f"[DELETE] Deleted {deleted} course(s) named '{course_name}'.")
        else:
            print(f"[DELETE] No course found with name '{course_name}'.")

    def refresh_dataframe(self, new_df: pd.DataFrame):
        """Replace the current DataFrame with a new one."""
        self.df = new_df.copy()
        self.df.columns = [c.strip() for c in self.df.columns]
        print("[REFRESH] DataFrame refreshed with new data.")

    def __repr__(self):
        return f"<CourseSearchEngine: {len(self.df)} courses loaded>"
