"""Normalizer service: cleans and standardizes CSV data."""

import re


def _standardize_column_name(name: str) -> str:
    """Convert column name to lowercase with underscores."""
    name = name.strip().lower()
    name = re.sub(r"[^a-z0-9]+", "_", name)
    name = name.strip("_")
    return name


def _convert_value(value):
    """Convert string values to appropriate types."""
    if value is None or (isinstance(value, str) and value.strip() == ""):
        return "N/A"
    if isinstance(value, str):
        value = value.strip()
        # Try integer
        try:
            return int(value)
        except (ValueError, TypeError):
            pass
        # Try float
        try:
            return float(value)
        except (ValueError, TypeError):
            pass
    return value


def normalize(data: list[dict]) -> list[dict]:
    """Normalize raw CSV data.

    - Standardize column names (lowercase, underscores)
    - Strip whitespace from string values
    - Fill empty values with 'N/A'
    - Convert numeric strings to numbers
    """
    if not data:
        return []

    normalized = []
    for row in data:
        new_row = {}
        for key, value in row.items():
            new_key = _standardize_column_name(key)
            new_row[new_key] = _convert_value(value)
        normalized.append(new_row)

    return normalized
