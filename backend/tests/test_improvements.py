import io
import sys
import os
import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.engine.cleaner import get_excel_sheets, load_data_from_bytes, auto_detect_columns, clean_dataset
from app.engine.predictor import train_and_predict_churn
from app import db

def test_improvements():
    # 1. Test Multi-sheet Excel detection and loading
    df1 = pd.DataFrame({"ID": [1, 2, 3], "Churn": [0, 1, 0]})
    df2 = pd.DataFrame({"ID": [4, 5, 6], "Churn": [1, 1, 0]})
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as writer:
        df1.to_excel(writer, sheet_name="SheetA", index=False)
        df2.to_excel(writer, sheet_name="SheetB", index=False)
    excel_bytes = buf.getvalue()

    sheets = get_excel_sheets(excel_bytes, "multi.xlsx")
    assert sheets == ["SheetA", "SheetB"], f"Unexpected sheets: {sheets}"
    print(f"[PASS] Multi-sheet detection: {sheets}")

    df_loaded_b = load_data_from_bytes(excel_bytes, "multi.xlsx", sheet_name="SheetB")
    assert list(df_loaded_b["ID"]) == [4, 5, 6]
    print("[PASS] Sheet-specific loading for SheetB succeeded!")

    # 2. Test < 50 rows predictor guard
    mapping = {"customer_id": "ID", "churn_label": "Churn"}
    clean_small, _ = clean_dataset(df1, mapping)
    small_preds = train_and_predict_churn(clean_small, mapping)
    assert small_preds is None, "Expected None for < 50 rows"
    print("[PASS] Dataset < 50 rows guard in predictor succeeded!")

    # 3. Test confidence interval and per-customer drivers with >= 50 rows
    bank_data = {
        "CustomerId": [1000 + i for i in range(60)],
        "CreditScore": [600 + (i % 20) * 10 for i in range(60)],
        "Tenure": [(i % 10) + 1 for i in range(60)],
        "Balance": [10000.0 * (i % 5) for i in range(60)],
        "Exited": [1 if i % 3 == 0 else 0 for i in range(60)],
    }
    df_large = pd.DataFrame(bank_data)
    large_mapping = {"customer_id": "CustomerId", "churn_label": "Exited", "churn_positive_value": "1"}
    clean_large, _ = clean_dataset(df_large, large_mapping)
    preds = train_and_predict_churn(clean_large, large_mapping)
    assert preds is not None
    sample_customer = preds["customers"][0]
    assert "churn_prob_low" in sample_customer
    assert "churn_prob_high" in sample_customer
    assert "top_drivers" in sample_customer
    print(f"[PASS] Confidence intervals: {sample_customer['churn_prob_low']} - {sample_customer['churn_prob_high']}")
    print(f"[PASS] Per-customer top drivers count: {len(sample_customer['top_drivers'])}")

    # 4. Test SQLite Persistence
    db.init_db()
    test_id = "test-session-uuid-123"
    test_data = {"kpi": "sample"}
    db.save_result(test_id, test_data)
    retrieved = db.get_result(test_id)
    assert retrieved == test_data
    print("[PASS] SQLite session persistence save and retrieve succeeded!")

    print("\n=======================================================")
    print("ALL BACKEND IMPROVEMENT TESTS PASSED! [100%]")
    print("=======================================================\n")

if __name__ == "__main__":
    test_improvements()
