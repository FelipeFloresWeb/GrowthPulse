"""Analyzer service: uses OpenAI GPT to generate growth analysis."""

import json
import os
import logging

from openai import OpenAI

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a senior marketing analyst at GrowthPulse, a marketing
intelligence company that helps businesses increase revenue. Analyze the provided
business metrics and return a JSON object with exactly this structure:

{
  "growth_score": <integer 0-100>,
  "potential_revenue_increase": <float percentage 10-85>,
  "recommendations": [<3 to 5 strings with actionable marketing recommendations>],
  "risk_level": "<low|medium|high>",
  "market_position": "<emerging|growing|established|dominant>"
}

Base your analysis on the metrics provided. Be specific and actionable in recommendations.
Return ONLY valid JSON, no markdown or extra text."""


def _get_client() -> OpenAI:
    """Create OpenAI client."""
    return OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))


def _build_user_prompt(metrics: dict) -> str:
    """Build the user prompt with metrics data."""
    return f"""Analyze these business metrics and provide growth recommendations:

- Total Revenue: ${metrics.get('total_revenue', 0):,.2f}
- Total Clients: {metrics.get('total_clients', 0)}
- Average Revenue per Client: ${metrics.get('avg_revenue_per_client', 0):,.2f}
- Churn Rate: {metrics.get('churn_rate', 0)}%
- Customer Acquisition Cost (CAC): ${metrics.get('cac', 0):,.2f}
- Customer Lifetime Value (LTV): ${metrics.get('ltv', 0):,.2f}"""


def _parse_response(content: str) -> dict:
    """Parse GPT response into structured dict."""
    cleaned = content.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
        cleaned = cleaned.rsplit("```", 1)[0]
    return json.loads(cleaned)


def _fallback_analysis(metrics: dict) -> dict:
    """Generate fallback analysis when GPT is unavailable."""
    score = 50
    avg_revenue = metrics.get("avg_revenue_per_client", 0)
    churn_rate = metrics.get("churn_rate", 15)
    total_clients = metrics.get("total_clients", 0)

    if avg_revenue > 10000:
        score += 20
    elif avg_revenue > 1000:
        score += 10

    if churn_rate < 10:
        score += 15
    elif churn_rate > 20:
        score -= 10

    if total_clients > 50:
        score += 10

    score = max(0, min(100, score))

    risk = "low" if churn_rate < 12 else "medium" if churn_rate < 20 else "high"
    total_revenue = metrics.get("total_revenue", 0)
    position = (
        "dominant" if total_revenue > 1000000 and total_clients > 100
        else "established" if total_revenue > 500000 or total_clients > 50
        else "growing" if total_revenue > 100000 or total_clients > 20
        else "emerging"
    )

    return {
        "growth_score": score,
        "potential_revenue_increase": round(score * 0.85, 2),
        "recommendations": [
            "Invest in content marketing to build brand authority",
            "Implement customer retention program to reduce churn",
            "Optimize acquisition channels to lower CAC",
            "Develop upselling strategies for existing clients",
            "Launch referral program to leverage client satisfaction",
        ][:5],
        "risk_level": risk,
        "market_position": position,
    }


def analyze(metrics: dict) -> dict:
    """Generate growth analysis using GPT.

    Falls back to rule-based analysis if GPT is unavailable.
    """
    try:
        client = _get_client()
        response = client.chat.completions.create(
            model=os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": _build_user_prompt(metrics)},
            ],
            temperature=0.7,
            max_tokens=500,
        )
        content = response.choices[0].message.content
        return _parse_response(content)
    except Exception as e:
        logger.warning(f"GPT analysis failed, using fallback: {e}")
        return _fallback_analysis(metrics)
