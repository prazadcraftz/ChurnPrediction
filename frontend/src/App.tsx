import React, { useState, useEffect, lazy, Suspense } from 'react';
import { DropZone } from './components/upload/DropZone';
import { ColumnMappingModal } from './components/upload/ColumnMappingModal';
import { StagedProgress } from './components/upload/StagedProgress';
import { TopBar } from './components/dashboard/TopBar';
import { FilterBar } from './components/dashboard/FilterBar';
import { KpiSummaryRow } from './components/dashboard/KpiSummaryRow';
import { WarningBanner } from './components/common/WarningBanner';
import { ErrorState } from './components/common/ErrorState';
import { ExportModal } from './components/common/ExportModal';
import { ChartSkeleton } from './components/common/SkeletonCard';
import { useActiveSection } from './hooks/useActiveSection';
import { mockAnalysisResult } from './mock/mockAnalysisResult';
import type { AnalysisResult, ColumnMapping, CSVPreview } from './types/analysis';

import { parseFileToPreview, analyzeDatasetClientSide } from './utils/clientAnalysisEngine';

// ── Lazy-load heavy chart / table sections to reduce main bundle size ──
const ChurnDriversSection  = lazy(() => import('./components/dashboard/ChurnDriversSection').then(m => ({ default: m.ChurnDriversSection })));
const SegmentRiskTable     = lazy(() => import('./components/dashboard/SegmentRiskTable').then(m => ({ default: m.SegmentRiskTable })));
const TenureLifecycleChart = lazy(() => import('./components/dashboard/TenureLifecycleChart').then(m => ({ default: m.TenureLifecycleChart })));
const CustomerRiskTable    = lazy(() => import('./components/dashboard/CustomerRiskTable').then(m => ({ default: m.CustomerRiskTable })));
const RecommendationsSection = lazy(() => import('./components/dashboard/RecommendationsSection').then(m => ({ default: m.RecommendationsSection })));

type AppState = 'upload' | 'mapping' | 'processing' | 'dashboard' | 'error';

const SESSION_KEY = 'churn_session_id';
const API_BASE    = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') || (import.meta.env.PROD ? '' : 'http://localhost:8000');

const NAV_LINKS = [
  { id: 'kpis',            label: '01. KPIs Summary' },
  { id: 'drivers',         label: '02. Churn Drivers' },
  { id: 'segments',        label: '03. Risk Segments' },
  { id: 'tenure',          label: '04. Lifecycle Curve' },
  { id: 'predictions',     label: '05. ML Risk Scores' },
  { id: 'recommendations', label: '06. Recommendations' },
];

