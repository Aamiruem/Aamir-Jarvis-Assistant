"""Second flagship project: crop yield prediction.

Data: "Crop Yield Prediction Dataset" on Kaggle (patelris/crop-yield-prediction-dataset), built from FAO
and World Bank figures: 101 countries, 10 crops, 1990 to 2013. It is downloaded once (no Kaggle
login needed) and cached under data/crop/.

One cleanup matters for an honest score: yield_df.csv has 28,242 rows but only 13,130 distinct
(country, crop, year) records. Big countries repeat each record once per weather station (up to 22
times, same yield, slightly different temperature). Left in, a random train/test split puts copies of
the same record on both sides and the test score looks far better than it is. We merge them,
averaging the temperature.

Yield is in hg/ha in the source; we show tonnes per hectare (10,000 hg/ha = 1 t/ha).
"""
import csv
import io
import threading
import urllib.request
import zipfile
from collections import defaultdict

import numpy as np
from pydantic import BaseModel, Field

from app.config import settings
from app.mllab import automl, jobs, registry
from app.mllab.data import Table, infer_kind

MODEL_ID = "crop-yield"
KIND = "crop-yield"
TARGET = "Yield_hg_per_ha"
PER_TONNE = 10_000  # hg/ha per t/ha
SOURCE_URL = "https://www.kaggle.com/api/v1/datasets/download/patelris/crop-yield-prediction-dataset"
SOURCE_PAGE = "https://www.kaggle.com/datasets/patelris/crop-yield-prediction-dataset"
FEATURES = ["Country", "Crop", "Year", "Rainfall_mm", "Pesticides_tonnes", "Avg_temp_C"]

_lock = threading.Lock()
_records_cache: list[dict] | None = None


class CropInput(BaseModel):
    """One crop in one country and year, as in the FAO / World Bank data the model learned from."""
    country: str = Field(..., min_length=2, max_length=60, description="Country, e.g. India, Pakistan, Brazil (101 countries in the data)")
    crop: str = Field(..., min_length=3, max_length=40, description="One of: Cassava, Maize, Plantains and others, Potatoes, Rice, paddy, Sorghum, Soybeans, Sweet potatoes, Wheat, Yams")
    year: int = Field(..., ge=1980, le=2035, description="Year; the data covers 1990 to 2013")
    rainfall_mm: float = Field(..., ge=0, le=5000, description="Average rainfall in the country, mm per year")
    pesticides_tonnes: float = Field(..., ge=0, le=1_000_000, description="Pesticides used in the whole country that year, tonnes")
    avg_temp_c: float = Field(..., ge=-10, le=40, description="Average temperature, °C")


# ---------- data ----------

def _download() -> bytes:
    """yield_df.csv bytes, from the cache or Kaggle."""
    path = settings.data_dir / "crop" / "yield_df.csv"
    if path.exists():
        return path.read_bytes()
    req = urllib.request.Request(SOURCE_URL, headers={"User-Agent": "Azarvis-MLLab/1.0"})
    with urllib.request.urlopen(req, timeout=120) as r:
        archive = r.read()
    with zipfile.ZipFile(io.BytesIO(archive)) as z:
        raw = z.read("yield_df.csv")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(raw)
    return raw


def parse(raw: bytes) -> list[dict]:
    """yield_df.csv -> one record per (country, crop, year), weather-station duplicates merged."""
    groups: dict[tuple, list[dict]] = defaultdict(list)
    for r in csv.DictReader(io.StringIO(raw.decode("utf-8-sig"))):
        try:
            groups[(r["Area"].strip(), r["Item"].strip(), int(r["Year"]))].append(r)
        except (KeyError, ValueError):
            continue
    records = []
    for (country, crop, year), rs in groups.items():
        try:
            records.append({
                "Country": country, "Crop": crop, "Year": float(year),
                "Rainfall_mm": float(rs[0]["average_rain_fall_mm_per_year"]),
                "Pesticides_tonnes": float(rs[0]["pesticides_tonnes"]),
                "Avg_temp_C": round(float(np.mean([float(x["avg_temp"]) for x in rs])), 2),
                TARGET: float(np.median([float(x["hg/ha_yield"]) for x in rs])),
            })
        except (KeyError, ValueError):
            continue
    if len(records) < 100:
        raise ValueError("The crop yield file didn't have the expected columns.")
    return records


def load_records() -> list[dict]:
    global _records_cache
    with _lock:
        if _records_cache is None:
            _records_cache = parse(_download())
        return _records_cache


