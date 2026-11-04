"""Flagship project: house price prediction.

Data: the California housing dataset (1990 US census, 20,640 districts), downloaded once by
scikit-learn. Each row is one neighborhood (a census block group), not one house, and the target is
the median home value there. Values above $500,000 were recorded as $500,000, so the model can't
predict more than that. Two engineered features are added: rooms per person and the bedroom share.
"""
import numpy as np
from pydantic import BaseModel, Field

from app.config import settings
from app.mllab import automl, jobs, registry
from app.mllab.data import from_arrays

MODEL_ID = "house-price"
KIND = "house-price"
TARGET = "MedHouseVal"
UNIT = 100_000  # the dataset gives values in $100,000s

# Friendly input name -> dataset column.
COLUMNS = {
    "income": "MedInc", "house_age": "HouseAge", "rooms": "AveRooms", "bedrooms": "AveBedrms",
    "population": "Population", "occupancy": "AveOccup", "latitude": "Latitude", "longitude": "Longitude",
}


class HouseInput(BaseModel):
    """One neighborhood in California (as in the census data the model learned from)."""
    income: float = Field(..., ge=0.1, le=20, description="Median household income in the area, in tens of thousands of US dollars (4.5 = $45,000 a year)")
    house_age: float = Field(..., ge=1, le=60, description="Median age of the houses, in years")
    rooms: float = Field(..., ge=1, le=20, description="Average number of rooms per home")
    bedrooms: float = Field(..., ge=0.5, le=10, description="Average number of bedrooms per home")
    population: float = Field(1200, ge=3, le=40_000, description="People living in the area (a census block group, usually 600 to 3,000)")
    occupancy: float = Field(3, ge=0.5, le=20, description="Average number of people per home")
    latitude: float = Field(..., ge=32.5, le=42, description="Latitude, e.g. 37.77 for San Francisco, 34.05 for Los Angeles")
    longitude: float = Field(..., ge=-124.5, le=-114, description="Longitude, e.g. -122.42 for San Francisco, -118.24 for Los Angeles")


def _engineer(rows: dict[str, np.ndarray]) -> dict[str, np.ndarray]:
    """Feature engineering, shared by training and prediction so they can't disagree."""
    rows = dict(rows)
    rows["RoomsPerPerson"] = rows["AveRooms"] / np.maximum(rows["AveOccup"], 0.1)
    rows["BedroomShare"] = rows["AveBedrms"] / np.maximum(rows["AveRooms"], 0.1)
    return rows


def load_dataset():
    from sklearn.datasets import fetch_california_housing

    data = fetch_california_housing(data_home=str(settings.data_dir / "sklearn"))
    return data.data, data.target, list(data.feature_names)


def train(progress, *, dataset=None, **options) -> dict:
    progress("Downloading the California housing data (first time only)", 2)
    X, y, names = dataset or load_dataset()
    cols = _engineer({n: X[:, i] for i, n in enumerate(names)})
    columns = list(cols) + [TARGET]
    table = from_arrays(columns, np.column_stack([cols[c] for c in cols] + [y]))
    report, pipeline, meta = automl.train(table, TARGET, progress=progress, **options)
    t, b = report["test"], report["baseline"]
    report["summary"] = (
        f"{report['best']['model']} predicts a neighborhood's median home value with R² {t['r2']:.2f} on "
        f"{report['test_rows']:,} neighborhoods it never saw: typically within ±${t['mae'] * UNIT:,.0f}, "
        f"against ±${b['mae'] * UNIT:,.0f} for always guessing the average."
    )
    card = registry.save_model(
        registry.BUILTIN, pipeline, report, meta, model_id=MODEL_ID, name="House price prediction",
        source="California housing: 1990 US census, 20,640 neighborhoods (scikit-learn)",
    )
    return {"model_id": card["id"]}


def status() -> dict:
    """The model card if trained; otherwise starts training (once) and returns the job."""
    try:
        card = registry.get_card(registry.BUILTIN, MODEL_ID)
        return {"status": "ready", "card": card}
    except FileNotFoundError:
        pass
    job = jobs.running(KIND) or jobs.start(registry.BUILTIN, KIND, train)
    return {"status": "training", "job": job}


def predict(inp: HouseInput) -> dict:
    raw = {COLUMNS[k]: np.array([v]) for k, v in inp.model_dump().items()}
    row = {k: float(v[0]) for k, v in _engineer(raw).items()}
    [result] = registry.predict(registry.BUILTIN, MODEL_ID, [row])
    card = registry.get_card(registry.BUILTIN, MODEL_ID)
    test = card["report"]["test"]
    out = {
        "price_usd": round(max(result["prediction"], 0.15) * UNIT, -2),
        "likely_range_usd": [round(max(v, 0.15) * UNIT, -2) for v in result.get("likely_range", [])],
        "notes": result["notes"],
        "model": card["report"]["best"]["model"],
        "test_r2": test["r2"],
        "typical_error_usd": round(test["mae"] * UNIT, -2),
    }
    if result["prediction"] >= 4.9:
        out["notes"].append("The census data stops at $500,000, so the real value may be higher.")
    return out
