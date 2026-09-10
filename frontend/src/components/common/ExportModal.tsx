import React, { useState } from 'react';
import { Download, FileText, Table2, X } from 'lucide-react';
import type { AnalysisResult } from '../../types/analysis';

interface ExportModalProps {
  analysisData: AnalysisResult;
  onClose: () => void;
}

function exportCSV(data: AnalysisResult): void {
  const rows: string[][] = [];

  // ── KPI Summary ──
  rows.push(['=== KPI SUMMARY ===']);
  rows.push(['Metric', 'Value']);
  rows.push(['Churn Rate (%)', String(data.kpis.churn_rate)]);
  rows.push(['Total Customers', String(data.kpis.total_customers)]);
  rows.push([data.kpis.revenue_label ?? 'Revenue at Risk', `$${data.kpis.revenue_at_risk.toFixed(2)}`]);
  rows.push(['Top Risk Segment', data.kpis.top_risk_segment]);
  rows.push(['Top Segment Churn (%)', String(data.kpis.top_risk_segment_churn)]);
  if (data.kpis.model_auc != null) rows.push(['Model AUC', String(data.kpis.model_auc)]);
  rows.push([]);

  // ── Churn Drivers ──
  rows.push(['=== CHURN DRIVERS ===']);
  rows.push(['Driver', 'Strength Score', 'P-Value', 'Significant', 'Category', 'Category Churn %', 'Category Count']);
  for (const d of data.drivers) {
    for (const b of d.breakdown) {
      rows.push([
        d.factor_name,
        String(d.strength_score),
        String(d.p_value),
        d.is_statistically_significant ? 'Yes' : 'No',
        b.category,
        String(b.churn_rate),
        String(b.count),
      ]);
    }
  }
  rows.push([]);

  // ── Risk Segments ──
  rows.push(['=== RISK SEGMENTS ===']);
  rows.push(['Segment', 'Customers', 'Churn Rate (%)', 'Revenue at Risk', 'Traits']);
  for (const s of data.segments) {
    rows.push([
      s.segment_name,
      String(s.customer_count),
      String(s.churn_rate),
      `$${s.revenue_at_risk.toFixed(2)}`,
      s.traits.join(' | '),
    ]);
  }
  rows.push([]);

  // ── Tenure Curve ──
  rows.push(['=== LIFECYCLE / TENURE CURVE ===']);
  rows.push(['Tenure Bucket', 'Churn Rate (%)', 'Cumulative Revenue Lost', 'Customer Count']);
  for (const t of data.tenure_curve) {
    rows.push([
      t.tenure_bucket,
      String(t.churn_rate),
      `$${t.cumulative_revenue_lost.toFixed(2)}`,
      String(t.customer_count),
    ]);
  }
  rows.push([]);

  // ── ML Predictions ──
  if (data.predictions) {
    rows.push(['=== ML CUSTOMER RISK SCORES ===']);
    rows.push(['Customer ID', 'Churn Probability', 'CI Low', 'CI High', 'Risk Tier', 'Top Driver 1', 'Top Driver 2']);
    for (const c of data.predictions.customers) {
      const d1 = c.top_drivers?.[0];
      const d2 = c.top_drivers?.[1];
      rows.push([
        c.customer_id,
        String(c.churn_probability),
        c.churn_prob_low != null ? String(c.churn_prob_low) : '',
        c.churn_prob_high != null ? String(c.churn_prob_high) : '',
        c.risk_tier,
        d1 ? `${d1.feature} (${d1.direction} risk)` : '',
        d2 ? `${d2.feature} (${d2.direction} risk)` : '',
      ]);
    }
    rows.push([]);
  }

  const csv = rows
    .map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `churn-analysis-${data.meta.filename.replace(/\.[^.]+$/, '')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function exportPDF(): Promise<void> {
  // Dynamic import to keep PDF libs out of the main bundle
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const dashboard = document.getElementById('dashboard-root');
  if (!dashboard) return;

  const canvas = await html2canvas(dashboard, {
    backgroundColor: '#0f1011',
    scale: 1.5,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });

  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();
  const imgW = canvas.width;
  const imgH = canvas.height;
  const ratio = pdfW / imgW;
  const scaledH = imgH * ratio;

  let y = 0;
  while (y < scaledH) {
    if (y > 0) pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, -y, pdfW, scaledH);
    y += pdfH;
  }

  pdf.save('churn-analysis-report.pdf');
}

export const ExportModal: React.FC<ExportModalProps> = ({ analysisData, onClose }) => {
  const [pdfLoading, setPdfLoading] = useState(false);

  const handlePDF = async () => {
    setPdfLoading(true);
    try {
      await exportPDF();
    } finally {
      setPdfLoading(false);
      onClose();
    }
  };

  const handleCSV = () => {
    exportCSV(analysisData);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Export report"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-[400px] bg-[#0f1011] border border-[#2e2e2e] rounded-[20px] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#2e2e2e]">
          <div>
            <p className="font-mono-data text-[11px] uppercase text-[#847dff] tracking-wider mb-1 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              Export
            </p>
            <h2 className="font-serif-display text-[24px] font-light text-[#ffffff]">
              Download Report
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close export dialog"
            className="w-8 h-8 flex items-center justify-center rounded-full border border-[#3f4041] text-[#9f9fa0] hover:text-[#ffffff] hover:bg-[#2e2e2e] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Options */}
        <div className="p-6 flex flex-col gap-3">
          <button
            onClick={handlePDF}
            disabled={pdfLoading}
            className="flex items-start gap-4 p-4 rounded-[12px] border border-[#3f4041] bg-[#090a0b] hover:bg-[#2e2e2e] hover:border-[#847dff]/50 transition-all cursor-pointer text-left disabled:opacity-60 disabled:cursor-wait"
          >
            <div className="w-10 h-10 rounded-[8px] bg-[#847dff]/15 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-[#847dff]" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[#ffffff] font-sans-ui mb-0.5">
                {pdfLoading ? 'Generating PDF…' : 'PDF Report'}
              </p>
              <p className="text-[12px] text-[#6a6b6b] font-sans-ui leading-snug">
                Full dashboard captured as a paginated PDF document
              </p>
            </div>
          </button>

          <button
            onClick={handleCSV}
            className="flex items-start gap-4 p-4 rounded-[12px] border border-[#3f4041] bg-[#090a0b] hover:bg-[#2e2e2e] hover:border-[#00b3dd]/50 transition-all cursor-pointer text-left"
          >
            <div className="w-10 h-10 rounded-[8px] bg-[#00b3dd]/10 flex items-center justify-center shrink-0">
              <Table2 className="w-5 h-5 text-[#00b3dd]" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[#ffffff] font-sans-ui mb-0.5">
                CSV Data Export
              </p>
              <p className="text-[12px] text-[#6a6b6b] font-sans-ui leading-snug">
                All KPIs, drivers, segments, and ML scores as structured CSV
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
