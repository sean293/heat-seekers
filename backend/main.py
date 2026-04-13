import os
import json
import tempfile
import boto3
import xarray as xr
import numpy as np
import psutil
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Heat Seekers API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    max_age=3600,
)

# Initialize B2 client
s3 = boto3.client(
    's3',
    endpoint_url=os.environ["B2_ENDPOINT_URL"],
    aws_access_key_id=os.environ["B2_KEY_ID"],
    aws_secret_access_key=os.environ["B2_APPLICATION_KEY"]
)

BUCKET = os.environ["B2_BUCKET_NAME"]


def log_memory(label: str):
    process = psutil.Process(os.getpid())
    mb = process.memory_info().rss / 1024 / 1024
    print(f"[MEMORY] {label}: {mb:.1f} MB")


def load_tile(year: int, month: int) -> xr.Dataset:
    """Download a monthly EXCD tile from B2 and open it with xarray."""
    key = f"tiles/excd_{year}_{month:02d}.nc"
    tmp = tempfile.NamedTemporaryFile(suffix=".nc", delete=False)
    tmp_path = tmp.name
    tmp.close()

    try:
        s3.download_file(BUCKET, key, tmp_path)
    except Exception:
        raise HTTPException(
            status_code=404,
            detail=f"No data found for {year}-{month:02d}"
        )

    return xr.open_dataset(tmp_path)


@app.get("/health")
def health():
    log_memory("health check")
    return {"status": "ok"}


@app.get("/test-b2")
def test_b2():
    objects = s3.list_objects_v2(Bucket=BUCKET)
    files = [obj["Key"] for obj in objects.get("Contents", [])]
    return {"files": files}

@app.get("/test-summaries")
def test_summaries():
    objects = s3.list_objects_v2(Bucket=BUCKET, Prefix="summaries/")
    files = [obj["Key"] for obj in objects.get("Contents", [])]
    return {"count": len(files), "files": files[:10]}


@app.get("/hsci")
def get_hsci():
    """Return the full HSCI timeseries."""
    log_memory("hsci start")
    with tempfile.NamedTemporaryFile(suffix=".nc", delete=False) as tmp:
        s3.download_file(BUCKET, "tiles/hsci_timeseries.nc", tmp.name)
        ds = xr.open_dataset(tmp.name)
        df = ds["HSCI"].to_dataframe().reset_index()
        result = {"data": df.to_dict(orient="records")}
        ds.close()
        log_memory("hsci end")
        return result


@app.get("/excd/{year}/{month}")
def get_excd(year: int, month: int):
    """Return EXCD spatial data for a given year and month."""
    log_memory(f"excd {year}-{month:02d} start")
    ds = load_tile(year, month)
    excd = ds["EXCD"]
    result = {
        "year": year,
        "month": month,
        "x": ds["x"].values.tolist(),
        "y": ds["y"].values.tolist(),
        "time": [str(t) for t in ds["time"].values],
        "excd": excd.values.tolist()
    }
    ds.close()
    log_memory(f"excd {year}-{month:02d} end")
    return result


@app.get("/excd/{year}/{month}/summary")
def get_excd_summary(year: int, month: int):
    """
    Serve precomputed monthly summary JSON from B2.
    Near-zero memory overhead — no xarray or numpy computation.
    """
    log_memory(f"summary {year}-{month:02d} start")
    key = f"summaries/excd_{year}_{month:02d}_summary.json"
    try:
        response = s3.get_object(Bucket=BUCKET, Key=key)
        data = json.loads(response["Body"].read())
        log_memory(f"summary {year}-{month:02d} end")
        return data
    except Exception:
        raise HTTPException(
            status_code=404,
            detail=f"No precomputed summary for {year}-{month:02d}"
        )


@app.get("/excd/{year}/{month}/summary/legacy")
def get_excd_summary_legacy(year: int, month: int):
    """
    Original summary endpoint — computes mean from raw tile.
    Kept for reference but may exceed 512MB for busy months [1].
    """
    log_memory("legacy start")
    ds = load_tile(year, month)
    log_memory("legacy after load_tile")
    summary = ds["EXCD"].mean(dim="time").load()
    log_memory("legacy after mean")
    values = summary.values
    cleaned = np.where(np.isnan(values), None, values).tolist()
    log_memory("legacy after cleaned")
    x = ds["x"].values.tolist()
    y = ds["y"].values.tolist()
    ds.close()
    log_memory("legacy after close")
    return {
        "year": year,
        "month": month,
        "x": x,
        "y": y,
        "excd_mean": cleaned
    }


@app.get("/excd/{year}/{month}/summary/chunked")
def get_excd_summary_chunked(year: int, month: int):
    """
    Chunked summary endpoint — lower memory than legacy but still
    uses xarray. Kept for reference [1].
    """
    log_memory("chunked start")
    ds = load_tile(year, month)
    log_memory("chunked after load_tile")
    excd = ds["EXCD"]
    n_x = len(ds["x"])
    chunk_size = 100
    result_rows = []

    for i in range(0, n_x, chunk_size):
        chunk = excd.isel(x=slice(i, i + chunk_size)).values
        row_means = np.nanmean(chunk, axis=0)
        result_rows.append(row_means)

    values = np.vstack(result_rows)
    log_memory("chunked after mean")
    cleaned = np.where(np.isnan(values), None, values).tolist()
    x = ds["x"].values.tolist()
    y = ds["y"].values.tolist()
    ds.close()
    log_memory("chunked after close")
    return {
        "year": year,
        "month": month,
        "x": x,
        "y": y,
        "excd_mean": cleaned
    }