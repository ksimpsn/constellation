"""
Test CSV and JSON parser functionality without Ray.

Tests:
1. csv_parser correctly parses CSV files into dicts
2. json_parser handles JSON arrays and objects
3. Parsers handle missing files gracefully
4. Parsers return expected data structures
5. Invalid file paths raise appropriate errors
"""

import unittest
import tempfile
import json
import csv
import os

from backend.core.api import ConstellationAPI
from backend.core.database import init_db
from unittest.mock import MagicMock



class TestCSVJSONParsers(unittest.TestCase):
    """Test CSV and JSON parser functionality."""
    
    def setUp(self):
        """Create temporary directory for test files."""
        self.test_dir = tempfile.mkdtemp()
        self.api = ConstellationAPI()

        init_db()
        
        # Mock the Ray cluster and submit_project to avoid Ray dependency
        self.api.server = MagicMock()
        self.api.server.submit_tasks = MagicMock(return_value=[])
    
    def tearDown(self):
        """Clean up temporary files."""
        import shutil
        shutil.rmtree(self.test_dir, ignore_errors=True)
    
    def _create_csv_file(self, filename, headers, rows):
        """Helper to create a CSV file."""
        filepath = os.path.join(self.test_dir, filename)
        with open(filepath, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
            writer.writerows(rows)
        return filepath
    
    def _create_json_file(self, filename, data):
        """Helper to create a JSON file."""
        filepath = os.path.join(self.test_dir, filename)
        with open(filepath, 'w') as f:
            json.dump(data, f)
        return filepath
    
    # CSV Parser Tests
    
    def test_csv_parser_parses_simple_csv(self):
        """Test that csv_parser correctly parses a simple CSV file."""
        headers = ["id", "name", "value"]
        rows = [
            {"id": "1", "name": "Alice", "value": "10"},
            {"id": "2", "name": "Bob", "value": "20"},
            {"id": "3", "name": "Charlie", "value": "30"}
        ]
        csv_file = self._create_csv_file("test.csv", headers, rows)
        
        # Mock submit_project to capture the data
        submitted_data = []
        self.api.submit_project = MagicMock(
            side_effect=lambda data: (submitted_data.append(data), 0)[1]
        )
        
        job_id = self.api.csv_parser(csv_file)
        
        self.assertEqual(job_id, 0)
        self.assertEqual(len(submitted_data[0]), 3)
        self.assertEqual(submitted_data[0][0]["name"], "Alice")
        self.assertEqual(submitted_data[0][1]["value"], "20")
    
    def test_csv_parser_handles_string_values(self):
        """Test that CSV parser treats all values as strings."""
        headers = ["number", "text"]
        rows = [
            {"number": "123", "text": "hello"},
            {"number": "456", "text": "world"}
        ]
        csv_file = self._create_csv_file("strings.csv", headers, rows)
        
        submitted_data = []
        self.api.submit_project = MagicMock(
            side_effect=lambda data: (submitted_data.append(data), 0)[1]
        )
        
        self.api.csv_parser(csv_file)
        
        # CSV reader returns strings, so values should be strings
        self.assertIsInstance(submitted_data[0][0]["number"], str)
        self.assertEqual(submitted_data[0][0]["number"], "123")
    
    def test_csv_parser_missing_file_raises_error(self):
        """Test that csv_parser raises FileNotFoundError for missing file."""
        with self.assertRaises(FileNotFoundError):
            self.api.csv_parser("/nonexistent/path/file.csv")
    
    def test_csv_parser_empty_csv(self):
        """Test that csv_parser handles empty CSV (only headers)."""
        headers = ["id", "name"]
        rows = []
        csv_file = self._create_csv_file("empty.csv", headers, rows)
        
        submitted_data = []
        self.api.submit_project = MagicMock(
            side_effect=lambda data: (submitted_data.append(data), 0)[1]
        )
        
        self.api.csv_parser(csv_file)
        self.assertEqual(len(submitted_data[0]), 0)
    
    def test_csv_parser_large_dataset(self):
        """Test that csv_parser handles larger CSV files."""
        headers = ["id", "value"]
        rows = [{"id": str(i), "value": str(i*2)} for i in range(1000)]
        csv_file = self._create_csv_file("large.csv", headers, rows)
        
        submitted_data = []
        self.api.submit_project = MagicMock(
            side_effect=lambda data: (submitted_data.append(data), 0)[1]
        )
        
        self.api.csv_parser(csv_file)
        self.assertEqual(len(submitted_data[0]), 1000)
        self.assertEqual(submitted_data[0][0]["id"], "0")
        self.assertEqual(submitted_data[0][-1]["id"], "999")
    
    # JSON Parser Tests
    
    def test_json_parser_parses_array(self):
        """Test that json_parser correctly parses a JSON array."""
        data = [
            {"id": 1, "name": "Alice"},
            {"id": 2, "name": "Bob"},
            {"id": 3, "name": "Charlie"}
        ]
        json_file = self._create_json_file("array.json", data)
        
        submitted_data = []
        self.api.submit_project = MagicMock(
            side_effect=lambda data: (submitted_data.append(data), 0)[1]
        )
        
        job_id = self.api.json_parser(json_file)
        
        self.assertEqual(job_id, 0)
        self.assertEqual(len(submitted_data[0]), 3)
        self.assertEqual(submitted_data[0][0]["name"], "Alice")
    
    def test_json_parser_parses_object(self):
        """Test that json_parser wraps a JSON object in a list."""
        data = {"id": 1, "name": "Alice", "age": 30}
        json_file = self._create_json_file("object.json", data)
        
        submitted_data = []
        self.api.submit_project = MagicMock(
            side_effect=lambda data: (submitted_data.append(data), 0)[1]
        )
        
        self.api.json_parser(json_file)
        
        # Object should be wrapped in a list
        self.assertEqual(len(submitted_data[0]), 1)
        self.assertEqual(submitted_data[0][0], data)
    
    def test_json_parser_handles_nested_structures(self):
        """Test that json_parser handles nested JSON structures."""
        data = [
            {
                "id": 1,
                "nested": {"key": "value"},
                "array": [1, 2, 3],
                "mixed": {"deep": {"deeper": "value"}}
            }
        ]
        json_file = self._create_json_file("nested.json", data)
        
        submitted_data = []
        self.api.submit_project = MagicMock(
            side_effect=lambda data: (submitted_data.append(data), 0)[1]
        )
        
        self.api.json_parser(json_file)
        
        self.assertEqual(submitted_data[0][0]["nested"]["key"], "value")
        self.assertEqual(submitted_data[0][0]["mixed"]["deep"]["deeper"], "value")
    
    def test_json_parser_handles_various_types(self):
        """Test that json_parser preserves various JSON types."""
        data = [
            {
                "string": "text",
                "number": 42,
                "float": 3.14,
                "boolean_true": True,
                "boolean_false": False,
                "null_value": None,
                "array": [1, "two", 3.0],
                "object": {"nested": "value"}
            }
        ]
        json_file = self._create_json_file("types.json", data)
        
        submitted_data = []
        self.api.submit_project = MagicMock(
            side_effect=lambda data: (submitted_data.append(data), 0)[1]
        )
        
        self.api.json_parser(json_file)
        
        item = submitted_data[0][0]
        self.assertEqual(item["string"], "text")
        self.assertEqual(item["number"], 42)
        self.assertAlmostEqual(item["float"], 3.14)
        self.assertTrue(item["boolean_true"])
        self.assertFalse(item["boolean_false"])
        self.assertIsNone(item["null_value"])
        self.assertEqual(item["array"], [1, "two", 3.0])
    
    def test_json_parser_missing_file_raises_error(self):
        """Test that json_parser raises FileNotFoundError for missing file."""
        with self.assertRaises(FileNotFoundError):
            self.api.json_parser("/nonexistent/path/file.json")
    
    def test_json_parser_empty_array(self):
        """Test that json_parser handles empty JSON array."""
        data = []
        json_file = self._create_json_file("empty.json", data)
        
        submitted_data = []
        self.api.submit_project = MagicMock(
            side_effect=lambda data: (submitted_data.append(data), 0)[1]
        )
        
        self.api.json_parser(json_file)
        self.assertEqual(len(submitted_data[0]), 0)
    
    def test_json_parser_large_array(self):
        """Test that json_parser handles large JSON arrays."""
        data = [{"id": i, "value": i*2} for i in range(1000)]
        json_file = self._create_json_file("large.json", data)
        
        submitted_data = []
        self.api.submit_project = MagicMock(
            side_effect=lambda data: (submitted_data.append(data), 0)[1]
        )
        
        self.api.json_parser(json_file)
        self.assertEqual(len(submitted_data[0]), 1000)
        self.assertEqual(submitted_data[0][0]["id"], 0)
        self.assertEqual(submitted_data[0][-1]["id"], 999)
    
    # Integration Tests
    
    def test_csv_and_json_parsers_submit_to_api(self):
        """Test that both parsers call submit_project with correct arguments."""
        # Test CSV
        headers = ["id", "value"]
        rows = [{"id": "1", "value": "10"}]
        csv_file = self._create_csv_file("test.csv", headers, rows)
        
        self.api.submit_project = MagicMock(return_value=0)
        self.api.csv_parser(csv_file)
        
        self.api.submit_project.assert_called_once()
        csv_call_args = self.api.submit_project.call_args[0][0]
        self.assertEqual(len(csv_call_args), 1)
        
        # Test JSON
        json_data = [{"id": 1, "value": 10}]
        json_file = self._create_json_file("test.json", json_data)
        
        self.api.submit_project = MagicMock(return_value=1)
        self.api.json_parser(json_file)
        
        self.api.submit_project.assert_called_once()
        json_call_args = self.api.submit_project.call_args[0][0]
        self.assertEqual(len(json_call_args), 1)


if __name__ == "__main__":
    unittest.main()
