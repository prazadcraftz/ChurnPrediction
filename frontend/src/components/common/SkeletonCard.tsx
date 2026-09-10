import React from 'react';

interface SkeletonCardProps {
  height?: string;
  className?: string;
  lines?: number;
}

/**
 * Animated shimmer skeleton placeholder used while dashboard sections load.
 */
export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  height = 'h-48',
  className = '',
  lines = 0,
}) => {
  return (
    <div
      className={`bg-[#090a0b] border border-[#2e2e2e] rounded-[16px] overflow-hidden relative ${height} ${className}`}
    >
      {/* Shimmer sweep */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-[#2e2e2e]/60 to-transparent" />

      {lines > 0 && (
        <div className="p-6 flex flex-col gap-3">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className="h-3 rounded-full bg-[#1a1a1a]"
              style={{ width: `${85 - i * 12}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/** Row of 4 KPI skeleton cards matching KpiSummaryRow layout */
export const KpiSkeletonRow: React.FC = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
    {[1, 2, 3, 4].map((i) => (
      <SkeletonCard key={i} height="h-36" />
    ))}
  </div>
);

/** Single tall skeleton for chart sections */
export const ChartSkeleton: React.FC<{ title?: string }> = ({ title }) => (
  <section className="w-full mb-16">
    {title && (
      <div className="h-8 w-48 bg-[#1a1a1a] rounded-full mb-6" />
    )}
    <SkeletonCard height="h-72" lines={0} />
  </section>
);
