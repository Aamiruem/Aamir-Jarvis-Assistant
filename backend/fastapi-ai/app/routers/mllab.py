"""ML Lab endpoints: upload a CSV, train and compare models, predict, and the house price project.

    POST   /mllab/datasets                   upload a CSV -> dataset id + profile (EDA)
    GET    /mllab/datasets/{id}/profile      profile again for a chosen target
    POST   /mllab/datasets/{id}/train        start training -> job
    GET    /mllab/jobs/{id}                  progress / result
    GET    /mllab/models                     your models (+ built-in projects)
    GET    /mllab/models/{id}                full model card
    POST   /mllab/models/{id}/predict        predictions with input checks
    DELETE /mllab/models/{id}
    GET    /mllab/runs                       experiment log
    GET    /mllab/house-price                model card, or training progress on first use
    POST   /mllab/house-price/predict
"""
import asyncio

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.mllab import automl, data, housing, jobs, registry
from app.security import Caller, get_caller

router = APIRouter(prefix="/mllab", tags=["ml-lab"])
MAX_CSV = 20 * 1024 * 1024


def _not_found(e: Exception):
    raise HTTPException(404, str(e))


@router.post("/datasets")
async def upload_dataset(file: UploadFile = File(...), caller: Caller = Depends(get_caller)):
    if not (file.filename or "").lower().endswith((".csv", ".txt", ".tsv")):
        raise HTTPException(415, "Upload a CSV file (.csv).")
    raw = await file.read()
    if len(raw) > MAX_CSV:
        raise HTTPException(413, "The file is too large (20 MB max).")
    try:
        table = await asyncio.to_thread(data.read_csv, raw)
    except ValueError as e:
        raise HTTPException(422, str(e))
    dataset_id = registry.save_dataset(caller.user_id, raw, file.filename or "data.csv")
    return {"dataset_id": dataset_id, "filename": file.filename, "profile": data.profile(table)}


async def _table(caller: Caller, dataset_id: str):
    try:
        raw, filename = registry.load_dataset(caller.user_id, dataset_id)
    except (FileNotFoundError, ValueError) as e:
        _not_found(e)
    return await asyncio.to_thread(data.read_csv, raw), filename


@router.get("/datasets/{dataset_id}/profile")
async def dataset_profile(dataset_id: str, target: str | None = None, caller: Caller = Depends(get_caller)):
    table, _ = await _table(caller, dataset_id)
    if target and target not in table.columns:
        raise HTTPException(422, f"No column named '{target}'.")
    return data.profile(table, target)


class TrainRequest(BaseModel):
    target: str = Field(..., min_length=1, max_length=200)
    name: str = Field("", max_length=120)


@router.post("/datasets/{dataset_id}/train")
async def train_dataset(dataset_id: str, body: TrainRequest, caller: Caller = Depends(get_caller)):
    table, filename = await _table(caller, dataset_id)
    if body.target not in table.columns:
        raise HTTPException(422, f"No column named '{body.target}'.")
    name = body.name.strip() or f"Predict {body.target}"

    def run(progress):
        report, pipeline, meta = automl.train(table, body.target, progress=progress)
        card = registry.save_model(caller.user_id, pipeline, report, meta, name=name, source=filename)
        return {"model_id": card["id"]}

    return jobs.start(caller.user_id, "train", run)


@router.get("/jobs/{job_id}")
async def job_status(job_id: str, caller: Caller = Depends(get_caller)):
    job = jobs.get(caller.user_id, job_id)
    if not job:
        raise HTTPException(404, "Job not found.")
    return job


@router.get("/models")
async def models(caller: Caller = Depends(get_caller)):
    return registry.list_models(caller.user_id)


@router.get("/models/{model_id}")
async def model_card(model_id: str, caller: Caller = Depends(get_caller)):
    try:
        return registry.get_card(caller.user_id, model_id)
    except (FileNotFoundError, ValueError) as e:
        _not_found(e)


class PredictRequest(BaseModel):
    rows: list[dict] = Field(..., min_length=1, max_length=1000)


@router.post("/models/{model_id}/predict")
async def predict(model_id: str, body: PredictRequest, caller: Caller = Depends(get_caller)):
    try:
        return {"predictions": await asyncio.to_thread(registry.predict, caller.user_id, model_id, body.rows)}
    except FileNotFoundError as e:
        _not_found(e)
    except ValueError as e:
        raise HTTPException(422, str(e))


@router.delete("/models/{model_id}")
async def delete_model(model_id: str, caller: Caller = Depends(get_caller)):
    try:
        if not registry.delete_model(caller.user_id, model_id):
            raise HTTPException(404, "Model not found (built-in models can't be deleted).")
    except ValueError as e:
        _not_found(e)
    return {"deleted": True}


@router.get("/runs")
async def runs(caller: Caller = Depends(get_caller)):
    return registry.list_runs(caller.user_id)


@router.get("/house-price")
async def house_price_status():
    status = housing.status()
    status["fields"] = housing.HouseInput.model_json_schema()["properties"]
    return status


@router.post("/house-price/predict")
async def house_price_predict(body: housing.HouseInput):
    if housing.status()["status"] != "ready":
        raise HTTPException(409, "The house price model is still training. Try again in a few minutes.")
    return await asyncio.to_thread(housing.predict, body)
