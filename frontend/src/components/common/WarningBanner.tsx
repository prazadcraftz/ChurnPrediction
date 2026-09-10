import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface WarningBannerProps {
  warnings: string[];
}

/**
 * Dismissible amber warning banner that surfaces meta.warnings[] from the backend.
 * Hidden automatically when there are no warnings.
 */
export const WarningBanner: React.FC<WarningBannerProps> = ({ warnings }) => {
  const [dismissed, setDismissed] = useState(false);

  if (!warnings || warnings.length === 0 || dismissed) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className="max-w-[1200px] mx-auto px-6 pt-4"
    >
      <div className="flex items-start gap-3 px-5 py-4 rounded-[12px] bg-[#ffaa00]/[0.08] border border-[#ffaa00]/30">
        <AlertTriangle
          className="w-5 h-5 text-[#ffaa00] shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-[#ffcc55] mb-1">
            {warnings.length === 1 ? 'Data Quality Notice' : `${warnings.length} Data Quality Notices`}
          </p>
          <ul className="text-[12px] text-[#d4a843] font-sans-ui leading-relaxed space-y-0.5 list-none">
            {warnings.map((w, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-[#ffaa00] mt-[2px] shrink-0">•</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss warnings"
          className="shrink-0 text-[#ffaa00]/60 hover:text-[#ffaa00] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
