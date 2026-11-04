"""ML Lab: CSV parsing, AutoML on data with a known answer, saved models, predictions, the API.

Small synthetic datasets with a known relationship, so we can check the engine finds it, and fast
settings (few models, little tuning) so the suite stays quick.
"""
import json

import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.agent.tools import ToolContext, run_tool
from app.main import app
from app.mllab import automl, housing, jobs, registry
from app.mllab.data import from_arrays, profile, read_csv

FAST = dict(cv_folds=3, tune_iter=2, only=["Linear regression (Ridge)", "Logistic regression", "Gradient boosting"])


def headers(user="ml-alice"):
    return {"X-Internal-Key": "test-key", "X-User-Id": user}


def regression_csv(n=400, seed=1) -> bytes:
    rng = np.random.default_rng(seed)
    x1, x2 = rng.normal(size=n), rng.normal(size=n)
    city = rng.choice(["Pune", "Delhi", "Mumbai, MH"], size=n)
    y = 3 * x1 - 2 * x2 + np.select([city == "Pune", city == "Delhi"], [5, -5], 0) + rng.normal(scale=0.3, size=n)
    lines = ["id,x1,x2,city,constant,price"]
    lines += [f'r{i},{a:.4f},{b:.4f},"{c}",1,{t:.4f}' for i, (a, b, c, t) in enumerate(zip(x1, x2, city, y))]
    lines[5] = lines[5].replace(f",{x2[4]:.4f},", ",NA,")  # a missing value
    return "\n".join(lines).encode()


def classification_table(n=300, seed=2):
    rng = np.random.default_rng(seed)
    label = rng.integers(0, 2, size=n)
    a = rng.normal(loc=label * 3.0, size=n)
    b = rng.normal(size=n)
    return from_arrays(["a", "b", "label"], np.column_stack([a, b, label.astype(float)]))


def test_reads_messy_csv():
    table = read_csv(regression_csv())
    assert table.kinds["id"] == "id" and table.kinds["constant"] == "constant"
    assert table.kinds["x1"] == "numeric" and table.kinds["city"] == "categorical"
    assert "Mumbai, MH" in set(table.column("city"))  # a comma inside quotes stays part of the text
    assert table.column("x2")[4] is None  # "NA" (data row 4) is missing, not text
    semi = read_csv(("a;b\n" + "\n".join(f'"1,{i:03d}";{i}' for i in range(30))).encode())
    assert semi.column("a")[2] == 1002.0  # thousands separator
    with pytest.raises(ValueError):
        read_csv(b"a,b\n1,2\n")  # too few rows


def test_profile_finds_correlations_and_target():
    p = profile(read_csv(regression_csv()))
    assert p["suggested_target"] == "price"
    x1 = next(c for c in p["columns"] if c["name"] == "x1")
    assert x1["corr_with_target"] > 0.4 and x1["missing_pct"] == 0


def test_automl_regression_finds_the_signal():
    report, pipeline, meta = automl.train(read_csv(regression_csv()), "price", **FAST)
    assert report["task"] == "regression"
    assert {d["name"] for d in report["dropped"]} == {"id", "constant"}
    assert report["test"]["r2"] > 0.9, report["test"]
    assert report["test"]["mae"] < report["baseline"]["mae"] / 3  # far better than guessing the mean
    assert report["importance"][0]["feature"] in {"x1", "city"}
    assert report["fit_check"]["verdict"] in ("good fit", "some overfitting")
    assert len(report["leaderboard"]) == 2 and report["summary"].startswith(report["best"]["model"])
    json.dumps(report)  # everything is JSON-serializable for the API


def test_automl_classification_reports_auc_and_confusion():
    report, _, meta = automl.train(classification_table(), "label", **FAST)
    assert report["task"] == "classification" and meta["classes"] == ["0.0", "1.0"]
    assert report["test"]["accuracy"] > 0.85 and report["test"]["roc_auc"] > 0.9
    assert np.array(report["test"]["confusion"]).sum() == report["test_rows"]


def test_saved_model_predicts_and_flags_unusual_input():
    report, pipeline, meta = automl.train(read_csv(regression_csv()), "price", **FAST)
    card = registry.save_model("ml-bob", pipeline, report, meta, name="Price", source="test.csv")
    [normal, odd] = registry.predict("ml-bob", card["id"], [
        {"x1": 1, "x2": 0, "city": "Pune"},
        {"x1": 50, "city": "Chennai", "colour": "red"},
    ])
    assert abs(normal["prediction"] - 8) < 1.5  # 3*1 - 2*0 + 5
    assert normal["likely_range"][0] < normal["prediction"] < normal["likely_range"][1]
    notes = " ".join(odd["notes"])
    assert "far outside" in notes and "never appeared" in notes and "ignored" in notes and "x2" in notes
    with pytest.raises(ValueError):
        registry.predict("ml-bob", card["id"], [{"x1": "lots"}])
    with pytest.raises(FileNotFoundError):
        registry.predict("ml-eve", card["id"], [{"x1": 1}])  # models are private
    assert registry.list_runs("ml-bob")[0]["model_id"] == card["id"]  # experiment log


