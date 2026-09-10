import React, { useState } from 'react';
import type { ColumnMapping, CSVPreview } from '../../types/analysis';
import { Table, ArrowRight, X } from 'lucide-react';

interface ColumnMappingModalProps {
  preview: CSVPreview;
  onConfirm: (mapping: ColumnMapping) => void;
  onCancel: () => void;
}

export const ColumnMappingModal: React.FC<ColumnMappingModalProps> = ({
  preview,
  onConfirm,
  onCancel,
}) => {
  const [mapping, setMapping] = useState<ColumnMapping>({
    customer_id: preview.suggested_mapping.customer_id || preview.headers[0] || '',
    churn_label: preview.suggested_mapping.churn_label || preview.headers[1] || '',
    churn_positive_value: preview.suggested_mapping.churn_positive_value || 'Yes',
    tenure: preview.suggested_mapping.tenure || '',
    monthly_revenue: preview.suggested_mapping.monthly_revenue || '',
  });


  const [selectedSheet, setSelectedSheet] = useState<string>(
    preview.available_sheets?.[0] ?? ''
  );

  const churnColumnValues = preview.unique_values[mapping.churn_label] || ['Yes', 'No', 'True', 'False', '1', '0'];

  const handleChange = (field: keyof ColumnMapping, value: string) => {
    setMapping((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'churn_label') {
        const uniqueVals = preview.unique_values[value] || ['Yes', 'True', '1'];
        updated.churn_positive_value = uniqueVals[0] || 'Yes';
      }
      return updated;
    });
  };

  const handleConfirm = () => {
    // Attach selected sheet to the mapping as a side-channel (App.tsx picks it up)
    const mappingWithSheet = { ...mapping, _selected_sheet: selectedSheet };
    onConfirm(mappingWithSheet as ColumnMapping);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#000000]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#090a0b] border border-[#3f4041] rounded-[16px] w-full max-w-[760px] max-h-[90vh] flex flex-col shadow-[0_18px_20px_0_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-[#2e2e2e] flex items-center justify-between">
          <div>
            <h2 className="font-serif-display text-[26px] font-light text-[#ffffff]">
              Confirm Column Mapping
            </h2>
            <p className="text-[14px] text-[#9f9fa0] font-sans-ui mt-1">
              Confirm how your dataset columns map to churn metrics for accurate analysis.
            </p>
          </div>
          <button
            onClick={onCancel}
            aria-label="Cancel and go back"
            className="p-2 text-[#9f9fa0] hover:text-[#ffffff] bg-[#2e2e2e] rounded-[8px] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {/* Sheet Selector — only shown for multi-sheet Excel files */}
          {preview.available_sheets && preview.available_sheets.length > 1 && (
            <div className="bg-[#847dff]/[0.08] border border-[#847dff]/30 rounded-[12px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <label className="text-[14px] font-medium text-[#ffffff] flex items-center gap-2">
                  <span>Excel Sheet</span>
                  <span className="text-[#847dff] font-mono-data text-[11px] uppercase">(Multi-sheet detected)</span>
                </label>
                <p className="text-[12px] text-[#9f9fa0] mt-0.5">
                  Your workbook has {preview.available_sheets.length} sheets. Select which one to analyze.
                </p>
              </div>
              <select
                value={selectedSheet}
                onChange={(e) => setSelectedSheet(e.target.value)}
                aria-label="Select Excel sheet to analyze"
                className="w-full sm:w-[260px] bg-[#0f1011] border border-[#847dff]/50 rounded-[8px] px-3 py-2 text-[14px] text-[#ffffff] focus:outline-none focus:border-[#847dff]"
              >
                {preview.available_sheets.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          {/* Mapping Grid */}
          <div className="space-y-4">
            {/* Churn Label Field */}
            <div className="bg-[#2e2e2e]/50 border border-[#3f4041] rounded-[12px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <label className="text-[14px] font-medium text-[#ffffff] flex items-center gap-2">
                  <span>Churn Status Column</span>
                  <span className="text-[#847dff] font-mono-data text-[11px] uppercase">(Required)</span>
                </label>
                <p className="text-[12px] text-[#9f9fa0]">Identifies whether a customer churned or stayed.</p>
              </div>
              <select
                value={mapping.churn_label}
                onChange={(e) => handleChange('churn_label', e.target.value)}
                aria-label="Select churn status column"
                className="w-full sm:w-[260px] bg-[#0f1011] border border-[#3f4041] rounded-[8px] px-3 py-2 text-[14px] text-[#ffffff] focus:outline-none focus:border-[#847dff]"
              >
                {preview.headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Positive Churn Value Selection */}
            {mapping.churn_label && (
              <div className="bg-[#847dff]/[0.06] border border-[#847dff]/20 rounded-[12px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ml-4">
                <div>
                  <label className="text-[13px] font-medium text-[#d1c9ff]">
                    Which value indicates <span className="text-[#ffffff] font-semibold">"Churned"</span>?
                  </label>
                  <p className="text-[12px] text-[#9f9fa0]">Select the string/value in this column representing churn.</p>
                </div>
                <select
                  value={mapping.churn_positive_value}
                  onChange={(e) => handleChange('churn_positive_value', e.target.value)}
                  className="w-full sm:w-[260px] bg-[#0f1011] border border-[#847dff]/40 rounded-[8px] px-3 py-2 text-[14px] text-[#ffffff] focus:outline-none focus:border-[#847dff]"
                >
                  {churnColumnValues.map((v) => (
                    <option key={v} value={v}>
                      "{v}"
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Customer ID Field */}
            <div className="bg-[#2e2e2e]/50 border border-[#3f4041] rounded-[12px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <label className="text-[14px] font-medium text-[#ffffff]">Customer ID Column</label>
                <p className="text-[12px] text-[#9f9fa0]">Unique identifier per customer row.</p>
              </div>
              <select
                value={mapping.customer_id}
                onChange={(e) => handleChange('customer_id', e.target.value)}
                className="w-full sm:w-[260px] bg-[#0f1011] border border-[#3f4041] rounded-[8px] px-3 py-2 text-[14px] text-[#ffffff] focus:outline-none focus:border-[#847dff]"
              >
                {preview.headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Tenure Column */}
            <div className="bg-[#2e2e2e]/50 border border-[#3f4041] rounded-[12px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <label className="text-[14px] font-medium text-[#ffffff]">Tenure Column (Months)</label>
                <p className="text-[12px] text-[#9f9fa0]">Number of months customer has been subscribed.</p>
              </div>
              <select
                value={mapping.tenure}
                onChange={(e) => handleChange('tenure', e.target.value)}
                className="w-full sm:w-[260px] bg-[#0f1011] border border-[#3f4041] rounded-[8px] px-3 py-2 text-[14px] text-[#ffffff] focus:outline-none focus:border-[#847dff]"
              >
                <option value="">(None / Skip)</option>
                {preview.headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Monthly Revenue Column */}
            <div className="bg-[#2e2e2e]/50 border border-[#3f4041] rounded-[12px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <label className="text-[14px] font-medium text-[#ffffff]">Monthly Revenue / Charge ($)</label>
                <p className="text-[12px] text-[#9f9fa0]">Used to calculate Revenue at Risk ($/mo).</p>
              </div>
              <select
                value={mapping.monthly_revenue}
                onChange={(e) => handleChange('monthly_revenue', e.target.value)}
                className="w-full sm:w-[260px] bg-[#0f1011] border border-[#3f4041] rounded-[8px] px-3 py-2 text-[14px] text-[#ffffff] focus:outline-none focus:border-[#847dff]"
              >
                <option value="">(None / Skip)</option>
                {preview.headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Data Sample Preview Box */}
          <div className="bg-[#0f1011] border border-[#2e2e2e] rounded-[12px] p-4">
            <div className="flex items-center gap-2 mb-3 text-[13px] text-[#9f9fa0] font-mono-data">
              <Table className="w-4 h-4 text-[#847dff]" />
              <span>Live Sample Preview (First 3 Rows)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] text-[#fafafa] font-mono-data border-collapse">
                <thead>
                  <tr className="border-b border-[#2e2e2e] text-[#6a6b6b] text-left">
                    {preview.headers.slice(0, 5).map((h) => (
                      <th key={h} className="py-2 px-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 3).map((row, idx) => (
                    <tr key={idx} className="border-b border-[#2e2e2e]/50">
                      {preview.headers.slice(0, 5).map((h) => (
                        <td key={h} className="py-2 px-3 text-[#9f9fa0]">
                          {row[h] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-[#2e2e2e] flex items-center justify-end gap-3 bg-[#090a0b]">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-[8px] text-[14px] text-[#9f9fa0] hover:text-[#ffffff] bg-transparent hover:bg-[#2e2e2e] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2.5 rounded-[8px] bg-[#ffffff] text-[#000000] hover:bg-[#f5f5f7] font-medium text-[14px] flex items-center gap-2 shadow-md hover:scale-[1.02] transition-all cursor-pointer"
          >
            <span>Proceed to Analysis</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