def to_table(records: list[dict]) -> Table:
    columns = FEATURES + [TARGET]
    table = Table(columns, np.array([[r[c] for c in columns] for r in records], dtype=object))
    table.kinds = {c: infer_kind(table.column(c)) for c in columns}
    table.kinds["Country"] = table.kinds["Crop"] = "categorical"  # 101 countries: a category, not an ID
    return table


def countries(records: list[dict]) -> dict:
    """Per country: crops grown and the latest year's weather and pesticide figures (form defaults)."""
    out: dict[str, dict] = {}
    for r in records:
        c = out.setdefault(r["Country"], {"crops": set(), "year": 0})
        c["crops"].add(r["Crop"])
        if r["Year"] >= c["year"]:
            c.update(year=int(r["Year"]), rainfall_mm=r["Rainfall_mm"], pesticides_tonnes=r["Pesticides_tonnes"], avg_temp_c=r["Avg_temp_C"])
    return {k: {**v, "crops": sorted(v["crops"])} for k, v in sorted(out.items())}


# ---------- training and prediction ----------

def train(progress, *, records=None, **options) -> dict:
    progress("Downloading the crop yield data from Kaggle (first time only)", 2)
    records = records or load_records()
    table = to_table(records)
    options.setdefault("max_categories", 120)  # keep every country as its own category
    report, pipeline, meta = automl.train(table, TARGET, progress=progress, **options)
    t, b = report["test"], report["baseline"]
    report["summary"] = (
        f"{report['best']['model']} predicts a crop's yield with R² {t['r2']:.2f} on {report['test_rows']:,} "
        f"country-crop-years it never saw: typically within ±{t['mae'] / PER_TONNE:.2f} t/ha, against "
        f"±{b['mae'] / PER_TONNE:.2f} t/ha for always guessing the average. The test years are new, but the model "
        f"has seen other years of the same country and crop, so this measures filling gaps, not forecasting."
    )
    card = registry.save_model(
        registry.BUILTIN, pipeline, report, meta, model_id=MODEL_ID, name="Crop yield prediction",
        source=f"Kaggle: Crop Yield Prediction Dataset (FAO + World Bank, 1990 to 2013), {len(records):,} records after merging duplicates. {SOURCE_PAGE}",
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


def _match(value: str, options) -> str | None:
    """Case-insensitive name match ('rice' -> 'Rice, paddy', 'potato' -> 'Potatoes')."""
    v = value.strip().lower()
    options = list(options)
    for o in options:
        if o.lower() == v:
            return o
    hits = [o for o in options if o.lower().startswith(v) or v in o.lower()]
    return hits[0] if len(hits) == 1 else None


def predict(inp: CropInput) -> dict:
    card = registry.get_card(registry.BUILTIN, MODEL_ID)
    stats = card["meta"]["stats"]
    country = _match(inp.country, stats["Country"]["categories"])
    crop = _match(inp.crop, stats["Crop"]["categories"])
    if crop is None:
        raise ValueError(f"'{inp.crop}' isn't one of the 10 crops in the data: {', '.join(stats['Crop']['categories'])}.")
    if country is None:
        raise ValueError(f"'{inp.country}' isn't one of the 101 countries in the data.")
    row = {"Country": country, "Crop": crop, "Year": float(inp.year), "Rainfall_mm": inp.rainfall_mm,
           "Pesticides_tonnes": inp.pesticides_tonnes, "Avg_temp_C": inp.avg_temp_c}
    [result] = registry.predict(registry.BUILTIN, MODEL_ID, [row])
    test = card["report"]["test"]
    t_ha = lambda v: round(max(v, 50) / PER_TONNE, 2)  # noqa: E731  (50 hg/ha is the lowest yield in the data)
    out = {
        "country": country, "crop": crop,
        "yield_t_per_ha": t_ha(result["prediction"]),
        "likely_range_t_per_ha": [t_ha(v) for v in result.get("likely_range", [])],
        "notes": result["notes"],
        "model": card["report"]["best"]["model"],
        "test_r2": test["r2"],
        "typical_error_t_per_ha": round(test["mae"] / PER_TONNE, 2),
    }
    try:
        grown = countries(load_records()).get(country, {}).get("crops", [])
        if grown and crop not in grown:
            out["notes"].append(f"The data has no {crop} records for {country}, so this is a rough guess from other countries.")
    except Exception:  # records unavailable offline: the prediction itself still stands
        pass
    if inp.year > 2013:
        out["notes"].append("The data ends in 2013; later years are an extrapolation.")
    return out
