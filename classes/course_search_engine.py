import pandas as pd
from rapidfuzz import fuzz, process

class CourseSearchEngine:
    """
    A search engine for course data extracted from SCU's bulletin or Excel.
    Supports keyword and fuzzy search, subject filtering, and ranking.
    """

    def __init__(self, course_df: pd.DataFrame):
        self.df = course_df.copy()
        self.df.columns = [c.strip() for c in self.df.columns]

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
