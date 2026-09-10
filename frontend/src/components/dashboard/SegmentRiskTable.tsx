import React, { useState } from 'react';
import type { RiskSegment } from '../../types/analysis';
import { Layers, ArrowUpDown, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

interface SegmentRiskTableProps {
  segments: RiskSegment[];
}

type SortField = 'revenue_at_risk' | 'churn_rate' | 'customer_count';

export const SegmentRiskTable: React.FC<SegmentRiskTableProps> = ({ segments }) => {
  const [sortField, setSortField] = useState<SortField>('revenue_at_risk');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedSegments = [...segments].sort((a, b) => {
    const mult = sortAsc ? 1 : -1;
    return (a[sortField] - b[sortField]) * mult;
  });

  return (
    <section id="segments" className="w-full mb-16" aria-label="High-Risk Customer Cohorts">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-4 border-b border-[#2e2e2e]">
        <div>
          <div className="flex items-center gap-2 text-[#dd90d8] font-mono-data text-[12px] uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" aria-hidden="true" />
            <span>Risk Segmentation</span>
          </div>
          <h2 className="font-serif-display text-[32px] sm:text-[38px] font-light text-[#ffffff] leading-tight">
            High-Risk Customer Cohorts
          </h2>
        </div>
        <p className="text-[14px] text-[#9f9fa0] font-sans-ui max-w-[420px] mt-2 sm:mt-0">
          Ranked by revenue impact. Heatmapped background indicates churn severity. Click a row to see key shared traits.
        </p>
      </div>

      {/* Table Container */}
      <div className="bg-[#090a0b] border border-[#2e2e2e] rounded-[16px] overflow-hidden shadow-[0_18px_20px_0_rgba(0,0,0,0.3)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" role="table" aria-label="Risk segments sorted by revenue impact">
            <thead>
              <tr className="bg-[#0f1011] border-b border-[#2e2e2e] text-[#6a6b6b] font-mono-data text-[12px] uppercase">
                <th className="py-4 px-6 font-medium" role="columnheader">Segment Name</th>
                <th
                  onClick={() => handleSort('customer_count')}
                  role="columnheader"
                  aria-sort={sortField === 'customer_count' ? (sortAsc ? 'ascending' : 'descending') : 'none'}
                  className="py-4 px-6 font-medium cursor-pointer hover:text-[#ffffff] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Customers</span>
                    <ArrowUpDown className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('churn_rate')}
                  role="columnheader"
                  aria-sort={sortField === 'churn_rate' ? (sortAsc ? 'ascending' : 'descending') : 'none'}
                  className="py-4 px-6 font-medium cursor-pointer hover:text-[#ffffff] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Churn Rate</span>
                    <ArrowUpDown className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('revenue_at_risk')}
                  role="columnheader"
                  aria-sort={sortField === 'revenue_at_risk' ? (sortAsc ? 'ascending' : 'descending') : 'none'}
                  className="py-4 px-6 font-medium cursor-pointer hover:text-[#ffffff] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Revenue at Risk</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-[#847dff]" aria-hidden="true" />
                  </div>
                </th>
                <th className="py-4 px-6 font-medium text-right" role="columnheader">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e2e2e]">
              {sortedSegments.map((seg, idx) => {
                const isExpanded = expandedIndex === idx;
                const heatmapOpacity = Math.min(1, seg.churn_rate / 60);

                return (
                  <React.Fragment key={seg.segment_name}>
                    <tr
                      onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                      className="cursor-pointer transition-colors hover:bg-[#847dff]/[0.08]"
                      style={{
                        backgroundColor: `rgba(132, 125, 255, ${heatmapOpacity * 0.12})`,
                      }}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-4 h-4 text-[#847dff] shrink-0" />
                          <span className="font-medium text-[#ffffff] text-[15px]">
                            {seg.segment_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono-data text-[14px] text-[#9f9fa0]">
                        {seg.customer_count.toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#847dff]/20 text-[#ffffff] font-mono-data text-[13px] font-semibold border border-[#847dff]/40">
                          {seg.churn_rate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono-data text-[15px] font-bold text-[#847dff]">
                        ${seg.revenue_at_risk.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        <span className="text-[11px] text-[#6a6b6b] font-normal"> /mo</span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button className="text-[#9f9fa0] hover:text-[#ffffff] p-1.5 rounded-[8px] bg-[#0f1011]">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Traits Row */}
                    {isExpanded && (
                      <tr className="bg-[#0f1011]">
                        <td colSpan={5} className="p-6 border-b border-[#2e2e2e]">
                          <div className="bg-[#2e2e2e]/60 border border-[#3f4041] rounded-[12px] p-5">
                            <h4 className="font-mono-data text-[12px] uppercase text-[#847dff] tracking-wider mb-3">
                              Top Shared Attributes & Behavioral Traits
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {seg.traits.map((trait, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="px-3.5 py-1.5 rounded-[8px] bg-[#090a0b] border border-[#3f4041] text-[13px] text-[#fafafa] font-sans-ui"
                                >
                                  • {trait}
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
