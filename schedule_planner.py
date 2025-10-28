import itertools
import pandas as pd
from datetime import datetime

class SchedulePlanner:
    """
    Builds valid course schedules from section data,
    detecting time conflicts and optimizing for user preferences.
    """

    def __init__(self, sections_df: pd.DataFrame):
        self.sections_df = sections_df.copy()

    # ----------------------------------------------------------
    # ⏰ TIME HANDLING
    # ----------------------------------------------------------
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

    # ----------------------------------------------------------
    # ⚖️ CONFLICT DETECTION
    # ----------------------------------------------------------
    def detect_conflicts(self, schedule_df: pd.DataFrame) -> bool:
        """Return True if any two sections overlap."""
        for (_, a), (_, b) in itertools.combinations(schedule_df.iterrows(), 2):
            if self._times_overlap(a, b):
                return True
        return False

    # ----------------------------------------------------------
    # 🧩 SCHEDULE GENERATION
    # ----------------------------------------------------------
    def generate_schedules(self, course_codes: list[str], max_results: int = 10):
        """
        Generate all valid schedules (no time conflicts) given a list of course codes.
        """
        grouped = [self.sections_df[self.sections_df["Course"].str.contains(c)] for c in course_codes]
        schedules = []

        for combo in itertools.product(*grouped):
            schedule = pd.concat(combo)
            if not self.detect_conflicts(schedule):
                schedules.append(schedule)
            if len(schedules) >= max_results:
                break

        print(f"✅ Generated {len(schedules)} valid schedules.")
        return schedules

    # ----------------------------------------------------------
    # ⭐ PREFERENCES
    # ----------------------------------------------------------
    def filter_preferred_professor(self, df: pd.DataFrame, professor_name: str):
        """Filter sections taught by a preferred professor."""
        return df[df["Instructor"].str.contains(professor_name, case=False, na=False)]

    def filter_preferred_time(self, df: pd.DataFrame, earliest: str = None, latest: str = None):
        """Filter sections within a preferred time window."""
        if earliest:
            df = df[df["Start Time"].apply(lambda t: self._parse_time(t) >= self._parse_time(earliest))]
        if latest:
            df = df[df["End Time"].apply(lambda t: self._parse_time(t) <= self._parse_time(latest))]
        return df

    # ----------------------------------------------------------
    # 📤 EXPORT
    # ----------------------------------------------------------
    def export_schedule(self, schedule_df: pd.DataFrame, filename: str):
        """Export a chosen schedule to CSV."""
        schedule_df.to_csv(filename, index=False)
        print(f"💾 Saved schedule to {filename}")
