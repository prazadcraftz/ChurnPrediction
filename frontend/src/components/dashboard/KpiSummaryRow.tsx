import React from 'react';
import type { KPIs } from '../../types/analysis';
import { DollarSign, TrendingUp, AlertTriangle, Cpu } from 'lucide-react';

interface KpiSummaryRowProps {
  kpis: KPIs;
}

export const KpiSummaryRow: React.FC<KpiSummaryRowProps> = ({ kpis }) => {
  const revLabel = kpis.revenue_label || 'Revenue at Risk';

  // Clean formatting for large revenue numbers to avoid overflowing
  const formattedRevenue = kpis.revenue_at_risk >= 10000
    ? `$${kpis.revenue_at_risk.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : `$${kpis.revenue_at_risk.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <section className="w-full mb-12" aria-label="KPI Summary">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
        {/* CARD 1: REVENUE / FINANCIAL VALUE AT RISK (HERO CARD) */}
        <div className="bg-[#847dff] text-[#000000] rounded-[16px] p-6 flex flex-col justify-between relative overflow-hidden shadow-[0_18px_20px_0_rgba(132,125,255,0.2)] hover:scale-[1.01] transition-transform min-w-0">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono-data text-[11px] font-semibold uppercase tracking-wider text-[#000000]/80 truncate pr-2">
              {revLabel}
            </span>
            <div className="w-8 h-8 rounded-full bg-[#000000]/10 flex items-center justify-center text-[#000000] shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[26px] sm:text-[28px] lg:text-[26px] xl:text-[30px] font-mono-data font-bold tracking-tight text-[#000000] leading-tight mb-1 truncate">
              {formattedRevenue}
            </div>
            <p className="text-[12px] text-[#000000]/80 font-sans-ui font-medium truncate">
              Calculated from churned accounts
            </p>
          </div>
        </div>

        {/* CARD 2: OVERALL CHURN RATE */}
        <div className="bg-[#2e2e2e] border border-[#3f4041] rounded-[16px] p-6 flex flex-col justify-between hover:border-[#847dff]/40 transition-colors min-w-0">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono-data text-[11px] uppercase tracking-wider text-[#9f9fa0] truncate pr-2">
              Overall Churn Rate
            </span>
            <div className="w-8 h-8 rounded-full bg-[#ff4d4d]/10 text-[#ff4d4d] flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[28px] sm:text-[30px] lg:text-[28px] xl:text-[32px] font-mono-data font-bold text-[#ffffff] leading-tight mb-1">
              {kpis.churn_rate.toFixed(1)}%
            </div>
            <p className="text-[12px] text-[#9f9fa0] font-sans-ui truncate">
              Based on <span className="text-[#ffffff] font-medium">{kpis.total_customers.toLocaleString()}</span> accounts
            </p>
          </div>
        </div>

        {/* CARD 3: HIGHEST RISK SEGMENT */}
        <div className="bg-[#2e2e2e] border border-[#3f4041] rounded-[16px] p-6 flex flex-col justify-between hover:border-[#847dff]/40 transition-colors min-w-0">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono-data text-[11px] uppercase tracking-wider text-[#9f9fa0] truncate pr-2">
              Highest Risk Segment
            </span>
            <div className="w-8 h-8 rounded-full bg-[#ffaa00]/10 text-[#ffaa00] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[15px] sm:text-[16px] font-medium text-[#ffffff] leading-snug mb-2 line-clamp-2 min-h-[40px]">
              {kpis.top_risk_segment}
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ffaa00]/15 text-[#ffaa00] font-mono-data text-[11px]">
              <span>{kpis.top_risk_segment_churn.toFixed(1)}% Churn Rate</span>
            </div>
          </div>
        </div>

        {/* CARD 4: TOTAL CUSTOMERS & MODEL AUC */}
        <div className="bg-[#2e2e2e] border border-[#3f4041] rounded-[16px] p-6 flex flex-col justify-between hover:border-[#847dff]/40 transition-colors min-w-0">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono-data text-[11px] uppercase tracking-wider text-[#9f9fa0] truncate pr-2">
              Scope & ML Validation
            </span>
            <div className="w-8 h-8 rounded-full bg-[#00b3dd]/10 text-[#00b3dd] flex items-center justify-center shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-[26px] sm:text-[28px] font-mono-data font-bold text-[#ffffff]">
                {kpis.total_customers.toLocaleString()}
              </div>
              <span className="text-[11px] text-[#6a6b6b] font-mono-data uppercase">Rows</span>
            </div>
            {kpis.model_auc ? (
              <div className="flex items-center justify-between pt-2 border-t border-[#3f4041] text-[12px]">
                <span className="text-[#9f9fa0] font-sans-ui">ROC-AUC:</span>
                <span className="font-mono-data font-semibold text-[#00b3dd]">
                  {kpis.model_auc.toFixed(3)}
                </span>
              </div>
            ) : (
              <div className="pt-2 border-t border-[#3f4041] text-[11px] text-[#6a6b6b]">
                Statistical engine active
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
