import type { AnalysisResult } from '../types/analysis';

export const mockAnalysisResult: AnalysisResult = {
  meta: {
    filename: "WA_Fn-UseC_-Telco-Customer-Churn.csv",
    row_count: 7043,
    analyzed_at: "2026-09-10 14:55 UTC",
    warnings: [
      "11 rows had missing TotalCharges values and were imputed automatically.",
      "No customer ID collisions detected."
    ]
  },
  kpis: {
    churn_rate: 26.54,
    total_customers: 7043,
    revenue_at_risk: 139130.50,
    top_risk_segment: "Month-to-Month, Fiber Optic, No TechSupport",
    top_risk_segment_churn: 54.2,
    model_auc: 0.846,
    model_accuracy: 0.803
  },
  drivers: [
    {
      factor_name: "Contract Type",
      strength_score: 0.92,
      p_value: 0.0001,
      is_statistically_significant: true,
      breakdown: [
        { category: "Month-to-month", churn_rate: 42.71, count: 3875 },
        { category: "One year", churn_rate: 11.27, count: 1473 },
        { category: "Two year", churn_rate: 2.83, count: 1695 }
      ]
    },
    {
      factor_name: "Internet Service Type",
      strength_score: 0.78,
      p_value: 0.0002,
      is_statistically_significant: true,
      breakdown: [
        { category: "Fiber optic", churn_rate: 41.89, count: 3096 },
        { category: "DSL", churn_rate: 18.96, count: 2421 },
        { category: "No Internet", churn_rate: 7.40, count: 1526 }
      ]
    },
    {
      factor_name: "Tech Support Availability",
      strength_score: 0.71,
      p_value: 0.0005,
      is_statistically_significant: true,
      breakdown: [
        { category: "No Tech Support", churn_rate: 41.64, count: 3473 },
        { category: "Has Tech Support", churn_rate: 15.17, count: 2044 },
        { category: "No Internet Service", churn_rate: 7.40, count: 1526 }
      ]
    },
    {
      factor_name: "Payment Method",
      strength_score: 0.65,
      p_value: 0.0012,
      is_statistically_significant: true,
      breakdown: [
        { category: "Electronic check", churn_rate: 45.29, count: 2365 },
        { category: "Mailed check", churn_rate: 19.11, count: 1612 },
        { category: "Bank transfer (auto)", churn_rate: 16.71, count: 1544 },
        { category: "Credit card (auto)", churn_rate: 15.24, count: 1522 }
      ]
    },
    {
      factor_name: "Online Security Add-on",
      strength_score: 0.61,
      p_value: 0.0028,
      is_statistically_significant: true,
      breakdown: [
        { category: "No Online Security", churn_rate: 41.77, count: 3498 },
        { category: "Has Online Security", churn_rate: 14.61, count: 2019 },
        { category: "No Internet Service", churn_rate: 7.40, count: 1526 }
      ]
    }
  ],
  segments: [
    {
      segment_name: "Month-to-month + Fiber Optic + No TechSupport",
      customer_count: 1680,
      churn_rate: 54.20,
      revenue_at_risk: 78540.00,
      traits: [
        "Contract: Month-to-month",
        "Internet: Fiber Optic ($85+/mo)",
        "Missing TechSupport and OnlineSecurity"
      ]
    },
    {
      segment_name: "New Subscribers (Tenure < 12mo) + Electronic Check",
      customer_count: 1120,
      churn_rate: 48.30,
      revenue_at_risk: 36420.50,
      traits: [
        "Tenure < 12 Months",
        "Payment: Electronic Check",
        "High initial onboarding drop-off"
      ]
    },
    {
      segment_name: "High Monthly Charge ($70-$120) + No Add-ons",
      customer_count: 850,
      churn_rate: 43.10,
      revenue_at_risk: 28950.00,
      traits: [
        "Monthly Charge > $70/mo",
        "Zero value-add services attached",
        "High price sensitivity"
      ]
    },
    {
      segment_name: "Senior Citizens on Month-to-Month Contracts",
      customer_count: 640,
      churn_rate: 41.50,
      revenue_at_risk: 17800.00,
      traits: [
        "Senior Citizen = Yes",
        "Month-to-month billing",
        "Low tech support uptake"
      ]
    }
  ],
  tenure_curve: [
    { tenure_bucket: "0-3 mos", churn_rate: 51.40, cumulative_revenue_lost: 42100.00, customer_count: 1040 },
    { tenure_bucket: "4-6 mos", churn_rate: 38.20, cumulative_revenue_lost: 68400.00, customer_count: 680 },
    { tenure_bucket: "7-12 mos", churn_rate: 29.80, cumulative_revenue_lost: 92300.00, customer_count: 820 },
    { tenure_bucket: "13-24 mos", churn_rate: 21.10, cumulative_revenue_lost: 112500.00, customer_count: 1020 },
    { tenure_bucket: "25-48 mos", churn_rate: 14.30, cumulative_revenue_lost: 128900.00, customer_count: 1580 },
    { tenure_bucket: "49+ mos", churn_rate: 6.80, cumulative_revenue_lost: 139130.50, customer_count: 1903 }
  ],
  predictions: {
    model_metrics: {
      auc: 0.846,
      precision: 0.742,
      recall: 0.698
    },
    feature_importance: [
      { feature: "Contract (Month-to-Month)", importance: 0.34 },
      { feature: "Tenure Months", importance: 0.22 },
      { feature: "Monthly Charges ($)", importance: 0.18 },
      { feature: "Internet (Fiber Optic)", importance: 0.12 },
      { feature: "Payment (Electronic Check)", importance: 0.08 },
      { feature: "Tech Support (No)", importance: 0.06 }
    ],
    customers: [
      {
        customer_id: "7590-VHVEG",
        churn_probability: 0.89,
        risk_tier: "High",
        key_attributes: { Tenure: "1 mo", Contract: "Month-to-month", MonthlyCharge: "$29.85", Payment: "Electronic check" }
      },
      {
        customer_id: "3668-QPYBK",
        churn_probability: 0.82,
        risk_tier: "High",
        key_attributes: { Tenure: "2 mos", Contract: "Month-to-month", MonthlyCharge: "$53.85", Payment: "Mailed check" }
      },
      {
        customer_id: "9237-HQJTC",
        churn_probability: 0.78,
        risk_tier: "High",
        key_attributes: { Tenure: "2 mos", Contract: "Month-to-month", MonthlyCharge: "$70.70", Payment: "Electronic check" }
      },
      {
        customer_id: "9305-CDSKC",
        churn_probability: 0.75,
        risk_tier: "High",
        key_attributes: { Tenure: "8 mos", Contract: "Month-to-month", MonthlyCharge: "$99.65", Payment: "Electronic check" }
      },
      {
        customer_id: "1452-KNGWZ",
        churn_probability: 0.58,
        risk_tier: "Medium",
        key_attributes: { Tenure: "14 mos", Contract: "One year", MonthlyCharge: "$64.80", Payment: "Credit card (auto)" }
      },
      {
        customer_id: "6713-OKOMC",
        churn_probability: 0.42,
        risk_tier: "Medium",
        key_attributes: { Tenure: "18 mos", Contract: "Month-to-month", MonthlyCharge: "$56.15", Payment: "Bank transfer (auto)" }
      },
      {
        customer_id: "5575-GNVDE",
        churn_probability: 0.12,
        risk_tier: "Low",
        key_attributes: { Tenure: "34 mos", Contract: "One year", MonthlyCharge: "$56.95", Payment: "Mailed check" }
      },
      {
        customer_id: "7795-CFOCW",
        churn_probability: 0.05,
        risk_tier: "Low",
        key_attributes: { Tenure: "45 mos", Contract: "One year", MonthlyCharge: "$42.30", Payment: "Bank transfer (auto)" }
      }
    ]
  },
  recommendations: [
    {
      id: "rec-1",
      title: "Bundle Free Tech Support for 90 Days to Fiber Subscribers",
      description: "54.2% of month-to-month fiber optic customers without Tech Support churn. Offering a 3-month trial of Tech Support can protect up to $78.5k in monthly revenue at risk.",
      related_finding: "Fiber Optic + No TechSupport segment exhibits 54.2% churn rate vs 15.2% baseline for tech support users.",
      impact_level: "High"
    },
    {
      id: "rec-2",
      title: "Target Early-Tenure Customers (0-6 Months) with Contract Switch Incentives",
      description: "51.4% churn rate occurs within the first 3 months. Providing a $10/mo discount for transitioning from month-to-month to a 1-year contract will dramatically flatten the danger curve.",
      related_finding: "Tenure danger zone peaks in 0-3 month window ($42.1k immediate monthly revenue lost).",
      impact_level: "High"
    },
    {
      id: "rec-3",
      title: "Migrate Electronic Check Users to Auto-Pay",
      description: "Electronic check payers churn at 45.3% compared to 15.2% for auto credit card payments. A $5 one-time bill credit for switching to automated payment methods reduces friction.",
      related_finding: "Electronic Check payment method has p < 0.001 significance and 45.3% churn rate.",
      impact_level: "Medium"
    }
  ]
};
