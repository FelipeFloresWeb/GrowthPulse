"""Tests for collector service."""

import pytest

from app.services.collector import collect, _find_revenue_column


def test_collect_basic(sample_normalized_data):
    result = collect(sample_normalized_data)
    assert result["total_revenue"] == 365000
    assert result["total_clients"] == 5
    assert result["avg_revenue_per_client"] == 73000.0
    assert 5 <= result["churn_rate"] <= 25
    assert 50 <= result["cac"] <= 500
    assert result["ltv"] == 73000.0 * 12


def test_collect_empty_data():
    result = collect([])
    assert result["total_revenue"] == 0
    assert result["total_clients"] == 0
    assert result["avg_revenue_per_client"] == 0
    assert result["churn_rate"] == 0
    assert result["cac"] == 0
    assert result["ltv"] == 0


def test_collect_receita_column():
    data = [
        {"nome": "Client A", "receita": 10000},
        {"nome": "Client B", "receita": 20000},
    ]
    result = collect(data)
    assert result["total_revenue"] == 30000
    assert result["total_clients"] == 2


def test_collect_string_revenue():
    data = [
        {"name": "Client A", "revenue": "10000"},
        {"name": "Client B", "revenue": "invalid"},
    ]
    result = collect(data)
    assert result["total_revenue"] == 10000
    assert result["total_clients"] == 2


def test_collect_no_revenue_column():
    data = [
        {"name": "Client A", "sector": "Tech"},
        {"name": "Client B", "sector": "Finance"},
    ]
    result = collect(data)
    assert result["total_revenue"] == 0
    assert result["total_clients"] == 2
    assert result["avg_revenue_per_client"] == 0


def test_find_revenue_column():
    assert _find_revenue_column({"revenue": 100}) == "revenue"
    assert _find_revenue_column({"receita": 100}) == "receita"
    assert _find_revenue_column({"total_revenue": 100}) == "total_revenue"
    assert _find_revenue_column({"valor": 100}) == "valor"
    assert _find_revenue_column({"value": 100}) == "value"
    assert _find_revenue_column({"name": "test"}) is None


def test_collect_mixed_types():
    data = [
        {"name": "A", "revenue": 100},
        {"name": "B", "revenue": "200"},
        {"name": "C", "revenue": "N/A"},
    ]
    result = collect(data)
    assert result["total_revenue"] == 300
