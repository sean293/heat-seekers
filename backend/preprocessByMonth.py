import os
import json
import tempfile
import boto3
import xarray as xr
import numpy as np

s3 = boto3.client(
    's3',
    endpoint_url=os.environ["B2_ENDPOINT_URL"],
    aws_access_key_id=os.environ["B2_KEY_ID"],
    aws_secret_access_key=os.environ["B2_APPLICATION_KEY"]
)

BUCKET = os.environ["B2_BUCKET_NAME"]

for year in range(1981, 2022):
    for month in [5, 6, 7, 8, 9]:
        print(f"Processing {year}-{month:02d}...")
        
        key = f"tiles/excd_{year}_{month:02d}.nc"
        tmp = tempfile.NamedTemporaryFile(suffix=".nc", delete=False)
        tmp_path = tmp.name
        tmp.close()
        
        try:
            s3.download_file(BUCKET, key, tmp_path)
        except Exception as e:
            print(f"  Skipping {year}-{month:02d}: {e}")
            continue
        
        ds = xr.open_dataset(tmp_path)
        summary = ds["EXCD"].mean(dim="time").load()
        values = summary.values
        cleaned = np.where(np.isnan(values), None, values).tolist()
        
        result = {
            "year": year,
            "month": month,
            "x": ds["x"].values.tolist(),
            "y": ds["y"].values.tolist(),
            "excd_mean": cleaned
        }
        
        ds.close()
        os.unlink(tmp_path)
        
        summary_key = f"summaries/excd_summary_{year}_{month:02d}.json"
        s3.put_object(
            Bucket=BUCKET,
            Key=summary_key,
            Body=json.dumps(result),
            ContentType="application/json"
        )
        
        print(f"  Done {year}-{month:02d}")

print("All done!")