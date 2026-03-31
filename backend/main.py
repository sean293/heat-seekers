import os
import tempfile
import boto3
import xarray as xr
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Heat Seekers API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize B2 client
s3 = boto3.client(
    's3',
    endpoint_url=os.environ["B2_ENDPOINT_URL"],
    aws_access_key_id=os.environ["B2_KEY_ID"],
    aws_secret_access_key=os.environ["B2_APPLICATION_KEY"]
)

BUCKET = os.environ["B2_BUCKET_NAME"]


def load_tile(year: int, month: int) -> xr.Dataset:
    """Download a monthly EXCD tile from B2 and open it with xarray."""
    key = f"tiles/excd_{year}_{month:02d}.nc"
    with tempfile.NamedTemporaryFile(suffix=".nc", delete=False) as tmp:
        try:
            s3.download_file(BUCKET, key, tmp.name)
        except Exception:
            raise HTTPException(status_code=404, detail=f"No data found for {year}-{month:02d}")
        return xr.open_dataset(tmp.name)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/test-b2")
def test_b2():
    objects = s3.list_objects_v2(Bucket=BUCKET)
    files = [obj["Key"] for obj in objects.get("Contents", [])]
    return {"files": files}


@app.get("/hsci")
def get_hsci():
    """Return the full HSCI timeseries."""
    with tempfile.NamedTemporaryFile(suffix=".nc", delete=False) as tmp:
        s3.download_file(BUCKET, "tiles/hsci_timeseries.nc", tmp.name)
        ds = xr.open_dataset(tmp.name)
        df = ds["HSCI"].to_dataframe().reset_index()
        return {"data": df.to_dict(orient="records")}


@app.get("/excd/{year}/{month}")
def get_excd(year: int, month: int):
    """Return EXCD spatial data for a given year and month."""
    ds = load_tile(year, month)
    
    # Convert to JSON-serializable format
    excd = ds["EXCD"]
    return {
        "year": year,
        "month": month,
        "x": ds["x"].values.tolist(),
        "y": ds["y"].values.tolist(),
        "time": [str(t) for t in ds["time"].values],
        "excd": excd.values.tolist()
    }


@app.get("/excd/{year}/{month}/summary")
def get_excd_summary(year: int, month: int):
    """Return a spatial mean summary for a given year and month."""
    ds = load_tile(year, month)
    summary = ds["EXCD"].mean(dim="time")
    return {
        "year": year,
        "month": month,
        "x": ds["x"].values.tolist(),
        "y": ds["y"].values.tolist(),
        "excd_mean": summary.values.tolist()
    }
