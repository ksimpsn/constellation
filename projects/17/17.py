"""
Simple demo project for quick backend tests.

Each task just squares an input integer and returns the result.
Expected CSV schema: a column named 'value' (or similar int-like field).
"""

from typing import Any, Dict


def main(row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Minimal compute function used for fast verification demos.

    It:
    - Reads an integer-like field from the row (defaults to 0 if missing)
    - Squares it
    - Returns a small JSON-serializable dict
    """
    # Try a few common column names
    value = None
    for key in row.keys():
        key_lower = key.lower().strip()
        if key_lower in ("value", "x", "number", "n"):
            try:
                value = int(row[key])
            except (TypeError, ValueError):
                value = 0
            break

    if value is None:
        # Fallback: first int-convertible field
        for key, v in row.items():
            try:
                value = int(v)
                break
            except (TypeError, ValueError):
                continue

    if value is None:
        value = 0

    return {
        "input": value,
        "squared": value * value,
    }

