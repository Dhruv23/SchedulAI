import unittest
from unittest.mock import patch, MagicMock
import pandas as pd
import os
from classes.html_to_df import MajorCourseScraper


class TestMajorCourseScraper(unittest.TestCase):
    def setUp(self):
        """Prepare a fake HTML snippet and URL."""
        self.fake_html = """
        <html>
          <body>
            <h3><span class="gdbold">10. Introduction to Programming</span></h3>
            <p>Learn to code in Python.</p>
            <h3><span class="gdbold">11. Data Structures</span></h3>
            <p>Learn about lists, trees, and graphs.</p>
          </body>
        </html>
        """
        self.url = "http://fake-url.com"
        self.scraper = MajorCourseScraper(self.url)

    # 1️⃣ Normal case — fetch_html
    @patch("requests.get")
    def test_fetch_html_normal(self, mock_get):
        """Normal case: fetch_html should retrieve and store HTML text."""
        mock_response = MagicMock()
        mock_response.text = "<html>OK</html>"
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        html = self.scraper.fetch_html()
        self.assertIn("<html>", html)
        self.assertEqual(self.scraper.html, html)

    # 2️⃣ Normal case — parse_html with valid data
    def test_parse_html_normal(self):
        """Normal case: parse valid HTML into a DataFrame."""
        self.scraper.html = self.fake_html
        df = self.scraper.parse_html()
        self.assertIsInstance(df, pd.DataFrame)
        self.assertEqual(len(df), 2)
        self.assertIn("Course Name", df.columns)
        self.assertIn("Introduction", df.iloc[0]["Course Name"])

    # 3️⃣ Edge case — empty or malformed HTML
    def test_parse_html_edge_empty(self):
        """Edge case: empty HTML should return empty DataFrame."""
        self.scraper.html = "<html></html>"
        df = self.scraper.parse_html()
        self.assertTrue(df.empty)

    # 4️⃣ Invalid case — save_to_csv before parsing
    def test_save_to_csv_invalid(self):
        """Invalid case: calling save_to_csv with no DataFrame should raise error."""
        with self.assertRaises(ValueError):
            self.scraper.save_to_csv("should_fail.csv")

    # 5️⃣ Utility — full pipeline
    @patch.object(MajorCourseScraper, "fetch_html")
    @patch.object(MajorCourseScraper, "save_to_csv")
    def test_run_full_pipeline(self, mock_save, mock_fetch):
        """Utility: run_full_pipeline executes all steps and returns DataFrame."""
        mock_fetch.return_value = self.fake_html
        self.scraper.html = self.fake_html
        df = self.scraper.parse_html()
        self.scraper.df = df

        result = self.scraper.run_full_pipeline("output.csv")
        self.assertIsInstance(result, pd.DataFrame)
        self.assertGreater(len(result), 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)