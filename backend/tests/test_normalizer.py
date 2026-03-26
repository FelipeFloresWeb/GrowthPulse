"""Tests for normalizer service."""

import pytest

from app.services.normalizer import normalize, _standardize_column_name, _convert_value


def test_normalize_basic(sample_csv_data):
    result = normalize(sample_csv_data)
    assert len(result) == 5
    # Column names should be standardized
    assert "company_name" in result[0]
    assert "revenue" in result[0]
    assert "sector" in result[0]


def test_normalize_converts_numbers():
    data = [{"Price": "100", "Name": "Test"}]
    result = normalize(data)
    assert result[0]["price"] == 100
    assert result[0]["name"] == "Test"


def test_normalize_fills_empty_values():
    data = [{"Name": "", "Value": None, "Other": "  "}]
    result = normalize(data)
    assert result[0]["name"] == "N/A"
    assert result[0]["value"] == "N/A"
    assert result[0]["other"] == "N/A"


def test_normalize_empty_list():
    result = normalize([])
    assert result == []


def test_normalize_strips_whitespace():
    data = [{"Name": "  Hello World  ", "Value": " 42 "}]
    result = normalize(data)
    assert result[0]["value"] == 42


def test_normalize_float_conversion():
    data = [{"Price": "99.99"}]
    result = normalize(data)
    assert result[0]["price"] == 99.99


def test_standardize_column_name():
    assert _standardize_column_name("Company Name") == "company_name"
    assert _standardize_column_name("  Revenue  ") == "revenue"
    assert _standardize_column_name("Total-Revenue") == "total_revenue"
    assert _standardize_column_name("CAC (USD)") == "cac_usd"


def test_convert_value_none():
    assert _convert_value(None) == "N/A"


def test_convert_value_empty_string():
    assert _convert_value("") == "N/A"
    assert _convert_value("   ") == "N/A"


def test_convert_value_int():
    assert _convert_value("42") == 42


def test_convert_value_float():
    assert _convert_value("3.14") == 3.14


def test_convert_value_string():
    assert _convert_value("hello") == "hello"


def test_convert_value_already_number():
    assert _convert_value(42) == 42
    assert _convert_value(3.14) == 3.14
