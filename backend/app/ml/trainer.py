from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import math

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder

try:
    from xgboost import XGBClassifier, XGBRegressor

    _HAS_XGB = True
except ImportError:  # pragma: no cover
    XGBClassifier = None  # type: ignore[misc, assignment]
    XGBRegressor = None  # type: ignore[misc, assignment]
    _HAS_XGB = False


CAT_COLS = [
    "lead_source",
    "prev_outcome",
    "occupation",
    "education",
    "dataset_source",
    "lead_source_std",
    "prev_outcome_std",
]

NUM_COLS = [
    "engagement_score",
    "num_contacts",
    "age",
    "num_prev_contacts",
    "days_since_last_contact",
    "contact_intensity",
    "recency_score",
    "had_prev_contact",
]


def train_bundle(csv_path: Path, max_rows: int, random_state: int = 42) -> dict:
    df = pd.read_csv(csv_path)
    if len(df) > max_rows:
        df = df.sample(max_rows, random_state=random_state)

    X = df[CAT_COLS + NUM_COLS].copy()
    y_score = df["lead_score"].astype(float)
    y_conv = df["converted"].astype(int)

    stratify_label = y_conv if len(y_conv.unique()) > 1 else None
    X_train, X_test, y_score_train, y_score_test, y_conv_train, y_conv_test = train_test_split(
        X,
        y_score,
        y_conv,
        test_size=0.20,
        random_state=random_state,
        stratify=stratify_label,
    )

    preprocess = ColumnTransformer(
        transformers=[
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CAT_COLS,
            ),
            ("num", "passthrough", NUM_COLS),
        ]
    )

    X_train_t = preprocess.fit_transform(X_train)
    X_test_t = preprocess.transform(X_test)

    if _HAS_XGB:
        reg = XGBRegressor(
            n_estimators=160,
            max_depth=8,
            learning_rate=0.06,
            subsample=0.85,
            colsample_bytree=0.85,
            random_state=random_state,
            n_jobs=-1,
        )
        clf = XGBClassifier(
            n_estimators=160,
            max_depth=8,
            learning_rate=0.06,
            subsample=0.85,
            colsample_bytree=0.85,
            random_state=random_state,
            n_jobs=-1,
            eval_metric="logloss",
        )
        scorer = "xgboost"
    else:
        reg = RandomForestRegressor(
            n_estimators=80,
            max_depth=16,
            random_state=random_state,
            n_jobs=-1,
        )
        clf = RandomForestClassifier(
            n_estimators=80,
            max_depth=16,
            random_state=random_state,
            n_jobs=-1,
        )
        scorer = "random_forest"

    reg.fit(X_train_t, y_score_train)
    clf.fit(X_train_t, y_conv_train)

    y_conv_pred = clf.predict(X_test_t)
    y_score_pred = reg.predict(X_test_t)
    accuracy = float(accuracy_score(y_conv_test, y_conv_pred))
    rmse = float(math.sqrt(mean_squared_error(y_score_test, y_score_pred)))
    r2 = float(r2_score(y_score_test, y_score_pred))

    defaults: dict = {"dataset_source": "live_crm"}
    for c in NUM_COLS:
        defaults[c] = float(df[c].median())
    for c in CAT_COLS:
        mode = df[c].mode(dropna=True)
        defaults[c] = str(mode.iloc[0]) if len(mode) else "unknown"

    # Segmental Analysis: Calculate accuracy by dataset_source
    segmental_metrics = {}
    if "dataset_source" in X_test.columns:
        for source in X_test["dataset_source"].unique():
            mask = X_test["dataset_source"] == source
            if mask.sum() > 0:
                seg_accuracy = accuracy_score(y_conv_test[mask], y_conv_pred[mask])
                segmental_metrics[str(source)] = {"accuracy_pct": round(100.0 * float(seg_accuracy), 2), "rows": int(mask.sum())}

    return {
        "preprocess": preprocess,
        "reg": reg,
        "clf": clf,
        "cat_cols": CAT_COLS,
        "num_cols": NUM_COLS,
        "defaults": defaults,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "n_rows": int(len(df)),
        "test_rows": int(len(X_test)),
        "source_csv": str(csv_path.resolve()),
        "scorer": scorer,
        "accuracy_pct": round(100.0 * accuracy, 2),
        "score_rmse": round(rmse, 2),
        "score_r2": round(r2, 3),
        "segmental_metrics": segmental_metrics,
    }


def save_bundle(bundle: dict, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, path, compress=3)


def load_bundle(path: Path) -> dict:
    return joblib.load(path)
