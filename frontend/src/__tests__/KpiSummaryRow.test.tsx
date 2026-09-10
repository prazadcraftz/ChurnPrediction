import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { KpiSummaryRow } from '../components/dashboard/KpiSummaryRow';
import type { KPIs } from '../types/analysis';

const baseKpis: KPIs = {
  churn_rate: 26.54,
  total_customers: 7043,
  revenue_at_risk: 139130.50,
  revenue_label: 'Monthly Revenue at Risk',
  top_risk_segment: 'Contract: Month-to-month + InternetService: Fiber optic',
  top_risk_segment_churn: 54.2,
  model_auc: 0.846,
};

describe('KpiSummaryRow', () => {
  it('renders the churn rate', () => {
    render(<KpiSummaryRow kpis={baseKpis} />);
    expect(screen.getByText('26.5%')).toBeInTheDocument();
  });

  it('renders total customer count', () => {
    render(<KpiSummaryRow kpis={baseKpis} />);
    expect(screen.getAllByText('7,043')[0]).toBeInTheDocument();
  });

  it('uses custom revenue label as card header', () => {
    render(<KpiSummaryRow kpis={baseKpis} />);
    expect(screen.getByText('Monthly Revenue at Risk')).toBeInTheDocument();
  });

  it('falls back to default revenue label when not provided', () => {
    const kpisNoLabel = { ...baseKpis, revenue_label: undefined };
    render(<KpiSummaryRow kpis={kpisNoLabel} />);
    expect(screen.getByText('Revenue at Risk')).toBeInTheDocument();
  });

  it('formats large revenue as integer (no decimals) to prevent overflow', () => {
    render(<KpiSummaryRow kpis={baseKpis} />);
    // revenue_at_risk 139130.50 >= 10000 → should display as integer with commas
    expect(screen.getByText('$139,131')).toBeInTheDocument();
  });

  it('renders model AUC when provided', () => {
    render(<KpiSummaryRow kpis={baseKpis} />);
    expect(screen.getByText('0.846')).toBeInTheDocument();
  });

  it('shows statistical engine fallback when model_auc is absent', () => {
    const kpisNoAuc = { ...baseKpis, model_auc: undefined };
    render(<KpiSummaryRow kpis={kpisNoAuc} />);
    expect(screen.getByText(/statistical engine active/i)).toBeInTheDocument();
  });

  it('renders section with aria-label for accessibility', () => {
    render(<KpiSummaryRow kpis={baseKpis} />);
    expect(screen.getByRole('region', { name: /kpi summary/i })).toBeInTheDocument();
  });
});
