import itertools
import pandas as pd
from datetime import datetime

class SchedulePlanner:
    """
    Builds valid course schedules from section data,
    detecting time conflicts and optimizing for user preferences.
    """

    def __init__(self, sections_df=None):
        """
        Initialize SchedulePlanner.
        sections_df: optional DataFrame of course sections.
        """
        import pandas as pd
        self.sections_df = sections_df if sections_df is not None else pd.DataFrame()

    # TIME HANDLING
    @staticmethod
    def _parse_time(t: str):
        """Convert 'HH:MM AM/PM' → datetime.time"""
        try:
            return datetime.strptime(t.strip(), "%I:%M %p").time()
        except Exception:
            return None

    def _times_overlap(self, row1, row2) -> bool:
        """Check if two courses overlap in day and time."""
        if row1["Day"] != row2["Day"]:
            return False

        start1, end1 = self._parse_time(row1["Start Time"]), self._parse_time(row1["End Time"])
        start2, end2 = self._parse_time(row2["Start Time"]), self._parse_time(row2["End Time"])

        if not all([start1, end1, start2, end2]):
            return False

        return not (end1 <= start2 or end2 <= start1)

    # CONFLICT DETECTION
    def detect_conflicts(self, schedule_df: pd.DataFrame) -> bool:
        """Return True if any two sections overlap."""
        for (_, a), (_, b) in itertools.combinations(schedule_df.iterrows(), 2):
            if self._times_overlap(a, b):
                return True
        return False

    # SCHEDULE GENERATION
    def generate_schedules(self, course_codes: list[str], max_results: int = 10):
        """
        Generate all valid schedules (no time conflicts) given a list of course codes.
        Each code is matched against section data; valid combinations are concatenated.
        """
        grouped = []
        for code in course_codes:
            # Use exact match instead of contains to avoid CSEN 10 matching CSEN 10L
            matches = self.sections_df[self.sections_df["Course"] == code]
            if not matches.empty:
                # wrap in list so itertools.product sees a list, not a DataFrame
                grouped.append([matches])
            else:
                print(f"[WARN] No matches found for course code: {code}")

        if not grouped:
            print("[ERROR] No valid course combinations found.")
            return []

        schedules = []
        for combo in itertools.product(*grouped):
            # combo is a tuple of DataFrames
            schedule = pd.concat(combo, ignore_index=True)
            if not self.detect_conflicts(schedule):
                schedules.append(schedule)
            if len(schedules) >= max_results:
                break

        print(f"[INFO] Generated {len(schedules)} valid schedules.")
        return schedules

    # PREFERENCES
    def filter_preferred_professor(self, df: pd.DataFrame, professor_name: str):
        """Filter sections taught by a preferred professor."""
        return df[df["Instructor"].str.contains(professor_name, case=False, na=False)]
    
    def filter_preferred_time(self, df: pd.DataFrame, earliest: str = None, latest: str = None):
        """Filter sections within a preferred time window."""
        if earliest:
            earliest_time = self._parse_time(earliest)
            df = df[df["Start Time"].apply(lambda t: (self._parse_time(t) or earliest_time) >= earliest_time)]
        if latest:
            latest_time = self._parse_time(latest)
            df = df[df["End Time"].apply(lambda t: (self._parse_time(t) or latest_time) <= latest_time)]
        return df

    # EXPORT
    def export_schedule(self, schedule_df: pd.DataFrame, filename: str):
        """Export a chosen schedule to CSV."""
        schedule_df.to_csv(filename, index=False)
        print(f"[SAVE] Saved schedule to {filename}")

    # ADMIN-RELATED AND AI SUGGESTION HELPERS
    def add_advisor_comment(self, student_id: int, comment: str):
        """Stub: Add an advisor comment for a student."""
        print(f"[ADMIN] Added advisor comment for student {student_id}: {comment}")

    def get_advisor_comments(self, student_id: int):
        """Stub: Retrieve advisor comments for a student."""
        print(f"[ADMIN] Retrieved advisor comments for student {student_id}")
        return []

    def suggest_plan(self, student_id: int = None):
        """Stub: Suggest a plan based on student ID or general preferences."""
        suggestion = "Suggest balanced course load with morning classes preferred."
        print(f"[AI] Suggestion for student {student_id if student_id else 'N/A'}: {suggestion}")
        return suggestion

    def analyze_schedule(self, schedule_df: pd.DataFrame):
        """Analyze a schedule and return summary analytics."""
        num_courses = schedule_df["Course"].nunique()
        total_hours = 0
        earliest_start = None
        latest_end = None

        for _, row in schedule_df.iterrows():
            start = self._parse_time(row["Start Time"])
            end = self._parse_time(row["End Time"])
            if start and end:
                duration = (datetime.combine(datetime.min, end) - datetime.combine(datetime.min, start)).seconds / 3600
                total_hours += duration
                if earliest_start is None or start < earliest_start:
                    earliest_start = start
                if latest_end is None or end > latest_end:
                    latest_end = end

        analysis = {
            "num_courses": num_courses,
            "total_hours": total_hours,
            "earliest_start": earliest_start.strftime("%I:%M %p") if earliest_start else None,
            "latest_end": latest_end.strftime("%I:%M %p") if latest_end else None,
        }
        print(f"[ANALYSIS] {analysis}")
        return analysis

    def __repr__(self):
        return f"<SchedulePlanner with {len(self.sections_df)} sections>"
