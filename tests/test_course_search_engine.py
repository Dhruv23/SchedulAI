import unittest
import pandas as pd
import os
from classes.course_search_engine import CourseSearchEngine


class TestCourseSearchEngine(unittest.TestCase):
    def setUp(self):
        """Set up a small mock DataFrame for testing."""
        self.sample_df = pd.DataFrame({
            "Course Name": ["CSEN 10 - Intro to Programming", "MATH 11 - Calculus I", "CSEN 140 - Machine Learning"],
            "Description": ["Learn Python basics", "Differentiation and integration", "Supervised and unsupervised learning"],
            "Units": [4, 5, 4],
            "Course Number": [10, 11, 140]
        })
        self.engine = CourseSearchEngine(self.sample_df)

    # [NORMAL CASE] - keyword search
    def test_search_keyword_normal(self):
        """[NORMAL CASE] - keyword search should return expected results."""
        results = self.engine.search_keyword("Python")
        self.assertEqual(len(results), 1)
        self.assertIn("CSEN 10", results.iloc[0]["Course Name"])

    # [NORMAL CASE] - subject filtering
    def test_filter_by_subject(self):
        """[NORMAL CASE] - filter by subject prefix (CSEN)."""
        results = self.engine.filter_by_subject("CSEN")
        self.assertTrue(all(results["Course Name"].str.startswith("CSEN")))
        self.assertGreaterEqual(len(results), 1)

    # [EDGE CASE] - units boundary
    def test_filter_by_units_edge(self):
        """[EDGE CASE] - filtering by minimum units boundary."""
        results = self.engine.filter_by_units(min_units=5)
        self.assertEqual(len(results), 1)
        self.assertEqual(results.iloc[0]["Units"], 5)

    # [INVALID CASE] - missing column in level filter
    def test_filter_by_level_invalid_missing_column(self):
        """[INVALID CASE] - should raise ValueError when 'Course Number' is missing."""
        bad_df = pd.DataFrame({"Course Name": ["CSEN 1"], "Units": [4]})
        engine = CourseSearchEngine(bad_df)
        with self.assertRaises(ValueError):
            engine.filter_by_level("upper")

    # [UTILITY] - export results
    def test_export_results(self):
        """[UTILITY] - verify that export_results successfully writes a CSV."""
        results = self.engine.filter_by_subject("CSEN")
        output_file = "test_output.csv"
        self.engine.export_results(results, output_file)

        self.assertTrue(os.path.exists(output_file))
        os.remove(output_file)


if __name__ == "__main__":
    unittest.main(verbosity=2)