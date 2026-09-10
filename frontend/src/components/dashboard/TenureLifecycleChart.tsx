import React from 'react';
import type { TenureBucket } from '../../types/analysis';
import { Clock, TrendingDown } from 'lucide-react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface TenureLifecycleChartProps {
  tenureCurve: TenureBucket[];
  tenureTitle?: string;
}

export const TenureLifecycleChart: React.FC<TenureLifecycleChartProps> = ({
  tenureCurve,
  tenureTitle,
}) => {
  const displayTitle = tenureTitle || 'Tenure Churn Curve & Value Loss';

  return (
    <section id="tenure" className="w-full mb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-4 border-b border-[#2e2e2e]">
        <div>
          <div className="flex items-center gap-2 text-[#00b3dd] font-mono-data text-[12px] uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            <span>Lifecycle & Retention Dynamics</span>
          </div>
          <h2 className="font-serif-display text-[32px] sm:text-[38px] font-light text-[#ffffff] leading-tight">
            {displayTitle}
          </h2>
        </div>
        <p className="text-[14px] text-[#9f9fa0] font-sans-ui max-w-[420px] mt-2 sm:mt-0">
          Evaluates churn probability and cumulative value loss across duration cohorts.
        </p>
      </div>

      {/* Chart Card */}
      <div className="bg-[#090a0b] border border-[#2e2e2e] rounded-[16px] p-6 shadow-[0_18px_20px_0_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-[#00b3dd]/15 text-[#00b3dd] flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[16px] font-medium text-[#ffffff]">Churn Rate % & Cumulative Value Loss ($)</h3>
              <p className="text-[12px] text-[#6a6b6b] font-mono-data">x-axis: Cohort / Duration Bucket</p>
            </div>
          </div>
        </div>

        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={tenureCurve} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" vertical={false} />
              <XAxis
                dataKey="tenure_bucket"
                stroke="#6a6b6b"
                tick={{ fill: '#9f9fa0', fontSize: 12, fontFamily: 'Inter' }}
              />
              <YAxis
                yAxisId="left"
                stroke="#00b3dd"
                tick={{ fill: '#00b3dd', fontSize: 12, fontFamily: 'Roboto Mono' }}
                unit="%"
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#847dff"
                tick={{ fill: '#847dff', fontSize: 12, fontFamily: 'Roboto Mono' }}
                unit="$"
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f1011',
                  borderColor: '#3f4041',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontFamily: 'Inter',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                }}
                formatter={(value: any, name: any) => {
                  if (name === 'Churn Rate') return [`${Number(value).toFixed(1)}%`, 'Churn Rate'];
                  if (name === 'Cumulative Value Lost')
                    return [`$${Number(value).toLocaleString()}`, 'Cumulative Value Lost'];
                  return [value, name];
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '20px', fontFamily: 'Inter', fontSize: '13px' }}
              />
              <Bar
                yAxisId="right"
                dataKey="cumulative_revenue_lost"
                name="Cumulative Value Lost"
                fill="#847dff"
                opacity={0.35}
                radius={[6, 6, 0, 0]}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="churn_rate"
                name="Churn Rate"
                stroke="#00b3dd"
                strokeWidth={3}
                dot={{ fill: '#00b3dd', r: 5 }}
                activeDot={{ r: 8, fill: '#ffffff', stroke: '#00b3dd', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
};
