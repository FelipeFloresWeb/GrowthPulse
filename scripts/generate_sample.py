"""
Generate a sample CSV file with realistic company data
for the GrowthPulse Marketing Intelligence Platform.

Uses seed 42 for reproducibility.
"""

import csv
import random
from pathlib import Path

random.seed(42)

# --- Configuration ---

ROWS = 250
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "data"
OUTPUT_FILE = OUTPUT_DIR / "sample_clients.csv"

SECTORS = [
    "Technology", "Retail", "Healthcare", "Education",
    "Finance", "Food & Beverage", "Logistics", "Construction",
]

# Intentional casing variants for some sectors
SECTOR_CASING_VARIANTS = {
    "Technology": ["Technology", "TECHNOLOGY", "technology"],
    "Retail": ["Retail", "RETAIL", "retail"],
    "Healthcare": ["Healthcare", "HEALTHCARE", "healthcare"],
    "Education": ["Education", "EDUCATION", "education"],
    "Finance": ["Finance", "FINANCE", "finance"],
    "Food & Beverage": ["Food & Beverage", "FOOD & BEVERAGE", "food & beverage"],
    "Logistics": ["Logistics", "LOGISTICS", "logistics"],
    "Construction": ["Construction", "CONSTRUCTION", "construction"],
}

CITY_STATE_MAP = {
    "New York": "NY",
    "Los Angeles": "CA",
    "Chicago": "IL",
    "Houston": "TX",
    "Phoenix": "AZ",
    "Philadelphia": "PA",
    "San Antonio": "TX",
    "San Diego": "CA",
    "Dallas": "TX",
    "Austin": "TX",
    "Denver": "CO",
    "Seattle": "WA",
    "Boston": "MA",
    "Miami": "FL",
    "Atlanta": "GA",
}

CITIES = list(CITY_STATE_MAP.keys())

PLAN_TYPES = ["Basic", "Pro", "Enterprise"]

PREFIXES = [
    "Nova", "Tech", "Smart", "Digital", "Global", "Prime",
    "Mega", "Ultra", "Alpha", "Beta", "Eco", "Neo", "Max", "Top",
    "Bio", "Agro", "Multi", "Super", "Info", "Apex",
]

SUFFIXES = [
    "Solutions", "Systems", "Corp", "Group", "Lab", "Hub", "Net",
    "Tec", "Soft", "Data", "Link", "Plus", "Pro", "Works", "Way",
    "Point", "Cloud", "Box", "Core", "Line",
]

MIDDLE_PARTS = [
    "Connect", "Service", "Express", "Vision", "Logic", "Trade",
    "Capital", "Power", "Health", "Edu", "Food", "Move", "Build",
    "Finance", "Green", "Blue", "Fast", "Safe", "Easy", "Open",
]


def generate_company_name(index: int) -> str:
    """Generate a realistic-ish company name."""
    style = random.randint(0, 3)
    if style == 0:
        name = f"{random.choice(PREFIXES)}{random.choice(SUFFIXES)}"
    elif style == 1:
        name = f"{random.choice(PREFIXES)} {random.choice(MIDDLE_PARTS)}"
    elif style == 2:
        name = f"{random.choice(MIDDLE_PARTS)} {random.choice(SUFFIXES)}"
    else:
        name = f"{random.choice(PREFIXES)}{random.choice(MIDDLE_PARTS)} {random.choice(SUFFIXES)}"

    # Add intentional whitespace messiness to ~10% of names
    if random.random() < 0.10:
        padding = random.choice([
            f"  {name}",
            f"{name}  ",
            f"  {name}  ",
            f" {name} ",
        ])
        return padding
    return name


def generate_sector() -> str:
    """Pick a sector, sometimes with inconsistent casing."""
    base = random.choice(SECTORS)
    if random.random() < 0.25:
        variants = SECTOR_CASING_VARIANTS[base]
        return random.choice(variants[1:])
    return base


def generate_revenue() -> str:
    """Generate revenue between 5000 and 500000, sometimes as currency string."""
    value = random.randint(5000, 500000)
    if random.random() < 0.15:
        return f"$ {value}"
    return str(value)


def generate_monthly_clients() -> int:
    return random.randint(10, 5000)


def generate_churn_rate(allow_empty: bool) -> str:
    """Generate churn rate 2-30%, sometimes empty."""
    if allow_empty and random.random() < 1.0:
        return ""
    return f"{round(random.uniform(2.0, 30.0), 1)}"


def generate_cac(allow_empty: bool) -> str:
    """Generate CAC 30-800, sometimes empty."""
    if allow_empty and random.random() < 1.0:
        return ""
    return str(random.randint(30, 800))


def generate_contract_start() -> str:
    """Random date between 2022-01 and 2025-12."""
    year = random.randint(2022, 2025)
    month = random.randint(1, 12)
    day = random.randint(1, 28)
    return f"{year}-{month:02d}-{day:02d}"


def generate_plan_type() -> str:
    return random.choice(PLAN_TYPES)


def generate_city_state() -> tuple:
    city = random.choice(CITIES)
    return city, CITY_STATE_MAP[city]


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    empty_churn_rows = set(random.sample(range(ROWS), 4))
    empty_cac_rows = set(random.sample(range(ROWS), 4))

    headers = [
        "Company Name", "Sector", "Revenue", "Monthly Clients",
        "Churn Rate (%)", "CAC", "City", "State",
        "Contract Start", "Plan Type",
    ]

    rows = []
    for i in range(ROWS):
        city, state = generate_city_state()
        row = [
            generate_company_name(i),
            generate_sector(),
            generate_revenue(),
            generate_monthly_clients(),
            generate_churn_rate(allow_empty=(i in empty_churn_rows)),
            generate_cac(allow_empty=(i in empty_cac_rows)),
            city,
            state,
            generate_contract_start(),
            generate_plan_type(),
        ]
        rows.append(row)

    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)

    print(f"Generated {len(rows)} rows -> {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
