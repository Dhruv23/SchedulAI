import unittest
import pandas as pd
from classes.schedule_planner import SchedulePlanner


class TestSchedulePlanner(unittest.TestCase):
    def setUp(self):
        """Prepare a small mock DataFrame of course sections."""
        self.data = pd.DataFrame({
            "Course": ["CSEN 10", "MATH 11", "CSEN 140"],
            "Day": ["Mon", "Mon", "Tue"],
            "Start Time": ["9:00 AM", "10:00 AM", "9:00 AM"],
            "End Time": ["9:50 AM", "10:50 AM", "9:50 AM"],
            "Instructor": ["Smith", "Jones", "Lee"]
        })
        self.planner = SchedulePlanner(self.data)

    # [NORMAL CASE] - time parsing
    def test_parse_time_valid(self):
        """[NORMAL CASE] - correctly parses AM/PM time strings."""
        t = self.planner._parse_time("2:30 PM")
        self.assertEqual(t.hour, 14)
        self.assertEqual(t.minute, 30)

    # [NORMAL CASE] - time overlap detection
    def test_times_overlap_true(self):
        """[NORMAL CASE] - overlapping times should return True."""
        row1 = {"Day": "Mon", "Start Time": "9:00 AM", "End Time": "10:00 AM"}
        row2 = {"Day": "Mon", "Start Time": "9:30 AM", "End Time": "10:30 AM"}
        self.assertTrue(self.planner._times_overlap(row1, row2))

    # [NORMAL CASE] - generate valid schedules
    def test_generate_schedules_normal(self):
        """[NORMAL CASE] - should generate at least one valid schedule."""
        schedules = self.planner.generate_schedules(["CSEN", "MATH"], max_results=5)
        self.assertIsInstance(schedules, list)
        self.assertGreaterEqual(len(schedules), 1)
        self.assertTrue(all(isinstance(s, pd.DataFrame) for s in schedules))

    # [EDGE CASE] - detect_conflicts no overlap
    def test_detect_conflicts_edge(self):
        """[EDGE CASE] - no overlap should return False."""
        no_conflict_df = pd.DataFrame({
            "Course": ["CSEN 10", "MATH 11"],
            "Day": ["Mon", "Tue"],  # different days
            "Start Time": ["9:00 AM", "10:00 AM"],
            "End Time": ["9:50 AM", "10:50 AM"],
            "Instructor": ["Smith", "Jones"]
        })
        self.assertFalse(self.planner.detect_conflicts(no_conflict_df))

    # [INVALID CASE] - malformed time filter
    def test_filter_preferred_time_invalid(self):
        """[INVALID CASE] - should handle malformed time inputs gracefully."""
        df = self.data.copy()
        df.loc[0, "Start Time"] = "badtime"  # corrupt one entry
        result = self.planner.filter_preferred_time(df, earliest="8:00 AM")
        # Should not crash, should still return a DataFrame
        self.assertIsInstance(result, pd.DataFrame)


if __name__ == "__main__":
    unittest.main(verbosity=2)