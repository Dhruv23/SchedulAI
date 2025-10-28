import unittest
from unittest.mock import patch, MagicMock
import pandas as pd
import os
from classes.excel_to_dataframe import CourseExcelParser


class TestCourseExcelParser(unittest.TestCase):
    def setUp(self):
        """Set up a parser with dummy file path."""
        self.parser = CourseExcelParser("dummy.xlsx", output_dir="test_output_dir")

    # [NORMAL CASE] - course parsing
    @patch("pandas.read_excel")
    def test_parse_courses_normal(self, mock_read_excel):
        """[NORMAL CASE] - should combine all sheets and save to CSV."""
        mock_df1 = pd.DataFrame({"Course Subject": ["CSEN"], "Course": ["CSEN 10"]})
        mock_df2 = pd.DataFrame({"Course Subject": ["MATH"], "Course": ["MATH 11"]})
        mock_read_excel.return_value = {"Sheet1": mock_df1, "Sheet2": mock_df2}

        result = self.parser.parse_courses("test_combined.csv")
        self.assertIsInstance(result, pd.DataFrame)
        self.assertEqual(len(result), 2)
        self.assertTrue(os.path.exists("test_combined.csv"))
        os.remove("test_combined.csv")

    # [EDGE CASE] - split_by_course_subject single subject
    @patch("os.makedirs")
    def test_split_by_course_subject_edge_single(self, mock_makedirs):
        """[EDGE CASE] - single subject DataFrame should still create one CSV."""
        df = pd.DataFrame({"Course Subject": ["CSEN", "CSEN"], "Course": ["CSEN 10", "CSEN 11"]})
        self.parser.df = df
        with patch.object(pd.DataFrame, "to_csv") as mock_to_csv:
            self.parser.split_by_course_subject()
            mock_to_csv.assert_called_once()

    # [INVALID CASE] - split_by_course_subject missing data
    def test_split_by_course_subject_invalid(self):
        """[INVALID CASE] - should raise errors for missing or uninitialized DataFrame."""
        # Case 1: df is None
        with self.assertRaises(ValueError):
            self.parser.split_by_course_subject()

        # Case 2: missing required column
        self.parser.df = pd.DataFrame({"WrongColumn": [1, 2]})
        with self.assertRaises(ValueError):
            self.parser.split_by_course_subject()

    # [INVALID CASE] - file not found or unreadable Excel
    @patch("pandas.read_excel", side_effect=FileNotFoundError)
    def test_parse_courses_invalid_file(self, mock_read_excel):
        """[INVALID CASE] - should raise FileNotFoundError gracefully."""
        with self.assertRaises(FileNotFoundError):
            self.parser.parse_courses("nonexistent.csv")

    # [UTILITY] - run_full_pipeline integrates all steps
    @patch.object(CourseExcelParser, "parse_courses")
    @patch.object(CourseExcelParser, "split_by_course_subject")
    def test_run_full_pipeline(self, mock_split, mock_parse):
        """[UTILITY] - ensures both parse and split are called."""
        mock_df = pd.DataFrame({"Course Subject": ["CSEN"], "Course": ["CSEN 10"]})
        mock_parse.return_value = mock_df
        self.parser.df = mock_df

        result = self.parser.run_full_pipeline()
        mock_parse.assert_called_once()
        mock_split.assert_called_once()
        self.assertIsInstance(result, pd.DataFrame)


if __name__ == "__main__":
    unittest.main(verbosity=2)