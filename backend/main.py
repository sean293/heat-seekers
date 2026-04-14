import os
import json
import tempfile
import boto3
import xarray as xr
import numpy as np
import psutil
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from functools import lru_cache
from fastapi.responses import Response
import gc
from fastapi.responses import StreamingResponse
import io
import csv

app = FastAPI(title="Heat Seekers API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    max_age=3600,
)

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
    log_memory("hsci start")
    with tempfile.NamedTemporaryFile(suffix=".nc", delete=False) as tmp:
        s3.download_file(BUCKET, "tiles/hsci_timeseries.nc", tmp.name)
        ds = xr.open_dataset(tmp.name)
        df = ds["HSCI"].to_dataframe().reset_index()
        result = {"data": df.to_dict(orient="records")}
        ds.close()
        log_memory("hsci end")
        return result


@lru_cache(maxsize=10)
def get_summary_cached(year: int, month: int) -> bytes:
    key = f"summaries/excd_{year}_{month:02d}_summary.json"
    response = s3.get_object(Bucket=BUCKET, Key=key)
    return response["Body"].read()


@app.get("/excd/{year}/{month}/summary")
def get_excd_summary(year: int, month: int):
    log_memory(f"summary {year}-{month:02d} start")
    try:
        raw = get_summary_cached(year, month)
        log_memory(f"summary {year}-{month:02d} end")
        gc.collect()
        return Response(content=raw, media_type="application/json")
    except Exception as e:
        print(f"[DEBUG] S3 error: {str(e)}")
        raise HTTPException(
            status_code=404,
            detail=f"No precomputed summary for {year}-{month:02d}"
        )


@app.get("/excd/range/summary")
def get_excd_range_summary(
    start_year: int,
    start_month: int,
    end_year: int,
    end_month: int
):
    """Average precomputed summaries over a date range. Memory safe."""
    if start_year < 1981 or end_year > 2021:
        raise HTTPException(status_code=400, detail="Data only available from 1981-2021")
    if start_month < 5 or start_month > 9 or end_month < 5 or end_month > 9:
        raise HTTPException(status_code=400, detail="Months must be between 5 (May) and 9 (Sep)")

    # Build list of (year, month) pairs in range
    tiles = []
    for year in range(start_year, end_year + 1):
        for month in [5, 6, 7, 8, 9]:
            if year == start_year and month < start_month:
                continue
            if year == end_year and month > end_month:
                continue
            tiles.append((year, month))

    if not tiles:
        raise HTTPException(status_code=400, detail="No valid tiles in requested range")
    if len(tiles) > 50:
        raise HTTPException(
            status_code=400,
            detail=f"Range too large ({len(tiles)} tiles). Please request 50 months or fewer."
        )

    log_memory("range start")
    accumulator = None
    count = None
    x_coords = None
    y_coords = None

    for year, month in tiles:
        try:
            raw = get_summary_cached(year, month)
            data = json.loads(raw)
        except Exception:
            continue

        if x_coords is None:
            x_coords = data["x"]
            y_coords = data["y"]
            n_x = len(x_coords)
            n_y = len(y_coords)
            accumulator = np.zeros((n_x, n_y), dtype=np.float32)
            count = np.zeros((n_x, n_y), dtype=np.float32)

        for xi, row in enumerate(data["excd_mean"]):
            for yi, val in enumerate(row):
                if val is not None:
                    accumulator[xi, yi] += val
                    count[xi, yi] += 1

        del data
        gc.collect()

    log_memory("range after accumulation")

    if accumulator is None:
        raise HTTPException(status_code=404, detail="No data found for requested range")

    with np.errstate(invalid="ignore"):
        result = np.where(count > 0, accumulator / count, np.nan)

    cleaned = np.where(np.isnan(result), None, result).tolist()
    del accumulator, count, result
    gc.collect()
    log_memory("range end")

    return {
        "start_year": start_year,
        "start_month": start_month,
        "end_year": end_year,
        "end_month": end_month,
        "tiles_processed": len(tiles),
        "x": x_coords,
        "y": y_coords,
        "excd_mean": cleaned
    }


@app.get("/excd/{year}/{month}")
def get_excd(year: int, month: int):
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

@app.get("/excd/range/download")
def download_excd_range(
    start_year: int,
    start_month: int,
    end_year: int,
    end_month: int
):
    """Download averaged EXCD data for a date range as CSV."""
    if start_year < 1981 or end_year > 2021:
        raise HTTPException(status_code=400, detail="Data only available from 1981-2021")
    if start_month < 5 or start_month > 9 or end_month < 5 or end_month > 9:
        raise HTTPException(status_code=400, detail="Months must be between 5 and 9")

    tiles = []
    for year in range(start_year, end_year + 1):
        for month in [5, 6, 7, 8, 9]:
            if year == start_year and month < start_month:
                continue
            if year == end_year and month > end_month:
                continue
            tiles.append((year, month))

    if not tiles:
        raise HTTPException(status_code=400, detail="No valid tiles in range")
    if len(tiles) > 50:
        raise HTTPException(status_code=400, detail="Range too large. Max 50 months.")

    accumulator = None
    count = None
    x_coords = None
    y_coords = None

    for year, month in tiles:
        try:
            raw = get_summary_cached(year, month)
            data = json.loads(raw)
        except Exception:
            continue

        if x_coords is None:
            x_coords = data["x"]
            y_coords = data["y"]
            n_x = len(x_coords)
            n_y = len(y_coords)
            accumulator = np.zeros((n_x, n_y), dtype=np.float32)
            count = np.zeros((n_x, n_y), dtype=np.float32)

        for xi, row in enumerate(data["excd_mean"]):
            for yi, val in enumerate(row):
                if val is not None:
                    accumulator[xi, yi] += val
                    count[xi, yi] += 1

        del data
        gc.collect()

    if accumulator is None:
        raise HTTPException(status_code=404, detail="No data found for range")

    with np.errstate(invalid="ignore"):
        result = np.where(count > 0, accumulator / count, np.nan)

    # Build CSV
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "longitude",
        "latitude", 
        "excd_mean",
        "start_year",
        "start_month",
        "end_year",
        "end_month",
        "months_averaged"
    ])

    for xi, x in enumerate(x_coords):
        for yi, y in enumerate(y_coords):
            val = result[xi, yi]
            if not np.isnan(val):
                writer.writerow([
                    round(float(x), 4),
                    round(float(y), 4),
                    round(float(val), 4),
                    start_year,
                    start_month,
                    end_year,
                    end_month,
                    len(tiles)
                ])

    output.seek(0)
    filename = f"excd_{start_year}_{start_month:02d}_to_{end_year}_{end_month:02d}.csv"
    
    del accumulator, count, result
    gc.collect()

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


@app.get("/excd/{year}/{month}/download")
def download_excd_month(year: int, month: int):
    """Download a single month EXCD summary as CSV."""
    key = f"summaries/excd_{year}_{month:02d}_summary.json"
    try:
        response = s3.get_object(Bucket=BUCKET, Key=key)
        data = json.loads(response["Body"].read())
    except Exception:
        raise HTTPException(status_code=404, detail=f"No data for {year}-{month:02d}")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["longitude", "latitude", "excd_mean", "year", "month"])

    for xi, x in enumerate(data["x"]):
        for yi, y in enumerate(data["y"]):
            val = data["excd_mean"][xi][yi]
            if val is not None:
                writer.writerow([
                    round(float(x), 4),
                    round(float(y), 4),
                    round(float(val), 4),
                    year,
                    month
                ])

    output.seek(0)
    filename = f"excd_{year}_{month:02d}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )