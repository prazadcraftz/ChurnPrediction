from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class AnalysisMeta(BaseModel):
    filename: str
    row_count: int
    analyzed_at: str
    warnings: List[str]
    detected_target_column: Optional[str] = None
    detected_value_column: Optional[str] = None
    detected_tenure_column: Optional[str] = None

class KPIs(BaseModel):
    churn_rate: float
    total_customers: int
    revenue_at_risk: float
    revenue_label: str = "Revenue at Risk"
    top_risk_segment: str
    top_risk_segment_churn: float
    model_auc: Optional[float] = None
    model_accuracy: Optional[float] = None

class DriverBreakdown(BaseModel):
    category: str
    churn_rate: float
    count: int

class ChurnDriver(BaseModel):
    factor_name: str
    strength_score: float
    p_value: float
    is_statistically_significant: bool
    breakdown: List[DriverBreakdown]

class RiskSegment(BaseModel):
    segment_name: str
    customer_count: int
    churn_rate: float
    revenue_at_risk: float
    traits: List[str]

class TenureBucket(BaseModel):
    tenure_bucket: str
    churn_rate: float
    cumulative_revenue_lost: float
    customer_count: int

class PerCustomerDriver(BaseModel):
    feature: str
    direction: str  # "increases" | "decreases"
    contribution: float

class CustomerPrediction(BaseModel):
    customer_id: str
    churn_probability: float
    churn_prob_low: Optional[float] = None   # confidence interval lower bound
    churn_prob_high: Optional[float] = None  # confidence interval upper bound
    risk_tier: str
    key_attributes: Dict[str, Any]
    top_drivers: Optional[List[PerCustomerDriver]] = None  # per-customer SHAP-like drivers

class FeatureImportance(BaseModel):
    feature: str
    importance: float

class ModelMetrics(BaseModel):
    auc: float
    precision: float
    recall: float

class PredictionModule(BaseModel):
    model_metrics: ModelMetrics
    feature_importance: List[FeatureImportance]
    customers: List[CustomerPrediction]

class Recommendation(BaseModel):
    id: str
    title: str
    description: str
    related_finding: str
    impact_level: str

class FilterOption(BaseModel):
    column: str
    label: str
    options: List[str]

class ColumnMapping(BaseModel):
    customer_id: str
    churn_label: str
    churn_positive_value: str = "Yes"
    tenure: Optional[str] = None
    monthly_revenue: Optional[str] = None

class AnalysisResult(BaseModel):
    session_id: Optional[str] = None        # UUID for result persistence/re-fetch
    meta: AnalysisMeta
    kpis: KPIs
    drivers: List[ChurnDriver]
    segments: List[RiskSegment]
    tenure_curve: List[TenureBucket]
    tenure_title: str = "Lifecycle Churn Curve & Value Loss"
    filter_options: List[FilterOption] = []
    predictions: Optional[PredictionModule] = None
    recommendations: List[Recommendation]
