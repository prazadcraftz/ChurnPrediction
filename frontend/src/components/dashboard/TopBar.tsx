import React from 'react';
import type { AnalysisMeta } from '../../types/analysis';
import { ArrowLeft, Download, FileSpreadsheet, Calendar } from 'lucide-react';

interface TopBarProps {
  meta: AnalysisMeta;
  onResetUpload: () => void;
  onExportReport: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ meta, onResetUpload, onExportReport }) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0f1011]/85 backdrop-blur-[24px] border-b border-[#2e2e2e]">
      <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand / Title Left */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[8px] bg-[#ffffff] text-[#000000] font-serif-display font-light text-[20px] flex items-center justify-center">
              O
            </div>
            <span className="font-serif-display text-[22px] font-light tracking-wide text-[#ffffff]">
              Origin
            </span>
          </div>

          <div className="h-5 w-[1px] bg-[#3f4041]" />

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2e2e2e] text-[#fafafa] font-mono-data text-[12px]">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#847dff]" />
              <span className="truncate max-w-[200px]">{meta.filename}</span>
            </div>
            <div className="hidden md:flex items-center gap-1 text-[12px] text-[#6a6b6b] font-mono-data">
              <Calendar className="w-3.5 h-3.5" />
              <span>{meta.analyzed_at}</span>
            </div>
          </div>
        </div>

        {/* Actions Right */}
        <div className="flex items-center gap-3">
          <button
            onClick={onResetUpload}
            aria-label="Upload a new dataset"
            className="px-4 py-2 rounded-[8px] border border-[#3f4041] bg-[#090a0b] hover:bg-[#2e2e2e] text-[#9f9fa0] hover:text-[#ffffff] text-[13px] font-medium font-sans-ui flex items-center gap-2 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Upload New Dataset</span>
          </button>

          <button
            onClick={onExportReport}
            aria-label="Export analysis report"
            className="px-4 py-2 rounded-[8px] bg-[#ffffff] text-[#000000] hover:bg-[#f5f5f7] text-[13px] font-medium font-sans-ui flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Export Report</span>
          </button>
        </div>
      </div>
    </header>
  );
};
