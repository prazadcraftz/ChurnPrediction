import pandas as pd
import numpy as np
from scipy import stats
from typing import List, Dict, Any, Tuple

def analyze_churn_drivers(df: pd.DataFrame, mapping: Dict[str, str]) -> List[Dict[str, Any]]:
    drivers = []
    churn_col = mapping.get("churn_label", "")
    cust_id_col = mapping.get("customer_id", "")

    ignore_cols = {"is_churn", churn_col, cust_id_col}

    for col in df.columns:
        if col in ignore_cols or not col:
            continue

        series = df[col]
        nunique = series.nunique()
        if nunique < 2 or nunique > 60:
            continue

        try:
            contingency = pd.crosstab(df[col].astype(str), df["is_churn"])
            if contingency.shape[0] < 2 or contingency.shape[1] < 2:
                continue

            chi2, p_val, dof, ex = stats.chi2_contingency(contingency)

            # Cramér's V strength score
            n = len(df)
            min_dim = min(contingency.shape) - 1
            strength = np.sqrt(chi2 / (n * max(1, min_dim))) if n > 0 and min_dim > 0 else 0.0

            # Breakdown per category
            grouped = df.groupby(col)["is_churn"].agg(
                count='count',
                churn_rate=lambda x: (x.sum() / len(x)) * 100 if len(x) > 0 else 0
            ).reset_index()

            breakdown = []
            for _, row in grouped.iterrows():
                breakdown.append({
                    "category": str(row[col]),
                    "churn_rate": float(round(row["churn_rate"], 2)),
                    "count": int(row["count"])
                })

            breakdown.sort(key=lambda x: x["churn_rate"], reverse=True)

            drivers.append({
                "factor_name": str(col),
                "strength_score": float(round(min(1.0, strength), 2)),
                "p_value": float(round(p_val, 6)),
                "is_statistically_significant": bool(p_val < 0.05),
                "breakdown": breakdown[:8]
            })
        except Exception:
            continue

    drivers.sort(key=lambda x: x["strength_score"], reverse=True)
    return drivers[:6]

def build_tenure_curve(df: pd.DataFrame, mapping: Dict[str, str]) -> Tuple[List[Dict[str, Any]], str]:
    tenure_col = mapping.get("tenure")
    revenue_col = mapping.get("monthly_revenue")

    target_col = None
    if tenure_col and tenure_col in df.columns and pd.api.types.is_numeric_dtype(df[tenure_col]):
        target_col = tenure_col
        title = f"Lifecycle Churn Curve & Revenue Lost by {tenure_col}"
    else:
        # Fall back to finding any numeric column (e.g. Age, Balance, or index)
        for col in df.columns:
            if col not in ["is_churn", mapping.get("customer_id")] and pd.api.types.is_numeric_dtype(df[col]) and df[col].nunique() > 4:
                target_col = col
                title = f"Churn Curve by {col}"
                break

    if not target_col:
        # Fall back to quartile cohorts
        df_copy = df.copy()
        df_copy["cohort"] = pd.qcut(df_copy.index, q=4, labels=["Cohort 1", "Cohort 2", "Cohort 3", "Cohort 4"])
        target_col = "cohort"
        title = "Customer Cohort Churn Distribution"

    df_copy = df.copy()
    curve = []
    cumulative_rev = 0.0

    if pd.api.types.is_numeric_dtype(df_copy[target_col]):
        # Dynamic binning into 4-6 quantiles or rounded buckets
        try:
            df_copy["bucket"] = pd.qcut(df_copy[target_col], q=5, duplicates='drop')
            bucket_labels = [f"{int(b.left)+1} to {int(b.right)}" if hasattr(b, 'left') else str(b) for b in df_copy["bucket"].cat.categories]
            df_copy["bucket_label"] = df_copy["bucket"].map(dict(zip(df_copy["bucket"].cat.categories, bucket_labels)))
        except Exception:
            df_copy["bucket_label"] = pd.cut(df_copy[target_col], bins=4).astype(str)
    else:
        df_copy["bucket_label"] = df_copy[target_col].astype(str)

    unique_buckets = df_copy["bucket_label"].dropna().unique()
    for bucket in unique_buckets:
        sub = df_copy[df_copy["bucket_label"] == bucket]
        if len(sub) == 0:
            continue
        churn_pct = (sub["is_churn"].sum() / len(sub)) * 100
        if revenue_col and revenue_col in sub.columns and pd.api.types.is_numeric_dtype(sub[revenue_col]):
            lost = sub[sub["is_churn"] == 1][revenue_col].sum()
        else:
            lost = sub["is_churn"].sum() * 50.0

        cumulative_rev += float(lost)
        curve.append({
            "tenure_bucket": str(bucket),
            "churn_rate": float(round(churn_pct, 2)),
            "cumulative_revenue_lost": float(round(cumulative_rev, 2)),
            "customer_count": int(len(sub))
        })

    return curve, title

def extract_dynamic_filters(df: pd.DataFrame, mapping: Dict[str, str]) -> List[Dict[str, Any]]:
    filters = []
    ignore_cols = {"is_churn", mapping.get("churn_label", ""), mapping.get("customer_id", "")}

    for col in df.columns:
        if col in ignore_cols or not col:
            continue
        nunique = df[col].nunique()
        if 2 <= nunique <= 12:
            vals = [str(v) for v in df[col].dropna().unique()[:10]]
            filters.append({
                "column": str(col),
                "label": str(col).replace("_", " ").title(),
                "options": vals
            })

    return filters[:4]
