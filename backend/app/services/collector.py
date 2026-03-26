"""Collector service: extracts business metrics from normalized data."""

import random


def _find_revenue_column(row: dict) -> str | None:
    """Find the revenue column name in a row."""
    for key in row.keys():
        if key in ("receita", "revenue", "total_revenue", "valor", "value"):
            return key
    return None


def collect(data: list[dict]) -> dict:
    """Extract business metrics from normalized data.

    Returns metrics dict with:
    - total_revenue
    - total_clients
    - avg_revenue_per_client
    - churn_rate (simulated)
    - cac (simulated)
    - ltv (simulated)
    """
    if not data:
        return {
            "total_revenue": 0,
            "total_clients": 0,
            "avg_revenue_per_client": 0,
            "churn_rate": 0,
            "cac": 0,
            "ltv": 0,
        }

    total_clients = len(data)

    # Find revenue column
    revenue_col = _find_revenue_column(data[0]) if data else None
    total_revenue = 0
    if revenue_col:
        for row in data:
            val = row.get(revenue_col, 0)
            if isinstance(val, (int, float)):
                total_revenue += val
            elif isinstance(val, str):
                try:
                    total_revenue += float(val)
                except (ValueError, TypeError):
                    pass

    avg_revenue = total_revenue / total_clients if total_clients > 0 else 0

    # Simulated metrics
    churn_rate = round(random.uniform(5, 25), 2)
    cac = round(random.uniform(50, 500), 2)
    ltv = round(avg_revenue * 12, 2)

    return {
        "total_revenue": round(total_revenue, 2),
        "total_clients": total_clients,
        "avg_revenue_per_client": round(avg_revenue, 2),
        "churn_rate": churn_rate,
        "cac": cac,
        "ltv": ltv,
    }
