import pandas as pd
import io
import sys
import os

# Add parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.engine.cleaner import load_data_from_bytes, auto_detect_columns, clean_dataset
from app.engine.stats import analyze_churn_drivers, build_tenure_curve, extract_dynamic_filters
from app.engine.segmentation import extract_risk_segments, generate_recommendations
from app.engine.predictor import train_and_predict_churn

def test_excel_and_dynamic_dataset():
    # Create sample banking excel dataset in memory
    bank_data = {
        "CustomerId": [15634602, 15647311, 15619304, 15701354, 15737888, 15574012, 15592531, 15656148, 15792365, 15592389] * 5,
        "Surname": ["Hargrave", "Hill", "Onio", "Boni", "Mitchell", "Chu", "Bartlett", "Obinna", "He", "H?"] * 5,
        "CreditScore": [619, 608, 502, 699, 850, 645, 822, 376, 501, 684] * 5,
        "Geography": ["France", "Spain", "France", "France", "Spain", "Spain", "France", "Germany", "France", "France"] * 5,
        "Gender": ["Female", "Female", "Female", "Female", "Female", "Male", "Male", "Female", "Male", "Male"] * 5,
        "Age": [42, 41, 42, 39, 43, 44, 50, 29, 44, 27] * 5,
        "Tenure": [2, 1, 8, 1, 2, 8, 7, 4, 4, 2] * 5,
        "Balance": [0.0, 83807.86, 159660.8, 0.0, 125510.82, 113755.78, 0.0, 115046.74, 142051.07, 134603.88] * 5,
        "NumOfProducts": [1, 1, 3, 2, 1, 2, 2, 4, 2, 1] * 5,
        "HasCrCard": [1, 0, 1, 0, 1, 1, 1, 1, 0, 1] * 5,
        "IsActiveMember": [1, 1, 0, 0, 1, 0, 1, 0, 1, 1] * 5,
        "EstimatedSalary": [101348.88, 112542.58, 113931.57, 93826.63, 79084.1, 149756.71, 10062.8, 119346.88, 74940.5, 71725.73] * 5,
        "Exited": [1, 0, 1, 0, 0, 1, 0, 1, 0, 0] * 5
    }

    df_orig = pd.DataFrame(bank_data)
    
    # Save to Excel bytes buffer (.xlsx)
    excel_buffer = io.BytesIO()
    with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
        df_orig.to_excel(writer, index=False)
    excel_bytes = excel_buffer.getvalue()

    # 1. Test loading Excel file
    loaded_df = load_data_from_bytes(excel_bytes, "Bank_Customer_Churn.xlsx")
    assert len(loaded_df) == 50, f"Expected 50 rows, got {len(loaded_df)}"
    print("[PASS] Excel bytes parsing (.xlsx) succeeded!")

    # 2. Test auto-detection
    mapping = auto_detect_columns(loaded_df)
    assert mapping["churn_label"] == "Exited", f"Expected Exited as churn_label, got {mapping['churn_label']}"
    assert mapping["customer_id"] == "CustomerId", f"Expected CustomerId, got {mapping['customer_id']}"
    assert mapping["tenure"] == "Tenure", f"Expected Tenure, got {mapping['tenure']}"
    assert mapping["monthly_revenue"] == "Balance", f"Expected Balance, got {mapping['monthly_revenue']}"
    print(f"[PASS] Column auto-detection succeeded: {mapping}")

    # 3. Test cleaning
    clean_df, warnings = clean_dataset(loaded_df, mapping)
    assert "is_churn" in clean_df.columns
    assert clean_df["is_churn"].sum() == 20
    print("[PASS] Dataset cleaning succeeded!")

    # 4. Test stats drivers
    drivers = analyze_churn_drivers(clean_df, mapping)
    assert len(drivers) > 0
    print(f"[PASS] Driver analysis succeeded: found {len(drivers)} drivers (top driver: {drivers[0]['factor_name']})")

    # 5. Test dynamic tenure curve
    curve, title = build_tenure_curve(clean_df, mapping)
    assert len(curve) > 0
    print(f"[PASS] Dynamic tenure curve succeeded: '{title}' with {len(curve)} buckets")

    # 6. Test dynamic segmentation
    segments = extract_risk_segments(clean_df, mapping, drivers)
    assert len(segments) > 0
    print(f"[PASS] Dynamic segmentation succeeded: top segment '{segments[0]['segment_name']}'")

    # 7. Test ML predictions
    preds = train_and_predict_churn(clean_df, mapping)
    assert preds is not None
    print(f"[PASS] ML prediction module succeeded: ROC-AUC = {preds['model_metrics']['auc']}")

    print("\n=======================================================")
    print("ALL EXCEL (.XLSX) & DYNAMIC DATASET TESTS PASSED! [100%]")
    print("=======================================================\n")

if __name__ == "__main__":
    test_excel_and_dynamic_dataset()