export function App() {
  const [appState, setAppState]           = useState<AppState>('upload');
  const [selectedFile, setSelectedFile]   = useState<File | null>(null);
  const [analysisData, setAnalysisData]   = useState<AnalysisResult>(mockAnalysisResult);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage]   = useState('');
  const [showExportModal, setShowExportModal] = useState(false);

  // Active section for nav highlighting
  const activeSection = useActiveSection();

  // Dynamic preview for Column Mapping Modal
  const [csvPreview, setCsvPreview] = useState<CSVPreview>({
    headers: ['customerID', 'gender', 'SeniorCitizen', 'Partner', 'Dependents', 'tenure',
              'PhoneService', 'MultipleLines', 'InternetService', 'OnlineSecurity', 'OnlineBackup',
              'DeviceProtection', 'TechSupport', 'StreamingTV', 'StreamingMovies', 'Contract',
              'PaperlessBilling', 'PaymentMethod', 'MonthlyCharges', 'TotalCharges', 'Churn'],
    rows: [
      { customerID: '7590-VHVEG', Contract: 'Month-to-month', InternetService: 'DSL', tenure: '1', MonthlyCharges: '29.85', Churn: 'No' },
      { customerID: '5575-GNVDE', Contract: 'One year',        InternetService: 'DSL', tenure: '34', MonthlyCharges: '56.95', Churn: 'No' },
      { customerID: '3668-QPYBK', Contract: 'Month-to-month', InternetService: 'DSL', tenure: '2', MonthlyCharges: '53.85', Churn: 'Yes' },
    ],
    suggested_mapping: {
      customer_id: 'customerID', churn_label: 'Churn', churn_positive_value: 'Yes',
      tenure: 'tenure', monthly_revenue: 'MonthlyCharges',
    },
    unique_values: {
      Churn: ['Yes', 'No'],
      Contract: ['Month-to-month', 'One year', 'Two year'],
      InternetService: ['DSL', 'Fiber optic', 'No'],
    },
  });

  // ── Session Restore on Mount ──
  useEffect(() => {
    const savedSession = sessionStorage.getItem(SESSION_KEY);
    if (!savedSession || !API_BASE) return;

    fetch(`${API_BASE}/api/results/${savedSession}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setAnalysisData(data);
          setAppState('dashboard');
        }
      })
      .catch(() => { /* silently ignore — backend may not be running */ });
  }, []);

  // ── Handlers ──
  const handleFileSelect = (file: File) => setSelectedFile(file);

  const handleUseSampleData = async () => {
    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/api/sample-data`);
        if (res.ok) {
          setAnalysisData(await res.json());
          setAppState('processing');
          return;
        }
      } catch {
        // fallback to client mock
      }
    }
    setAnalysisData(mockAnalysisResult);
    setAppState('processing');
  };

  const handleStartAnalysis = async () => {
    if (selectedFile) {
      let previewLoaded = false;
      if (API_BASE) {
        try {
          const formData = new FormData();
          formData.append('file', selectedFile);
          const res = await fetch(`${API_BASE}/api/upload-validate`, { method: 'POST', body: formData });
          if (res.ok) {
            setCsvPreview(await res.json());
            previewLoaded = true;
          }
        } catch (e) {
          console.warn('Backend validation call fallback:', e);
        }
      }

      // If backend is not running or failed (e.g. Vercel deployment), parse file in browser
      if (!previewLoaded) {
        try {
          const preview = await parseFileToPreview(selectedFile);
          setCsvPreview(preview);
        } catch (e) {
          console.warn('In-browser preview parse fallback:', e);
        }
      }
    }
    setAppState('mapping');
  };

  const handleConfirmMapping = async (mapping: ColumnMapping) => {
    setAppState('processing');
    if (!selectedFile) return;

    const mappingAny = mapping as ColumnMapping & { _selected_sheet?: string };
    const sheetName = mappingAny._selected_sheet;

    // 1. Try remote FastAPI backend if API_BASE is configured
    if (API_BASE) {
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('mapping', JSON.stringify(mapping));
        if (sheetName) formData.append('sheet_name', sheetName);

        const res = await fetch(`${API_BASE}/api/analyze`, { method: 'POST', body: formData });
        if (res.ok) {
          const result: AnalysisResult = await res.json();
          setAnalysisData(result);
          setSelectedFilters({});
          if (result.session_id) {
            sessionStorage.setItem(SESSION_KEY, result.session_id);
          }
          return;
        }
      } catch (err) {
        console.warn('Remote backend unavailable, falling back to in-browser engine:', err);
      }
    }

    // 2. In-Browser Client-Side Engine (Always works on Vercel without backend server)
    try {
      const result = await analyzeDatasetClientSide(selectedFile, mapping, sheetName);
      setAnalysisData(result);
      setSelectedFilters({});
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setErrorMessage(msg);
      setAppState('error');
    }
  };

  const handleResetUpload = () => {
    setSelectedFile(null);
    setSelectedFilters({});
    sessionStorage.removeItem(SESSION_KEY);
    setAppState('upload');
  };

  const handleFilterChange = (column: string, value: string) =>
    setSelectedFilters((prev) => ({ ...prev, [column]: value }));

  const handleResetFilters = () => setSelectedFilters({});

  // ── Dynamic filter application ──
  const filteredData = React.useMemo(() => {
    let result = { ...analysisData };
    const activeEntries = Object.entries(selectedFilters).filter(([, val]) => val && val !== 'All');
    if (activeEntries.length > 0) {
      let filteredDrivers = [...result.drivers];
      let filteredSegments = [...result.segments];
      activeEntries.forEach(([col, val]) => {
        filteredDrivers = filteredDrivers.map((d) => {
          if (d.factor_name.toLowerCase() === col.toLowerCase()) {
            return { ...d, breakdown: d.breakdown.filter((b) => b.category.toLowerCase() === val.toLowerCase()) };
          }
          return d;
        });
        const matched = filteredSegments.filter(
          (s) => s.segment_name.toLowerCase().includes(val.toLowerCase()) ||
                 s.traits.some((t) => t.toLowerCase().includes(val.toLowerCase()))
        );
        if (matched.length > 0) filteredSegments = matched;
      });
      result = { ...result, drivers: filteredDrivers, segments: filteredSegments };
    }
    return result;
  }, [analysisData, selectedFilters]);

  return (
    <div className="min-h-screen bg-[#0f1011] text-[#f5f5f7] font-sans-ui flex flex-col selection:bg-[#847dff] selection:text-[#0f1011]">
      {/* 1. Upload Page */}
      {appState === 'upload' && (
        <DropZone
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          onClearFile={() => setSelectedFile(null)}
          onStartAnalysis={handleStartAnalysis}
          onUseSampleData={handleUseSampleData}
        />
      )}

      {/* 2. Column Mapping Modal */}
      {appState === 'mapping' && (
        <ColumnMappingModal
          preview={csvPreview}
          onConfirm={handleConfirmMapping}
          onCancel={() => setAppState('upload')}
        />
      )}

      {/* 3. Staged Progress Loader */}
      {appState === 'processing' && (
        <StagedProgress onComplete={() => setAppState('dashboard')} />
      )}

      {/* 4. Error State */}
      {appState === 'error' && (
        <ErrorState
          message={errorMessage}
          onRetry={handleResetUpload}
          onUseSampleData={handleUseSampleData}
        />
      )}

      {/* 5. Main Insights Dashboard */}
      {appState === 'dashboard' && (
        <div id="dashboard-root" className="w-full flex flex-col flex-1">
          {/* Top Bar */}
          <TopBar
            meta={filteredData.meta}
            onResetUpload={handleResetUpload}
            onExportReport={() => setShowExportModal(true)}
          />

          {/* Warning Banner */}
          <WarningBanner warnings={filteredData.meta.warnings} />

          {/* Sticky Dynamic Filter Bar */}
          <FilterBar
            filterOptions={filteredData.filter_options || []}
            selectedFilters={selectedFilters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
          />

          {/* Main Content Area */}
          <main className="max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-10 flex-1">
            {/* Section Nav with Active Highlight */}
            <nav
              aria-label="Dashboard sections"
              className="mb-10 flex items-center gap-4 sm:gap-6 border-b border-[#2e2e2e] pb-3 text-[13px] font-mono-data overflow-x-auto"
            >
              {NAV_LINKS.map(({ id, label }) => {
                const isActive = activeSection === id;
                const isVisible = id !== 'predictions' || !!filteredData.predictions;
                if (!isVisible) return null;
                return (
                  <a
                    key={id}
                    href={`#${id}`}
                    aria-current={isActive ? 'location' : undefined}
                    className={`whitespace-nowrap transition-colors ${
                      isActive
                        ? 'text-[#847dff] border-b-2 border-[#847dff] pb-[2px]'
                        : 'text-[#9f9fa0] hover:text-[#ffffff]'
                    }`}
                  >
                    {label}
                  </a>
                );
              })}
            </nav>

            {/* Section 1: KPI Cards */}
            <div id="kpis">
              <KpiSummaryRow kpis={filteredData.kpis} />
            </div>

            {/* Section 2: Churn Drivers */}
            <div id="drivers">
              <Suspense fallback={<ChartSkeleton title="Churn Drivers" />}>
                <ChurnDriversSection drivers={filteredData.drivers} />
              </Suspense>
            </div>

            {/* Section 3: Segment Risk Table */}
            <div id="segments">
              <Suspense fallback={<ChartSkeleton title="Risk Segments" />}>
                <SegmentRiskTable segments={filteredData.segments} />
              </Suspense>
            </div>

            {/* Section 4: Lifecycle / Tenure Curve */}
            <div id="tenure">
              <Suspense fallback={<ChartSkeleton title="Lifecycle Curve" />}>
                <TenureLifecycleChart
                  tenureCurve={filteredData.tenure_curve}
                  tenureTitle={filteredData.tenure_title}
                />
              </Suspense>
            </div>

            {/* Section 5: ML Risk Predictions */}
            {filteredData.predictions && (
              <div id="predictions">
                <Suspense fallback={<ChartSkeleton title="ML Risk Scores" />}>
                  <CustomerRiskTable predictions={filteredData.predictions} />
                </Suspense>
              </div>
            )}

            {/* Section 6: Recommendations */}
            <div id="recommendations">
              <Suspense fallback={<ChartSkeleton title="Recommendations" />}>
                <RecommendationsSection recommendations={filteredData.recommendations} />
              </Suspense>
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t border-[#2e2e2e] py-8 text-center text-[12px] font-mono-data text-[#6a6b6b] bg-[#090a0b]">
            Origin Customer Churn &amp; Retention Intelligence Engine • Auto-Calibrating Multi-Domain Architecture
          </footer>
        </div>
      )}

      {/* Export Modal (portal-like overlay) */}
      {showExportModal && appState === 'dashboard' && (
        <ExportModal
          analysisData={filteredData}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}

export default App;
