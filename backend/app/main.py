import json
import uuid
import pandas as pd
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from app.schemas import AnalysisResult, ColumnMapping
from app.engine.cleaner import (
    auto_detect_columns, clean_dataset, load_data_from_bytes, get_excel_sheets
)
from app.engine.stats import analyze_churn_drivers, build_tenure_curve, extract_dynamic_filters
from app.engine.segmentation import extract_risk_segments, generate_recommendations
from app.engine.predictor import train_and_predict_churn
from app import db

# ──────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB
ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}

app = FastAPI(title="Origin Churn & Intelligence API", version="2.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    """Initialize SQLite database and purge stale sessions on startup."""
    db.init_db()


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────
def _validate_upload(filename: str, contents: bytes) -> None:
    """Server-side file validation: size cap + extension whitelist."""
    import os
    _, ext = os.path.splitext(filename.lower())
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{ext}'. Please upload a .csv, .xlsx, or .xls file."
        )
    if len(contents) > MAX_FILE_SIZE_BYTES:
        mb = len(contents) / (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({mb:.1f} MB). Maximum allowed size is 50 MB."
        )


# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "service": "Origin Universal Churn & Retention Analysis Engine v2.1"}


@app.post("/api/upload-validate")
async def upload_validate(file: UploadFile = File(...)):
    """
    Validates the uploaded file and returns a preview + column mapping suggestions.
    For multi-sheet Excel files, also returns the list of available sheet names.
    """
    try:
        filename = file.filename or "uploaded_dataset.csv"
        contents = await file.read()

        # Server-side validation
        _validate_upload(filename, contents)

        df = load_data_from_bytes(contents, filename, nrows=50)

        # Normalize column names
        df.columns = [str(c).strip() for c in df.columns]
        headers = list(df.columns)

        suggested = auto_detect_columns(df)

        unique_vals = {}
        for h in headers[:15]:
            unique_vals[h] = [str(v) for v in df[h].dropna().unique()[:10]]

        preview_rows = df.head(5).astype(str).to_dict(orient="records")

        # Multi-sheet Excel detection
        available_sheets = get_excel_sheets(contents, filename)

        response = {
            "headers": headers,
            "rows": preview_rows,
            "suggested_mapping": suggested,
            "unique_values": unique_vals,
        }
        if len(available_sheets) > 1:
            response["available_sheets"] = available_sheets

        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")


@app.post("/api/analyze")
async def analyze_file(
    file: UploadFile = File(...),
    mapping: str = Form(None),
    sheet_name: str = Form(None),
):
    """
    Runs the full analysis pipeline and persists the result with a session UUID.
    Returns session_id so the frontend can re-fetch without re-uploading.
    """
    try:
        filename = file.filename or "dataset.csv"
        contents = await file.read()

        # Server-side validation
        _validate_upload(filename, contents)

        df = load_data_from_bytes(contents, filename, sheet_name=sheet_name or None)

        # 1. Column mapping: user-provided or auto-inferred
        if mapping:
            map_dict = json.loads(mapping)
        else:
            map_dict = auto_detect_columns(df)

        # 2. Clean dataset
        clean_df, warnings = clean_dataset(df, map_dict)

        total_customers = len(clean_df)

        # < 50 rows warning
        if total_customers < 50:
            warnings.append(
                f"Dataset only has {total_customers} rows. Statistical results may be unreliable and ML predictions are disabled."
            )

        churn_count = int(clean_df["is_churn"].sum())
        overall_churn_rate = float(round((churn_count / total_customers) * 100, 2)) if total_customers > 0 else 0.0

        # Revenue / Value calculation
        rev_col = map_dict.get("monthly_revenue")
        revenue_label = "Revenue at Risk"
        if rev_col and rev_col in clean_df.columns and pd.api.types.is_numeric_dtype(clean_df[rev_col]):
            rev_at_risk = float(round(clean_df[clean_df["is_churn"] == 1][rev_col].sum(), 2))
            if "balance" in rev_col.lower():
                revenue_label = "Deposit Balance at Risk"
            elif "salary" in rev_col.lower() or "income" in rev_col.lower():
                revenue_label = "Customer Income at Risk"
            elif "spend" in rev_col.lower() or "order" in rev_col.lower():
                revenue_label = "Order Value at Risk"
        else:
            rev_at_risk = float(round(churn_count * 65.0, 2))
            if not rev_col:
                warnings.append("No revenue column detected. Revenue at Risk is estimated (churned customers × $65).")

        # 3. Statistical Churn Drivers
        drivers = analyze_churn_drivers(clean_df, map_dict)

        # 4. Tenure / Lifecycle Curve
        tenure_curve, tenure_title = build_tenure_curve(clean_df, map_dict)

        # 5. Dynamic High-Risk Segmentation
        segments = extract_risk_segments(clean_df, map_dict, drivers)
        top_segment_name = segments[0]["segment_name"] if len(segments) > 0 else "General Customer Cohort"
        top_segment_churn = segments[0]["churn_rate"] if len(segments) > 0 else overall_churn_rate

        # 6. Dynamic Filter Dimensions
        filters = extract_dynamic_filters(clean_df, map_dict)

        # 7. Machine Learning Prediction Module
        predictions = train_and_predict_churn(clean_df, map_dict)

        # 8. Executive Recommendations
        recommendations = generate_recommendations(drivers, segments, revenue_label)

        # 9. Generate session UUID and persist result
        session_id = str(uuid.uuid4())

        result = {
            "session_id": session_id,
            "meta": {
                "filename": filename,
                "row_count": total_customers,
                "analyzed_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
                "warnings": warnings,
                "detected_target_column": map_dict.get("churn_label"),
                "detected_value_column": rev_col or "Inferred standard value",
                "detected_tenure_column": map_dict.get("tenure") or "Cohort distribution",
            },
            "kpis": {
                "churn_rate": overall_churn_rate,
                "total_customers": total_customers,
                "revenue_at_risk": rev_at_risk,
                "revenue_label": revenue_label,
                "top_risk_segment": top_segment_name,
                "top_risk_segment_churn": top_segment_churn,
                "model_auc": predictions["model_metrics"]["auc"] if predictions else None,
                "model_accuracy": predictions["model_metrics"]["precision"] if predictions else None,
            },
            "drivers": drivers,
            "segments": segments,
            "tenure_curve": tenure_curve,
            "tenure_title": tenure_title,
            "filter_options": filters,
            "predictions": predictions,
            "recommendations": recommendations,
        }

        # Persist to SQLite
        db.save_result(session_id, result)

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis engine error: {str(e)}")


@app.get("/api/results/{session_id}")
def get_result(session_id: str):
    """Re-fetch a previously computed analysis result by session UUID."""
    result = db.get_result(session_id)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Session not found or expired (sessions are kept for 24 hours)."
        )
    return result


@app.get("/api/sample-data")
def sample_data():
    return {
        "session_id": None,
        "meta": {
            "filename": "WA_Fn-UseC_-Telco-Customer-Churn.csv",
            "row_count": 7043,
            "analyzed_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
            "warnings": [
                "11 missing TotalCharges values imputed with median.",
                "Schema auto-detected successfully."
            ],
            "detected_target_column": "Churn",
            "detected_value_column": "MonthlyCharges",
            "detected_tenure_column": "tenure",
        },
        "kpis": {
            "churn_rate": 26.54,
            "total_customers": 7043,
            "revenue_at_risk": 139130.50,
            "revenue_label": "Monthly Revenue at Risk",
            "top_risk_segment": "Contract: Month-to-month + Internet: Fiber optic",
            "top_risk_segment_churn": 54.20,
            "model_auc": 0.846,
            "model_accuracy": 0.803,
        },
        "drivers": [
            {
                "factor_name": "Contract",
                "strength_score": 0.92,
                "p_value": 0.0001,
                "is_statistically_significant": True,
                "breakdown": [
                    {"category": "Month-to-month", "churn_rate": 42.71, "count": 3875},
                    {"category": "One year", "churn_rate": 11.27, "count": 1473},
                    {"category": "Two year", "churn_rate": 2.83, "count": 1695},
                ],
            },
            {
                "factor_name": "InternetService",
                "strength_score": 0.78,
                "p_value": 0.0002,
                "is_statistically_significant": True,
                "breakdown": [
                    {"category": "Fiber optic", "churn_rate": 41.89, "count": 3096},
                    {"category": "DSL", "churn_rate": 18.96, "count": 2421},
                    {"category": "No", "churn_rate": 7.40, "count": 1526},
                ],
            },
            {
                "factor_name": "TechSupport",
                "strength_score": 0.71,
                "p_value": 0.0005,
                "is_statistically_significant": True,
                "breakdown": [
                    {"category": "No", "churn_rate": 41.64, "count": 3473},
                    {"category": "Yes", "churn_rate": 15.17, "count": 2044},
                    {"category": "No internet service", "churn_rate": 7.40, "count": 1526},
                ],
            },
        ],
        "segments": [
            {
                "segment_name": "Contract: Month-to-month + InternetService: Fiber optic",
                "customer_count": 1680,
                "churn_rate": 54.20,
                "revenue_at_risk": 78540.00,
                "traits": [
                    "Contract: Month-to-month",
                    "InternetService: Fiber optic",
                    "High risk cohort (54.2% churn)",
                ],
            },
            {
                "segment_name": "Contract: Month-to-month + PaymentMethod: Electronic check",
                "customer_count": 1120,
                "churn_rate": 48.30,
                "revenue_at_risk": 36420.50,
                "traits": [
                    "Contract: Month-to-month",
                    "PaymentMethod: Electronic check",
                    "High initial onboarding drop-off",
                ],
            },
        ],
        "tenure_curve": [
            {"tenure_bucket": "0-3 mos", "churn_rate": 51.40, "cumulative_revenue_lost": 42100.00, "customer_count": 1040},
            {"tenure_bucket": "4-6 mos", "churn_rate": 38.20, "cumulative_revenue_lost": 68400.00, "customer_count": 680},
            {"tenure_bucket": "7-12 mos", "churn_rate": 29.80, "cumulative_revenue_lost": 92300.00, "customer_count": 820},
            {"tenure_bucket": "13-24 mos", "churn_rate": 21.10, "cumulative_revenue_lost": 112500.00, "customer_count": 1020},
            {"tenure_bucket": "25-48 mos", "churn_rate": 14.30, "cumulative_revenue_lost": 128900.00, "customer_count": 1580},
            {"tenure_bucket": "49+ mos", "churn_rate": 6.80, "cumulative_revenue_lost": 139130.50, "customer_count": 1903},
        ],
        "tenure_title": "Lifecycle Churn Curve & Revenue Lost by tenure",
        "filter_options": [
            {"column": "Contract", "label": "Contract", "options": ["Month-to-month", "One year", "Two year"]},
            {"column": "InternetService", "label": "Internet Service", "options": ["DSL", "Fiber optic", "No"]},
            {"column": "PaymentMethod", "label": "Payment Method", "options": ["Electronic check", "Mailed check", "Bank transfer (auto)", "Credit card (auto)"]},
        ],
        "predictions": {
            "model_metrics": {"auc": 0.846, "precision": 0.742, "recall": 0.698},
            "feature_importance": [
                {"feature": "Contract Month-To-Month", "importance": 0.34},
                {"feature": "Tenure", "importance": 0.22},
                {"feature": "Monthly Charges", "importance": 0.18},
                {"feature": "Internet Service Fiber Optic", "importance": 0.12},
            ],
            "customers": [
                {
                    "customer_id": "7590-VHVEG",
                    "churn_probability": 0.89,
                    "churn_prob_low": 0.81,
                    "churn_prob_high": 0.95,
                    "risk_tier": "High",
                    "key_attributes": {"tenure": "1", "Contract": "Month-to-month", "MonthlyCharges": "$29.85", "PaymentMethod": "Electronic check"},
                    "top_drivers": [
                        {"feature": "Contract Month To Month", "direction": "increases", "contribution": 0.142},
                        {"feature": "Tenure", "direction": "increases", "contribution": 0.087},
                        {"feature": "Monthly Charges", "direction": "increases", "contribution": 0.041},
                    ],
                },
                {
                    "customer_id": "3668-QPYBK",
                    "churn_probability": 0.82,
                    "churn_prob_low": 0.74,
                    "churn_prob_high": 0.89,
                    "risk_tier": "High",
                    "key_attributes": {"tenure": "2", "Contract": "Month-to-month", "MonthlyCharges": "$53.85", "PaymentMethod": "Mailed check"},
                    "top_drivers": [
                        {"feature": "Contract Month To Month", "direction": "increases", "contribution": 0.138},
                        {"feature": "Tenure", "direction": "increases", "contribution": 0.091},
                        {"feature": "Tech Support No", "direction": "increases", "contribution": 0.033},
                    ],
                },
            ],
        },
        "recommendations": [
            {
                "id": "rec-1",
                "title": "Prioritize Intervention on 'Contract'",
                "description": "Customers where Contract is 'Month-to-month' exhibit an elevated 42.71% churn rate. Implement proactive retention campaigns or tailored incentives for this cohort.",
                "related_finding": "Contract shows highest statistical dependency (p = 0.0001).",
                "impact_level": "High",
            },
            {
                "id": "rec-2",
                "title": "Protect Value in Segment: Contract: Month-to-month + Internet: Fiber optic",
                "description": "This segment contains 1,680 accounts with $78,540.00 in monthly revenue at risk and a 54.2% churn rate. Offer targeted retention packages.",
                "related_finding": "Highest revenue loss concentration across all detected cohorts.",
                "impact_level": "High",
            },
        ],
    }
