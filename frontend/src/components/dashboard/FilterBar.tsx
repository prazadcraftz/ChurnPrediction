import React from 'react';
import type { FilterOption } from '../../types/analysis';
import { Filter, RotateCcw } from 'lucide-react';

interface FilterBarProps {
  filterOptions: FilterOption[];
  selectedFilters: Record<string, string>;
  onFilterChange: (column: string, value: string) => void;
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filterOptions,
  selectedFilters,
  onFilterChange,
  onReset,
}) => {
  const isFiltered = Object.values(selectedFilters).some((val) => val !== 'All' && val !== '');

  if (!filterOptions || filterOptions.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#090a0b] border-b border-[#2e2e2e] py-3.5 px-6" role="toolbar" aria-label="Dataset filters">
      <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Filter Label */}
        <div className="flex items-center gap-2 text-[#9f9fa0] font-mono-data text-[12px] uppercase tracking-wider">
          <Filter className="w-4 h-4 text-[#847dff]" aria-hidden="true" />
          <span>Dynamic Dataset Filters</span>
        </div>

        {/* Dynamic Controls Row */}
        <div className="flex flex-wrap items-center gap-4">
          {filterOptions.map((opt) => {
            const currentVal = selectedFilters[opt.column] || 'All';
            const selectId = `filter-${opt.column}`;

            return (
              <div key={opt.column} className="flex items-center gap-2">
                <label htmlFor={selectId} className="text-[13px] text-[#6a6b6b] font-sans-ui">{opt.label}:</label>
                <select
                  id={selectId}
                  value={currentVal}
                  onChange={(e) => onFilterChange(opt.column, e.target.value)}
                  aria-label={`Filter by ${opt.label}`}
                  className="bg-[#0f1011] border border-[#3f4041] rounded-[8px] px-3 py-1.5 text-[13px] text-[#ffffff] focus:outline-none focus:border-[#847dff]"
                >
                  <option value="All">All {opt.label}s</option>
                  {opt.options.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            );
          })}

          {/* Reset Button */}
          {isFiltered && (
            <button
              onClick={onReset}
              aria-label="Reset all filters"
              className="flex items-center gap-1.5 text-[12px] text-[#847dff] hover:text-[#ffffff] bg-[#847dff]/10 hover:bg-[#847dff]/20 px-3 py-1.5 rounded-[8px] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
