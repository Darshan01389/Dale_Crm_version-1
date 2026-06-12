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

# Rare categories with fewer than this many occurrences get grouped into "__rare__"
RARE_THRESHOLD = 10


def _group_rare_categories(df: pd.DataFrame, cols: list[str], threshold: int = RARE_THRESHOLD) -> tuple[pd.DataFrame, dict[str, list[str]]]:
    """
    Replaces low-frequency categorical values with '__rare__' to reduce
    cardinality, prevent overfitting on sparse categories and improve
    generalisation to unseen values at inference time.

    Returns the modified DataFrame and a dict mapping each column to
    the list of values that were grouped as rare (for reproducibility).
    """
    rare_map: dict[str, list[str]] = {}
    df = df.copy()
    for col in cols:
        if col not in df.columns:
            continue
        counts = df[col].value_counts()
        rare_vals = counts[counts < threshold].index.tolist()
        if rare_vals:
            df[col] = df[col].apply(lambda v: "__rare__" if v in rare_vals else v)
            rare_map[col] = rare_vals
    return df, rare_map


def train_bundle(csv_path: Path, max_rows: int, random_state: int = 42) -> dict:
    df = pd.read_csv(csv_path)
    if len(df) > max_rows:
        df = df.sample(max_rows, random_state=random_state)

    # ── Rare category grouping ────────────────────────────────────────────────
    # Groups infrequent categorical values before encoding so that the model
    # is not forced to memorise noise from rare / one-off categories.
    # This directly reduces overfitting risk on sparse categoricals.
    df, rare_map = _group_rare_categories(df, CAT_COLS, RARE_THRESHOLD)

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

    n_samples = len(X_train_t)

    if _HAS_XGB:
        # ── XGBoost with regularization ───────────────────────────────────────
        # reg_alpha (L1), reg_lambda (L2): penalise large leaf weights to reduce
        # overfitting; values tuned proportionally to training set size.
        # min_child_weight: minimum sum of instance weights in a child; larger
        # values force each leaf split to be supported by more samples, reducing
        # variance on small datasets.
        # max_delta_step: caps the weight update magnitude, which improves
        # stability especially on imbalanced class distributions.
        reg = XGBRegressor(
            n_estimators=200,
            max_depth=5,          # shallower trees → less overfitting
            learning_rate=0.05,
            subsample=0.80,
            colsample_bytree=0.80,
            reg_alpha=0.1,        # L1 regularization
            reg_lambda=1.5,       # L2 regularization (stronger with small data)
            min_child_weight=max(3, n_samples // 200),
            random_state=random_state,
            n_jobs=-1,
        )
        clf = XGBClassifier(
            n_estimators=200,
            max_depth=5,
            learning_rate=0.05,
            subsample=0.80,
            colsample_bytree=0.80,
            reg_alpha=0.1,
            reg_lambda=1.5,
            min_child_weight=max(3, n_samples // 200),
            max_delta_step=1,     # helps with class imbalance
            scale_pos_weight=max(1, (y_conv_train == 0).sum() / max(1, (y_conv_train == 1).sum())),
            random_state=random_state,
            n_jobs=-1,
            eval_metric="logloss",
        )
        scorer = "xgboost"
    else:
        # ── RandomForest with regularization ─────────────────────────────────
        # min_samples_leaf: prevents leaves that represent too few samples,
        # a primary defence against overfitting in random forests.
        # max_features: limits features per split to increase diversity of
        # individual trees, which reduces variance of the ensemble.
        reg = RandomForestRegressor(
            n_estimators=150,
            max_depth=10,
            min_samples_leaf=max(2, n_samples // 300),
            max_features="sqrt",
            random_state=random_state,
            n_jobs=-1,
        )
        clf = RandomForestClassifier(
            n_estimators=150,
            max_depth=10,
            min_samples_leaf=max(2, n_samples // 300),
            max_features="sqrt",
            class_weight="balanced",  # handles class imbalance automatically
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
                segmental_metrics[str(source)] = {
                    "accuracy_pct": round(100.0 * float(seg_accuracy), 2),
                    "rows": int(mask.sum()),
                }

    return {
        "preprocess": preprocess,
        "reg": reg,
        "clf": clf,
        "cat_cols": CAT_COLS,
        "num_cols": NUM_COLS,
        "defaults": defaults,
        "rare_map": rare_map,          # stored for inference-time rare grouping
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
