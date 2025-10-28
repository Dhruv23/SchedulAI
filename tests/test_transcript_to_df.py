import unittest
from unittest.mock import patch, MagicMock, mock_open
import pandas as pd
import os
from classes.transcript_to_df import TranscriptParser


class TestTranscriptParser(unittest.TestCase):
    def setUp(self):
        """Sample text that simulates transcript pages."""
        self.sample_text = (
            "CSEN 140 - Machine Learning and Data Mining\n"
            "A 4.0 4 16.0\n"
            "MATH 11 - Calculus I\n"
            "B+ 3.3 5 16.5\n"
        )

    # 1️⃣ Normal case — extract text from PDF
    @patch("pdfplumber.open")
    def test_extract_text_normal(self, mock_open_pdf):
        """Normal case: should concatenate text from all PDF pages."""
        mock_pdf = MagicMock()
        mock_pdf.pages = [MagicMock(), MagicMock()]
        mock_pdf.pages[0].extract_text.return_value = "Page1 Text"
        mock_pdf.pages[1].extract_text.return_value = "Page2 Text"
        mock_open_pdf.return_value.__enter__.return_value = mock_pdf

        parser = TranscriptParser("fake_path.pdf")
        self.assertIn("Page1 Text", parser.text)
        self.assertIn("Page2 Text", parser.text)

    # 2️⃣ Normal case — extract courses correctly
    @patch.object(TranscriptParser, "_extract_text", return_value="")
    def test_extract_courses_normal(self, mock_text):
        """Normal case: correctly extracts well-formatted course lines."""
        parser = TranscriptParser("dummy.pdf")
        parser.text = self.sample_text
        courses = parser._extract_courses()
        self.assertEqual(len(courses), 2)
        self.assertIn("Course Code", courses[0])
        self.assertAlmostEqual(courses[0]["Grade Points"], 4.0)

    # 3️⃣ Edge case — empty transcript
    @patch.object(TranscriptParser, "_extract_text", return_value="")
    def test_extract_courses_empty(self, mock_text):
        """Edge case: no course lines should produce empty list."""
        parser = TranscriptParser("empty.pdf")
        parser.text = ""
        courses = parser._extract_courses()
        self.assertEqual(courses, [])

    # 4️⃣ Invalid case — malformed line ignored
    @patch.object(TranscriptParser, "_extract_text", return_value="")
    def test_extract_courses_invalid_line(self, mock_text):
        """Invalid case: malformed text should not break extraction."""
        parser = TranscriptParser("dummy.pdf")
        parser.text = "CSEN 999 - Bad Data\nSomething malformed"
        courses = parser._extract_courses()
        self.assertEqual(courses, [])  # should ignore, not crash

    # 5️⃣ Utility — save_to_csv creates file
    @patch.object(TranscriptParser, "_extract_text", return_value="")
    def test_save_to_csv(self, mock_text):
        """Utility: verify CSV file is created."""
        parser = TranscriptParser("dummy.pdf")
        parser.text = self.sample_text
        output_path = "test_transcript_output.csv"
        parser.save_to_csv(output_path)
        self.assertTrue(os.path.exists(output_path))
        os.remove(output_path)


if __name__ == "__main__":
    unittest.main(verbosity=2)
