import React from 'react';
import { AlertOctagon, RefreshCw, Database } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  onUseSampleData: () => void;
}

/**
 * Full-page error screen shown when /api/analyze fails.
 * Provides retry (back to upload) and sample data fallback.
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry,
  onUseSampleData,
}) => {
  return (
    <div
      role="alert"
      className="min-h-screen bg-[#0f1011] flex items-center justify-center px-6"
    >
      <div className="max-w-[560px] w-full text-center">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-[#ff4d4d]/10 border border-[#ff4d4d]/20 flex items-center justify-center">
          <AlertOctagon className="w-9 h-9 text-[#ff4d4d]" aria-hidden="true" />
        </div>

        {/* Heading */}
        <h1 className="font-serif-display text-[40px] font-light text-[#ffffff] leading-tight mb-3">
          Analysis Failed
        </h1>
        <p className="text-[14px] text-[#9f9fa0] font-sans-ui mb-6 leading-relaxed">
          The analysis engine encountered an error while processing your dataset.
        </p>

        {/* Error detail box */}
        <div className="mb-8 px-5 py-4 rounded-[12px] bg-[#ff4d4d]/[0.06] border border-[#ff4d4d]/20 text-left">
          <p className="text-[12px] font-mono-data text-[#ff6b6b] uppercase tracking-wider mb-1">
            Error Detail
          </p>
          <p className="text-[13px] font-mono-data text-[#ffd0d0] leading-relaxed break-words">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onRetry}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-[10px] bg-[#ffffff] text-[#000000] hover:bg-[#f5f5f7] font-medium text-[14px] font-sans-ui transition-all hover:scale-[1.02] cursor-pointer shadow"
            aria-label="Go back and try uploading again"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Try Again
          </button>
          <button
            onClick={onUseSampleData}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-[10px] border border-[#3f4041] bg-[#090a0b] hover:bg-[#2e2e2e] text-[#9f9fa0] hover:text-[#ffffff] font-medium text-[14px] font-sans-ui transition-all cursor-pointer"
            aria-label="Load built-in sample dataset instead"
          >
            <Database className="w-4 h-4" aria-hidden="true" />
            Use Sample Data
          </button>
        </div>
      </div>
    </div>
  );
};
