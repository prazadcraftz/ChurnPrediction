export interface AnalysisMeta {
  filename: string;
  row_count: number;
  analyzed_at: string;
  warnings: string[];
  detected_target_column?: string;
  detected_value_column?: string;
  detected_tenure_column?: string;
}

export interface KPIs {
  churn_rate: number;
  total_customers: number;
  revenue_at_risk: number;
  revenue_label?: string;
  top_risk_segment: string;
  top_risk_segment_churn: number;
  model_auc?: number;
  model_accuracy?: number;
}

export interface DriverBreakdown {
  category: string;
  churn_rate: number;
  count: number;
}

export interface ChurnDriver {
  factor_name: string;
  strength_score: number;
  p_value: number;
  is_statistically_significant: boolean;
  breakdown: DriverBreakdown[];
}

export interface RiskSegment {
  segment_name: string;
  customer_count: number;
  churn_rate: number;
  revenue_at_risk: number;
  traits: string[];
}

export interface TenureBucket {
  tenure_bucket: string;
  churn_rate: number;
  cumulative_revenue_lost: number;
  customer_count: number;
}

export interface PerCustomerDriver {
  feature: string;
  direction: 'increases' | 'decreases';
  contribution: number;
}

export interface CustomerPrediction {
  customer_id: string;
  churn_probability: number;
  churn_prob_low?: number;  // confidence interval lower bound
  churn_prob_high?: number; // confidence interval upper bound
  risk_tier: 'High' | 'Medium' | 'Low';
  key_attributes: Record<string, string | number>;
  top_drivers?: PerCustomerDriver[]; // per-customer SHAP-like drivers
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface PredictionModule {
  model_metrics: {
    auc: number;
    precision: number;
    recall: number;
  };
  feature_importance: FeatureImportance[];
  customers: CustomerPrediction[];
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  related_finding: string;
  impact_level: 'High' | 'Medium' | 'Low';
}

export interface FilterOption {
  column: string;
  label: string;
  options: string[];
}

export interface ColumnMapping {
  customer_id: string;
  churn_label: string;
  churn_positive_value: string;
  tenure: string;
  monthly_revenue: string;
}

export interface CSVPreview {
  headers: string[];
  rows: Record<string, string>[];
  suggested_mapping: ColumnMapping;
  unique_values: Record<string, string[]>;
  available_sheets?: string[]; // multi-sheet Excel support
}

export interface AnalysisResult {
  session_id?: string;          // UUID for session persistence
  meta: AnalysisMeta;
  kpis: KPIs;
  drivers: ChurnDriver[];
  segments: RiskSegment[];
  tenure_curve: TenureBucket[];
  tenure_title?: string;
  filter_options?: FilterOption[];
  predictions?: PredictionModule;
  recommendations: Recommendation[];
}
