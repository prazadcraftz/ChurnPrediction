import pandas as pd
import numpy as np
import io
from typing import Tuple, Dict, Any, List, Optional


def get_excel_sheets(contents: bytes, filename: str) -> List[str]:
    """Return list of sheet names for Excel files; empty list for CSV."""
    fname_lower = filename.lower()
    if fname_lower.endswith(".xlsx") or fname_lower.endswith(".xls"):
        try:
            xf = pd.ExcelFile(io.BytesIO(contents))
            return xf.sheet_names
        except Exception:
            return []
    return []


def load_data_from_bytes(
    contents: bytes,
    filename: str,
    nrows: Optional[int] = None,
    sheet_name: Optional[str] = None,
) -> pd.DataFrame:
    fname_lower = filename.lower()
    if fname_lower.endswith(".xlsx") or fname_lower.endswith(".xls"):
        kwargs: Dict[str, Any] = {}
        if nrows is not None:
            kwargs["nrows"] = nrows
        if sheet_name is not None:
            kwargs["sheet_name"] = sheet_name
        return pd.read_excel(io.BytesIO(contents), **kwargs)
    else:
        try:
            return pd.read_csv(io.BytesIO(contents), nrows=nrows)
        except Exception:
            return pd.read_csv(io.BytesIO(contents), sep=None, engine='python', nrows=nrows)

def auto_detect_columns(df: pd.DataFrame) -> Dict[str, str]:
    headers = [str(c) for c in df.columns]
    mapping = {
        "customer_id": "",
        "churn_label": "",
        "churn_positive_value": "1",
        "tenure": "",
        "monthly_revenue": ""
    }

    # Helper function to match clean words
    def clean_name(c: str) -> str:
        return c.lower().replace(" ", "").replace("_", "").replace("-", "")

    # 1. Detect Churn Label
    churn_exact = ["churn", "exited", "ischurn", "attrition", "left", "status", "target", "cancelled", "canceled", "closed", "churnflag", "churned"]
    for col in headers:
        c_clean = clean_name(col)
        if c_clean in churn_exact:
            mapping["churn_label"] = col
            break
    if not mapping["churn_label"]:
        for col in headers:
            c_clean = clean_name(col)
            if any(cand in c_clean for cand in ["churn", "exit", "cancel", "attrition"]):
                mapping["churn_label"] = col
                break
    if not mapping["churn_label"]:
        for col in headers:
            if df[col].nunique() == 2:
                mapping["churn_label"] = col
                break

    # 2. Detect Positive Churn Value in that column
    if mapping["churn_label"]:
        unique_vals = [str(v) for v in df[mapping["churn_label"]].dropna().unique()]
        positives = ["1", "yes", "true", "churned", "exited", "left", "closed", "y", "t", "cancel", "canceled"]
        found = False
        for v in unique_vals:
            if v.strip().lower() in positives:
                mapping["churn_positive_value"] = v
                found = True
                break
        if not found and len(unique_vals) > 0:
            mapping["churn_positive_value"] = unique_vals[0]

    # 3. Detect Customer ID
    id_exact = ["customerid", "custid", "id", "accountnumber", "clientid", "userid", "user_id", "customer_id", "accountid", "rownumber"]
    for col in headers:
        c_clean = clean_name(col)
        if c_clean in id_exact:
            mapping["customer_id"] = col
            break
    if not mapping["customer_id"]:
        for col in headers:
            c_clean = clean_name(col)
            if "id" in c_clean or "account" in c_clean:
                mapping["customer_id"] = col
                break
    if not mapping["customer_id"] and len(headers) > 0:
        mapping["customer_id"] = headers[0]

    # 4. Detect Tenure / Duration Column
    tenure_exact = ["tenure", "monthswithus", "duration", "tenuremonths", "dayssincelastorder", "months", "period"]
    for col in headers:
        c_clean = clean_name(col)
        if c_clean in tenure_exact and col != mapping["churn_label"] and col != mapping["customer_id"]:
            mapping["tenure"] = col
            break
    if not mapping["tenure"]:
        for col in headers:
            c_clean = clean_name(col)
            if any(cand in c_clean for cand in ["tenure", "month", "duration", "day"]) and col != mapping["churn_label"] and col != mapping["customer_id"]:
                mapping["tenure"] = col
                break

    # 5. Detect Revenue / Financial Value Column
    revenue_exact = [
        "monthlycharges", "balance", "estimatedsalary", "charges", "revenue",
        "amount", "spend", "price", "arpu", "orderamount", "salary", "value", "totalcharges", "income"
    ]
    for col in headers:
        c_clean = clean_name(col)
        if c_clean in revenue_exact and col != mapping["churn_label"] and col != mapping["customer_id"] and col != mapping["tenure"]:
            mapping["monthly_revenue"] = col
            break
    if not mapping["monthly_revenue"]:
        for col in headers:
            c_clean = clean_name(col)
            if any(cand in c_clean for cand in ["charge", "revenue", "balance", "salary", "amount", "spend", "price"]) and col != mapping["churn_label"] and col != mapping["customer_id"] and col != mapping["tenure"]:
                mapping["monthly_revenue"] = col
                break

    return mapping

def clean_dataset(df: pd.DataFrame, mapping: Dict[str, str]) -> Tuple[pd.DataFrame, List[str]]:
    warnings = []
    cleaned_df = df.copy()

    # Normalize column names: strip whitespace
    cleaned_df.columns = [str(c).strip() for c in cleaned_df.columns]

    # Standardize churn target into binary 0 / 1
    churn_col = mapping.get("churn_label")
    positive_val = str(mapping.get("churn_positive_value", "1")).strip().lower()

    if churn_col and churn_col in cleaned_df.columns:
        cleaned_df["is_churn"] = cleaned_df[churn_col].astype(str).str.strip().str.lower().apply(
            lambda x: 1 if x == positive_val or (positive_val in ["1", "true", "yes"] and x in ["1", "true", "yes", "y", "t"]) else 0
        )
    else:
        warnings.append("No valid churn column mapped. Standardized target failed.")
        cleaned_df["is_churn"] = 0

    # Clean numeric columns across dataframe (including string representations of floats)
    for col in cleaned_df.columns:
        if col == "is_churn":
            continue
        if cleaned_df[col].dtype == object:
            try:
                coerced = pd.to_numeric(cleaned_df[col].astype(str).str.strip(), errors='coerce')
                if coerced.notnull().sum() > len(cleaned_df) * 0.5:
                    null_count = coerced.isnull().sum()
                    if null_count > 0:
                        warnings.append(f"Column '{col}' had {null_count} missing/blank values imputed with median.")
                        coerced = coerced.fillna(coerced.median())
                    cleaned_df[col] = coerced
            except Exception:
                pass

    return cleaned_df, warnings
