import React, { useState } from 'react';
import type { ChurnDriver } from '../../types/analysis';
import { Sparkles, ChevronDown, ChevronUp, BarChart3, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ChurnDriversSectionProps {
  drivers: ChurnDriver[];
}

export const ChurnDriversSection: React.FC<ChurnDriversSectionProps> = ({ drivers }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <section id="drivers" className="w-full mb-16">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-4 border-b border-[#2e2e2e]">
        <div>
          <div className="flex items-center gap-2 text-[#847dff] font-mono-data text-[12px] uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Statistical Analysis</span>
          </div>
          <h2 className="font-serif-display text-[32px] sm:text-[38px] font-light text-[#ffffff] leading-tight">
            Key Drivers of Customer Churn
          </h2>
        </div>
        <p className="text-[14px] text-[#9f9fa0] font-sans-ui max-w-[420px] mt-2 sm:mt-0">
          Factors ranked by chi-square correlation strength. Click any factor row to inspect category churn breakdown.
        </p>
      </div>

      {/* Drivers Container */}
      <div className="space-y-4">
        {drivers.map((driver, idx) => {
          const isExpanded = expandedIndex === idx;
          const percentageWidth = `${Math.round(driver.strength_score * 100)}%`;

          return (
            <div
              key={driver.factor_name}
              className="bg-[#2e2e2e] border border-[#3f4041] hover:border-[#847dff]/50 rounded-[16px] overflow-hidden transition-all duration-200"
            >
              {/* Factor Summary Bar */}
              <div
                onClick={() => toggleExpand(idx)}
                className="p-5 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex-1 pr-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono-data text-[14px] text-[#6a6b6b] min-w-[24px]">
                        0{idx + 1}
                      </span>
                      <h3 className="text-[17px] font-medium text-[#ffffff]">{driver.factor_name}</h3>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Statistical Significance Tag */}
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00b3dd]/10 text-[#00b3dd] font-mono-data text-[11px] border border-[#00b3dd]/20">
                        <CheckCircle className="w-3 h-3" />
                        <span>p = {driver.p_value < 0.001 ? '< 0.001' : driver.p_value.toFixed(4)}</span>
                      </div>

                      <span className="font-mono-data text-[13px] text-[#847dff] font-semibold">
                        {(driver.strength_score * 100).toFixed(0)}% Score
                      </span>
                    </div>
                  </div>

                  {/* Visual Strength Bar */}
                  <div className="w-full h-2.5 bg-[#0f1011] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#847dff] to-[#00b3dd] rounded-full transition-all duration-500"
                      style={{ width: percentageWidth }}
                    />
                  </div>
                </div>

                <button className="text-[#9f9fa0] hover:text-[#ffffff] p-1.5 rounded-[8px] bg-[#0f1011] border border-[#3f4041]">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Expanded Breakdown Chart */}
              {isExpanded && (
                <div className="p-6 bg-[#090a0b] border-t border-[#3f4041] animate-in fade-in duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[14px] font-mono-data text-[#9f9fa0] uppercase tracking-wider flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#00b3dd]" />
                      <span>Churn Rate Breakdown by {driver.factor_name}</span>
                    </h4>
                    <span className="text-[12px] text-[#6a6b6b] font-sans-ui">
                      Every chart earns a sentence: {driver.breakdown[0].category} accounts for highest churn risk at {driver.breakdown[0].churn_rate.toFixed(1)}%.
                    </span>
                  </div>

                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={driver.breakdown} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                        <XAxis
                          dataKey="category"
                          stroke="#6a6b6b"
                          tick={{ fill: '#9f9fa0', fontSize: 12, fontFamily: 'Inter' }}
                        />
                        <YAxis
                          stroke="#6a6b6b"
                          tick={{ fill: '#9f9fa0', fontSize: 12, fontFamily: 'Roboto Mono' }}
                          unit="%"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f1011',
                            borderColor: '#3f4041',
                            borderRadius: '8px',
                            color: '#ffffff',
                            fontFamily: 'Inter',
                          }}
                          formatter={(value: any) => [`${Number(value).toFixed(1)}% Churn Rate`, 'Churn Rate']}
                        />
                        <Bar dataKey="churn_rate" radius={[6, 6, 0, 0]}>
                          {driver.breakdown.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.churn_rate > 35 ? '#847dff' : entry.churn_rate > 20 ? '#00b3dd' : '#3f4041'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