def test_ids_cannot_escape_the_user_folder():
    for bad in ("../x", "..", "a/b", "A"):
        with pytest.raises(ValueError):
            registry.get_card("ml-bob", bad)


def test_api_upload_train_predict_delete():
    with TestClient(app) as client:
        up = client.post("/mllab/datasets", files={"file": ("homes.csv", regression_csv(), "text/csv")}, headers=headers())
        assert up.status_code == 200, up.text
        body = up.json()
        assert body["profile"]["suggested_target"] == "price"
        assert client.post("/mllab/datasets", files={"file": ("x.exe", b"MZ", "application/octet-stream")}, headers=headers()).status_code == 415

        job = client.post(f"/mllab/datasets/{body['dataset_id']}/train", json={"target": "price", "name": "Homes"}, headers=headers()).json()
        assert client.get(f"/mllab/jobs/{job['id']}", headers=headers("ml-mallory")).status_code == 404
        done = jobs.wait(job["id"])
        assert done["status"] == "done", done
        model_id = done["result"]["model_id"]

        listed = client.get("/mllab/models", headers=headers()).json()
        assert any(m["id"] == model_id and m["name"] == "Homes" for m in listed)
        assert not any(m["id"] == model_id for m in client.get("/mllab/models", headers=headers("ml-mallory")).json())

        pred = client.post(f"/mllab/models/{model_id}/predict", json={"rows": [{"x1": 1, "x2": 0, "city": "Pune"}]}, headers=headers())
        assert pred.status_code == 200 and abs(pred.json()["predictions"][0]["prediction"] - 8) < 1.5
        assert client.post(f"/mllab/models/{model_id}/predict", json={"rows": [{"x1": "abc"}]}, headers=headers()).status_code == 422
        assert client.delete(f"/mllab/models/{model_id}", headers=headers("ml-mallory")).status_code == 404
        assert client.delete(f"/mllab/models/{model_id}", headers=headers()).status_code == 200
        assert client.get(f"/mllab/models/{model_id}", headers=headers()).status_code == 404


def _fake_housing(n=600, seed=3):
    """California-shaped columns with a known price rule (no download in tests)."""
    rng = np.random.default_rng(seed)
    names = ["MedInc", "HouseAge", "AveRooms", "AveBedrms", "Population", "AveOccup", "Latitude", "Longitude"]
    X = np.column_stack([
        rng.uniform(1, 10, n), rng.uniform(1, 52, n), rng.uniform(3, 8, n), rng.uniform(0.9, 1.3, n),
        rng.uniform(300, 3000, n), rng.uniform(1.5, 4, n), rng.uniform(33, 41, n), rng.uniform(-124, -115, n),
    ])
    y = np.clip(0.4 * X[:, 0] + 0.1 * (41 - X[:, 6]) + rng.normal(scale=0.1, size=n), 0.15, 5)
    return X, y, names


def test_house_price_project_and_agent_tool():
    housing.train(lambda m, p: None, dataset=_fake_housing(), **FAST)
    inp = housing.HouseInput(income=6, house_age=30, rooms=5.5, bedrooms=1.1, population=1500, occupancy=2.8,
                             latitude=37.8, longitude=-122.3)
    out = housing.predict(inp)
    assert abs(out["price_usd"] - (0.4 * 6 + 0.1 * 3.2) * housing.UNIT) < 40_000, out
    assert out["likely_range_usd"][0] <= out["price_usd"] <= out["likely_range_usd"][1]
    assert out["typical_error_usd"] > 0 and "R²" in registry.get_card(registry.BUILTIN, housing.MODEL_ID)["report"]["summary"]

    result, is_error = run_tool("predict_house_price", inp.model_dump(), ToolContext(user_id="ml-carol"))
    assert not is_error and json.loads(result)["price_usd"] == out["price_usd"]
    _, is_error = run_tool("predict_house_price", {**inp.model_dump(), "latitude": 90}, ToolContext(user_id="ml-carol"))
    assert is_error  # outside California: rejected by validation, not guessed
    models = json.loads(run_tool("list_ml_models", {}, ToolContext(user_id="ml-carol"))[0])["models"]
    assert models[0]["id"] == housing.MODEL_ID and models[0]["builtin"]

    with TestClient(app) as client:
        assert client.get("/mllab/house-price", headers=headers()).json()["status"] == "ready"
        r = client.post("/mllab/house-price/predict", json=inp.model_dump(), headers=headers())
        assert r.status_code == 200 and r.json()["price_usd"] == out["price_usd"]
        assert client.post("/mllab/house-price/predict", json={"income": 5}, headers=headers()).status_code == 422
