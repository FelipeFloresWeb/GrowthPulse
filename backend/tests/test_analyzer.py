"""Tests for analyzer service (GPT-powered with fallback)."""

import json
import pytest
from unittest.mock import patch, MagicMock

from app.services.analyzer import (
    analyze,
    _build_user_prompt,
    _parse_response,
    _fallback_analysis,
    _get_client,
)


# --- _build_user_prompt ---

def test_build_user_prompt_with_metrics(sample_metrics):
    prompt = _build_user_prompt(sample_metrics)
    assert "365,000.00" in prompt
    assert "Total Clients: 5" in prompt
    assert "12.5%" in prompt


def test_build_user_prompt_empty_metrics():
    prompt = _build_user_prompt({})
    assert "Total Revenue: $0.00" in prompt
    assert "Total Clients: 0" in prompt


# --- _parse_response ---

def test_parse_response_plain_json():
    content = '{"growth_score": 75, "risk_level": "low"}'
    result = _parse_response(content)
    assert result["growth_score"] == 75


def test_parse_response_with_markdown():
    content = '```json\n{"growth_score": 80}\n```'
    result = _parse_response(content)
    assert result["growth_score"] == 80


def test_parse_response_invalid_json():
    with pytest.raises(json.JSONDecodeError):
        _parse_response("not json at all")


# --- _fallback_analysis ---

def test_fallback_high_revenue():
    metrics = {
        "avg_revenue_per_client": 15000,
        "churn_rate": 5,
        "total_clients": 200,
        "total_revenue": 1200000,
    }
    result = _fallback_analysis(metrics)
    assert result["growth_score"] >= 80
    assert result["risk_level"] == "low"
    assert result["market_position"] == "dominant"
    assert len(result["recommendations"]) <= 5


def test_fallback_low_revenue():
    metrics = {
        "avg_revenue_per_client": 500,
        "churn_rate": 25,
        "total_clients": 5,
        "total_revenue": 2500,
    }
    result = _fallback_analysis(metrics)
    assert result["growth_score"] <= 50
    assert result["risk_level"] == "high"
    assert result["market_position"] == "emerging"


def test_fallback_medium_metrics():
    metrics = {
        "avg_revenue_per_client": 3000,
        "churn_rate": 15,
        "total_clients": 30,
        "total_revenue": 200000,
    }
    result = _fallback_analysis(metrics)
    assert result["risk_level"] == "medium"
    assert result["market_position"] == "growing"


def test_fallback_empty_metrics():
    result = _fallback_analysis({})
    assert "growth_score" in result
    assert isinstance(result["recommendations"], list)
    assert result["risk_level"] == "medium"
    assert result["market_position"] == "emerging"


def test_fallback_established_by_clients():
    metrics = {
        "avg_revenue_per_client": 2000,
        "churn_rate": 10,
        "total_clients": 60,
        "total_revenue": 120000,
    }
    result = _fallback_analysis(metrics)
    assert result["market_position"] == "established"


def test_fallback_score_clamped():
    metrics = {
        "avg_revenue_per_client": 0,
        "churn_rate": 100,
        "total_clients": 0,
        "total_revenue": 0,
    }
    result = _fallback_analysis(metrics)
    assert result["growth_score"] >= 0


def test_fallback_potential_revenue_increase():
    result = _fallback_analysis({"avg_revenue_per_client": 15000, "churn_rate": 5, "total_clients": 80})
    assert 0 <= result["potential_revenue_increase"] <= 85


# --- analyze (with GPT mock) ---

@patch("app.services.analyzer._get_client")
def test_analyze_gpt_success(mock_get_client, sample_metrics):
    gpt_response = {
        "growth_score": 82,
        "potential_revenue_increase": 45.5,
        "recommendations": ["Expand digital ads", "Launch referral program", "A/B test pricing"],
        "risk_level": "low",
        "market_position": "growing",
    }

    mock_message = MagicMock()
    mock_message.content = json.dumps(gpt_response)
    mock_choice = MagicMock()
    mock_choice.message = mock_message
    mock_completion = MagicMock()
    mock_completion.choices = [mock_choice]

    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = mock_completion
    mock_get_client.return_value = mock_client

    result = analyze(sample_metrics)

    assert result["growth_score"] == 82
    assert result["risk_level"] == "low"
    assert len(result["recommendations"]) == 3
    mock_client.chat.completions.create.assert_called_once()


@patch("app.services.analyzer._get_client")
def test_analyze_gpt_markdown_response(mock_get_client, sample_metrics):
    gpt_response = {
        "growth_score": 70,
        "potential_revenue_increase": 30.0,
        "recommendations": ["Invest in SEO"],
        "risk_level": "medium",
        "market_position": "established",
    }

    mock_message = MagicMock()
    mock_message.content = f"```json\n{json.dumps(gpt_response)}\n```"
    mock_choice = MagicMock()
    mock_choice.message = mock_message
    mock_completion = MagicMock()
    mock_completion.choices = [mock_choice]

    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = mock_completion
    mock_get_client.return_value = mock_client

    result = analyze(sample_metrics)
    assert result["growth_score"] == 70


@patch("app.services.analyzer._get_client")
def test_analyze_gpt_failure_uses_fallback(mock_get_client, sample_metrics):
    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = Exception("API error")
    mock_get_client.return_value = mock_client

    result = analyze(sample_metrics)

    assert "growth_score" in result
    assert isinstance(result["recommendations"], list)
    assert result["risk_level"] in ("low", "medium", "high")


@patch("app.services.analyzer._get_client")
def test_analyze_gpt_invalid_json_uses_fallback(mock_get_client, sample_metrics):
    mock_message = MagicMock()
    mock_message.content = "This is not JSON"
    mock_choice = MagicMock()
    mock_choice.message = mock_message
    mock_completion = MagicMock()
    mock_completion.choices = [mock_choice]

    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = mock_completion
    mock_get_client.return_value = mock_client

    result = analyze(sample_metrics)

    assert "growth_score" in result
    assert isinstance(result["recommendations"], list)


# --- _get_client ---

@patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"})
def test_get_client():
    client = _get_client()
    assert client is not None
