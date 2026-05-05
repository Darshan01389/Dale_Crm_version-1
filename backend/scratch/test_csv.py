
import pandas as pd
from app.core.config import settings
from pathlib import Path

csv_path = Path(settings.MERGED_LEAD_DATASET_PATH)
print(f"Path: {csv_path}")
print(f"Exists: {csv_path.exists()}")
if csv_path.exists():
    df = pd.read_csv(csv_path)
    print(f"Rows: {len(df)}")
    print(f"Columns: {df.columns.tolist()}")
