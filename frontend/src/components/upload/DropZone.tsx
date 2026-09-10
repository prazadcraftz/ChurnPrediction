import React, { useState } from 'react';
import { Upload, FileSpreadsheet, X, ArrowRight, Sparkles, CheckCircle2, FileType } from 'lucide-react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  onUseSampleData: () => void;
  onStartAnalysis: () => void;
  selectedFile: File | null;
  onClearFile: () => void;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFileSelect,
  onUseSampleData,
  onStartAnalysis,
  selectedFile,
  onClearFile,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const validateAndSelect = (file: File) => {
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setErrorMsg('Invalid file format. Please upload a valid CSV or Excel spreadsheet (.csv, .xlsx, .xls).');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('File size exceeds 50MB limit.');
      return;
    }
    setErrorMsg(null);
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[75vh]">
      {/* Header Eyebrow Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ffffff]/[0.08] border border-[#ffffff]/15 text-[#fafafa] font-mono-data text-[11px] tracking-[0.18em] uppercase mb-8">
        <Sparkles className="w-3.5 h-3.5 text-[#847dff]" />
        Universal Churn & Revenue Intelligence
      </div>

      {/* Main Hero Headline */}
      <h1 className="font-serif-display text-[48px] sm:text-[64px] lg:text-[76px] font-light leading-[0.95] tracking-tight text-[#ffffff] text-center mb-6">
        Turn raw customer data into <span className="italic text-[#847dff]">revenue saved</span>.
      </h1>

      <p className="text-[16px] text-[#9f9fa0] font-sans-ui text-center max-w-[580px] leading-[1.6] mb-10">
        Upload any customer dataset (CSV or Excel). Get instant statistical drivers, segment-level risk, revenue at risk, and predictive risk scoring — automatically calibrated to your dataset's columns.
      </p>

      {/* Drop Zone Box */}
      <div className="w-full mb-6">
        {!selectedFile ? (
          <label
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center w-full min-h-[260px] p-8 border-2 border-dashed rounded-[16px] cursor-pointer transition-all duration-200 ${
              isDragOver
                ? 'border-[#847dff] bg-[#847dff]/[0.08] scale-[1.01]'
                : 'border-[#3f4041] bg-[#090a0b] hover:border-[#847dff]/60 hover:bg-[#847dff]/[0.03]'
            }`}
          >
            <input
              type="file"
              accept=".csv, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-full bg-[#2e2e2e] flex items-center justify-center mb-4 text-[#847dff] border border-[#ffffff]/10 shadow-lg">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-[17px] font-medium text-[#ffffff] mb-1">
              Drag and drop your <span className="text-[#847dff]">CSV or Excel</span> file here, or <span className="text-[#847dff] underline underline-offset-4">browse</span>
            </p>
            <div className="flex items-center gap-3 mt-1 text-[12px] text-[#6a6b6b] font-mono-data uppercase tracking-wider">
              <span className="flex items-center gap-1"><FileSpreadsheet className="w-3.5 h-3.5" /> CSV</span>
              <span>•</span>
              <span className="flex items-center gap-1"><FileType className="w-3.5 h-3.5" /> XLSX / XLS</span>
              <span>•</span>
              <span>Max 50MB</span>
            </div>
          </label>
        ) : (
          /* Selected File Chip */
          <div className="w-full bg-[#090a0b] border border-[#847dff]/40 rounded-[16px] p-6 flex items-center justify-between shadow-[0_18px_20px_0_rgba(0,0,0,0.2)]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[8px] bg-[#847dff]/15 text-[#847dff] flex items-center justify-center border border-[#847dff]/30">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[16px] font-medium text-[#ffffff]">{selectedFile.name}</h3>
                  <CheckCircle2 className="w-4 h-4 text-[#00b3dd]" />
                </div>
                <p className="text-[13px] text-[#9f9fa0] font-mono-data">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Auto-adapting schema parameters
                </p>
              </div>
            </div>
            <button
              onClick={onClearFile}
              className="p-2 rounded-[8px] bg-[#2e2e2e] hover:bg-[#3f4041] text-[#9f9fa0] hover:text-[#ffffff] transition-colors cursor-pointer"
              title="Remove file"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="w-full p-4 mb-6 rounded-[8px] bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 text-[#ff4d4d] text-[14px] text-center font-sans-ui">
          {errorMsg}
        </div>
      )}

      {/* Requirements line */}
      <p className="text-[13px] text-[#6a6b6b] font-sans-ui text-center mb-8">
        Works with telecom, banking, e-commerce, and SaaS datasets.
      </p>

      {/* Actions Row */}
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
        {/* Primary White Action Button */}
        <button
          disabled={!selectedFile}
          onClick={onStartAnalysis}
          className={`w-full sm:w-auto min-w-[220px] px-6 py-3.5 rounded-[8px] text-[16px] font-medium transition-all duration-200 flex items-center justify-center gap-3 ${
            selectedFile
              ? 'bg-[#ffffff] text-[#000000] hover:bg-[#f5f5f7] cursor-pointer shadow-[0_4px_14px_0_rgba(255,255,255,0.2)] hover:scale-[1.02]'
              : 'bg-[#2e2e2e] text-[#6a6b6b] cursor-not-allowed border border-[#3f4041]'
          }`}
        >
          <span>Analyze Dataset</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Use Sample Data Button */}
        <button
          onClick={onUseSampleData}
          className="w-full sm:w-auto px-6 py-3.5 rounded-[8px] text-[14px] font-medium text-[#847dff] hover:text-[#ffffff] bg-[#847dff]/[0.08] hover:bg-[#847dff]/20 border border-[#847dff]/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Try with Telco Sample Data</span>
        </button>
      </div>
    </div>
  );
};
