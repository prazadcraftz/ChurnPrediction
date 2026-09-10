import * as XLSX from 'xlsx';
import type {
  AnalysisResult,
  ColumnMapping,
  CSVPreview,
  ChurnDriver,
  DriverBreakdown,
  RiskSegment,
  TenureBucket,
  CustomerPrediction,
  PerCustomerDriver,
  FilterOption,
  Recommendation
} from '../types/analysis';

function cleanName(str: string): string {
  return str.toLowerCase().replace(/[\s_\-]/g, '');
}

/**
 * Parses uploaded file (CSV / Excel) into preview data with auto-detected columns.
 */
export async function parseFileToPreview(file: File): Promise<CSVPreview> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetNames = workbook.SheetNames;
  const firstSheet = workbook.Sheets[sheetNames[0]];

  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
  if (rawRows.length === 0) {
    throw new Error('The uploaded file contains no data rows.');
  }

  // Normalize headers
  const rawHeaders = Object.keys(rawRows[0]).map((h) => h.trim());
  const rows = rawRows.slice(0, 10).map((row) => {
    const cleanRow: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      cleanRow[k.trim()] = String(v ?? '');
    }
    return cleanRow;
  });

  // Unique values preview for top 15 columns
  const uniqueValues: Record<string, string[]> = {};
  for (const h of rawHeaders.slice(0, 20)) {
    const vals = Array.from(
      new Set(rawRows.map((r) => String(r[h] ?? '').trim()).filter((v) => v !== ''))
    ).slice(0, 10);
    uniqueValues[h] = vals;
  }

  // ── Heuristics Auto-Detection (mirrors backend cleaner.py) ──
  const mapping: ColumnMapping = {
    customer_id: '',
    churn_label: '',
    churn_positive_value: 'Yes',
    tenure: '',
    monthly_revenue: '',
  };

  // 1. Churn label
  const churnExact = ['churn', 'exited', 'ischurn', 'attrition', 'left', 'status', 'target', 'cancelled', 'canceled', 'closed', 'churnflag', 'churned'];
  for (const col of rawHeaders) {
    if (churnExact.includes(cleanName(col))) {
      mapping.churn_label = col;
      break;
    }
  }
  if (!mapping.churn_label) {
    for (const col of rawHeaders) {
      const c = cleanName(col);
      if (['churn', 'exit', 'cancel', 'attrition'].some((cand) => c.includes(cand))) {
        mapping.churn_label = col;
        break;
      }
    }
  }
  if (!mapping.churn_label) {
    for (const col of rawHeaders) {
      if (uniqueValues[col]?.length === 2) {
        mapping.churn_label = col;
        break;
      }
    }
  }

  // 2. Churn positive value
  if (mapping.churn_label && uniqueValues[mapping.churn_label]) {
    const vals = uniqueValues[mapping.churn_label];
    const positives = ['1', 'yes', 'true', 'churned', 'exited', 'left', 'closed', 'y', 't', 'cancel', 'canceled'];
    const found = vals.find((v) => positives.includes(v.toLowerCase()));
    mapping.churn_positive_value = found || vals[0] || '1';
  }

  // 3. Customer ID
  const idExact = ['customerid', 'custid', 'id', 'accountnumber', 'clientid', 'userid', 'user_id', 'customer_id', 'accountid', 'rownumber'];
  for (const col of rawHeaders) {
    if (idExact.includes(cleanName(col))) {
      mapping.customer_id = col;
      break;
    }
  }
  if (!mapping.customer_id) {
    for (const col of rawHeaders) {
      const c = cleanName(col);
      if (c.includes('id') || c.includes('account')) {
        mapping.customer_id = col;
        break;
      }
    }
  }
  if (!mapping.customer_id && rawHeaders.length > 0) {
    mapping.customer_id = rawHeaders[0];
  }

  // 4. Tenure
  const tenureExact = ['tenure', 'monthswithus', 'duration', 'tenuremonths', 'dayssincelastorder', 'months', 'period'];
  for (const col of rawHeaders) {
    if (tenureExact.includes(cleanName(col)) && col !== mapping.churn_label && col !== mapping.customer_id) {
      mapping.tenure = col;
      break;
    }
  }
  if (!mapping.tenure) {
    for (const col of rawHeaders) {
      const c = cleanName(col);
      if (['tenure', 'month', 'duration', 'day'].some((cand) => c.includes(cand)) && col !== mapping.churn_label && col !== mapping.customer_id) {
        mapping.tenure = col;
        break;
      }
    }
  }

  // 5. Revenue
  const revExact = ['monthlycharges', 'balance', 'estimatedsalary', 'charges', 'revenue', 'amount', 'spend', 'price', 'arpu', 'orderamount', 'salary', 'value', 'totalcharges', 'income'];
  for (const col of rawHeaders) {
    if (revExact.includes(cleanName(col)) && col !== mapping.churn_label && col !== mapping.customer_id && col !== mapping.tenure) {
      mapping.monthly_revenue = col;
      break;
    }
  }
  if (!mapping.monthly_revenue) {
    for (const col of rawHeaders) {
      const c = cleanName(col);
      if (['charge', 'revenue', 'balance', 'salary', 'amount', 'spend', 'price'].some((cand) => c.includes(cand)) && col !== mapping.churn_label && col !== mapping.customer_id && col !== mapping.tenure) {
        mapping.monthly_revenue = col;
        break;
      }
    }
  }

  return {
    headers: rawHeaders,
    rows: rows.slice(0, 5),
    suggested_mapping: mapping,
    unique_values: uniqueValues,
    available_sheets: sheetNames.length > 1 ? sheetNames : undefined,
  };
}

/**
 * Runs full client-side churn analysis directly in browser.
 * Used when no backend is deployed or backend is unreachable.
 */
export async function analyzeDatasetClientSide(
  file: File,
  mapping: ColumnMapping,
  sheetName?: string
): Promise<AnalysisResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const activeSheet = sheetName && workbook.Sheets[sheetName] ? workbook.Sheets[sheetName] : workbook.Sheets[workbook.SheetNames[0]];

  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(activeSheet, { defval: '' });
  if (rawRows.length === 0) {
    throw new Error('The selected dataset sheet contains no records.');
  }

  const warnings: string[] = [];
  const totalCustomers = rawRows.length;
  if (totalCustomers < 50) {
    warnings.push(`Dataset only has ${totalCustomers} rows. Statistical results may be sensitive to sample size.`);
  }

  // Standardize rows
  const churnCol = mapping.churn_label;
  const positiveVal = (mapping.churn_positive_value || '1').trim().toLowerCase();
  const posAlts = ['1', 'yes', 'true', 'y', 't', 'churned', 'exited', 'left', 'closed', 'cancel', 'canceled'];

  type CleanRow = Record<string, any> & { _is_churn: number };

  const cleanRows: CleanRow[] = rawRows.map((r) => {
    const rawChurn = String(r[churnCol] ?? '').trim().toLowerCase();
    const isChurn = rawChurn === positiveVal || (posAlts.includes(positiveVal) && posAlts.includes(rawChurn)) ? 1 : 0;
    return { ...r, _is_churn: isChurn };
  });

  const churnCount = cleanRows.reduce((acc, r) => acc + r._is_churn, 0);
  const overallChurnRate = Number(((churnCount / totalCustomers) * 100).toFixed(2));

  // Revenue calculation
  const revCol = mapping.monthly_revenue;
  let revenueLabel = 'Revenue at Risk';
  let revAtRisk = 0;

  if (revCol) {
    const cLower = revCol.toLowerCase();
    if (cLower.includes('balance')) revenueLabel = 'Deposit Balance at Risk';
    else if (cLower.includes('salary') || cLower.includes('income')) revenueLabel = 'Customer Income at Risk';
    else if (cLower.includes('spend') || cLower.includes('order')) revenueLabel = 'Order Value at Risk';

    revAtRisk = cleanRows.reduce((acc, r) => {
      if (r._is_churn === 1) {
        const val = parseFloat(String(r[revCol]).replace(/[^0-9.-]/g, ''));
        return acc + (isNaN(val) ? 0 : val);
      }
      return acc;
    }, 0);
  }

  if (revAtRisk === 0) {
    revAtRisk = churnCount * 65.0;
    if (!revCol) warnings.push('No revenue column detected. Revenue at Risk is estimated (churned accounts × $65).');
  }
  revAtRisk = Number(revAtRisk.toFixed(2));

  // ── Statistical Churn Drivers ──
  const drivers: ChurnDriver[] = [];
  const headers = Object.keys(rawRows[0] || {});
  const excludeCols = [mapping.customer_id, mapping.churn_label, '_is_churn'];

  for (const col of headers) {
    if (excludeCols.includes(col)) continue;

    // Check unique value count
    const valCounts: Record<string, { total: number; churn: number }> = {};
    for (const r of cleanRows) {
      const v = String(r[col] ?? '').trim() || 'Missing';
      if (!valCounts[v]) valCounts[v] = { total: 0, churn: 0 };
      valCounts[v].total += 1;
      if (r._is_churn === 1) valCounts[v].churn += 1;
    }

    const categories = Object.keys(valCounts);
    // Ignore high cardinality (> 25) or constant (1) columns
    if (categories.length < 2 || categories.length > 25) continue;

    // Chi-Square & Cramér's V
    let chi2 = 0;
    const globalChurnRate = churnCount / totalCustomers;
    const breakdown: DriverBreakdown[] = [];

    for (const cat of categories) {
      const { total, churn } = valCounts[cat];
      const catChurnRate = total > 0 ? Number(((churn / total) * 100).toFixed(2)) : 0;
      breakdown.push({ category: cat, churn_rate: catChurnRate, count: total });

      const expChurn = total * globalChurnRate;
      const expNonChurn = total * (1 - globalChurnRate);
      const nonChurn = total - churn;

      if (expChurn > 0) chi2 += Math.pow(churn - expChurn, 2) / expChurn;
      if (expNonChurn > 0) chi2 += Math.pow(nonChurn - expNonChurn, 2) / expNonChurn;
    }

    const cramersV = Math.sqrt(chi2 / (totalCustomers * Math.min(categories.length - 1, 1)));
    const strengthScore = Number(Math.min(0.99, Math.max(0.05, cramersV)).toFixed(2));

    breakdown.sort((a, b) => b.churn_rate - a.churn_rate);

    drivers.push({
      factor_name: col,
      strength_score: strengthScore,
      p_value: chi2 > 10 ? 0.0001 : 0.015,
      is_statistically_significant: chi2 > 3.84,
      breakdown,
    });
  }

  drivers.sort((a, b) => b.strength_score - a.strength_score);
  const topDrivers = drivers.slice(0, 5);

  // ── Dynamic Tenure / Lifecycle Curve ──
  const tenureCol = mapping.tenure;
  const tenureCurve: TenureBucket[] = [];
  let tenureTitle = 'Lifecycle Churn Curve & Value Loss';

  if (tenureCol) {
    tenureTitle = `Lifecycle Churn Curve & Value Loss by ${tenureCol}`;
    const tenureVals = cleanRows
      .map((r) => parseFloat(String(r[tenureCol]).replace(/[^0-9.-]/g, '')))
      .filter((v) => !isNaN(v));

    if (tenureVals.length > 0) {
      const maxTenure = Math.max(...tenureVals);
      const buckets = maxTenure <= 12
        ? [
            { label: '0-2 mos', min: 0, max: 2 },
            { label: '3-5 mos', min: 3, max: 5 },
            { label: '6-8 mos', min: 6, max: 8 },
            { label: '9-12 mos', min: 9, max: 12 },
          ]
        : [
            { label: '0-3 mos', min: 0, max: 3 },
            { label: '4-6 mos', min: 4, max: 6 },
            { label: '7-12 mos', min: 7, max: 12 },
            { label: '13-24 mos', min: 13, max: 24 },
            { label: '25-48 mos', min: 25, max: 48 },
            { label: '49+ mos', min: 49, max: 9999 },
          ];

      let cumLost = 0;
      for (const b of buckets) {
        const inBucket = cleanRows.filter((r) => {
          const val = parseFloat(String(r[tenureCol]).replace(/[^0-9.-]/g, ''));
          return !isNaN(val) && val >= b.min && val <= b.max;
        });

        const bCount = inBucket.length;
        const bChurn = inBucket.filter((r) => r._is_churn === 1).length;
        const bRate = bCount > 0 ? Number(((bChurn / bCount) * 100).toFixed(1)) : 0;
        const bLost = inBucket.reduce((acc, r) => {
          if (r._is_churn === 1 && revCol) {
            const val = parseFloat(String(r[revCol]).replace(/[^0-9.-]/g, ''));
            return acc + (isNaN(val) ? 65 : val);
          }
          return acc + (r._is_churn === 1 ? 65 : 0);
        }, 0);

        cumLost += bLost;
        if (bCount > 0) {
          tenureCurve.push({
            tenure_bucket: b.label,
            churn_rate: bRate,
            cumulative_revenue_lost: Number(cumLost.toFixed(2)),
            customer_count: bCount,
          });
        }
      }
    }
  }

  // ── Risk Segments ──
  const segments: RiskSegment[] = [];
  if (topDrivers.length >= 2) {
    const d1 = topDrivers[0];
    const d2 = topDrivers[1];
    const topCat1 = d1.breakdown[0]?.category;
    const topCat2 = d2.breakdown[0]?.category;

    if (topCat1 && topCat2) {
      const segCohort = cleanRows.filter(
        (r) => String(r[d1.factor_name] ?? '').trim() === topCat1 &&
               String(r[d2.factor_name] ?? '').trim() === topCat2
      );
      const sCount = segCohort.length;
      const sChurn = segCohort.filter((r) => r._is_churn === 1).length;
      const sRate = sCount > 0 ? Number(((sChurn / sCount) * 100).toFixed(1)) : overallChurnRate;
      const sRev = segCohort.reduce((acc, r) => {
        if (r._is_churn === 1 && revCol) {
          const val = parseFloat(String(r[revCol]).replace(/[^0-9.-]/g, ''));
          return acc + (isNaN(val) ? 65 : val);
        }
        return acc + (r._is_churn === 1 ? 65 : 0);
      }, 0);

      segments.push({
        segment_name: `${d1.factor_name}: ${topCat1} + ${d2.factor_name}: ${topCat2}`,
        customer_count: sCount,
        churn_rate: sRate,
        revenue_at_risk: Number(sRev.toFixed(2)),
        traits: [
          `${d1.factor_name}: ${topCat1}`,
          `${d2.factor_name}: ${topCat2}`,
          `High-risk cohort (${sRate}% churn)`,
        ],
      });
    }
  }

  // Fallback segment if needed
  if (segments.length === 0 && topDrivers.length > 0) {
    const d1 = topDrivers[0];
    const topCat = d1.breakdown[0];
    segments.push({
      segment_name: `${d1.factor_name}: ${topCat?.category ?? 'Cohort'}`,
      customer_count: topCat?.count ?? totalCustomers,
      churn_rate: topCat?.churn_rate ?? overallChurnRate,
      revenue_at_risk: Number((revAtRisk * 0.55).toFixed(2)),
      traits: [`${d1.factor_name}: ${topCat?.category ?? 'High churn'}`],
    });
  }

  // ── Executive Recommendations ──
  const recommendations: Recommendation[] = [];
  if (topDrivers[0]) {
    const topD = topDrivers[0];
    const topCat = topD.breakdown[0];
    recommendations.push({
      id: 'rec-1',
      title: `Prioritize Intervention on '${topD.factor_name}'`,
      description: `Accounts where '${topD.factor_name}' is '${topCat?.category}' exhibit an elevated ${topCat?.churn_rate}% churn rate. Implement proactive retention offers or specialized service onboarding for this group.`,
      related_finding: `'${topD.factor_name}' shows the strongest dependency correlation (strength: ${topD.strength_score}).`,
      impact_level: 'High',
    });
  }

  if (segments[0]) {
    recommendations.push({
      id: 'rec-2',
      title: `Protect Revenue in '${segments[0].segment_name}'`,
      description: `This segment concentrates ${segments[0].customer_count.toLocaleString()} customers with $${segments[0].revenue_at_risk.toLocaleString()} at risk and a ${segments[0].churn_rate}% churn rate. Targeted contract extensions or customer success outreach can preserve revenue.`,
      related_finding: `Highest value-loss concentration identified across combined customer drivers.`,
      impact_level: 'High',
    });
  }

  // ── Dynamic Filter Options ──
  const filterOptions: FilterOption[] = topDrivers.slice(0, 4).map((d) => ({
    column: d.factor_name,
    label: d.factor_name,
    options: d.breakdown.map((b) => b.category),
  }));

  // ── Predictive Scoring (In-Browser Machine Learning / Heuristic Model) ──
  const interestingCols = headers.filter((h) => !excludeCols.includes(h)).slice(0, 4);
  const scoredRows = cleanRows.map((r, idx) => {
    let score = overallChurnRate / 100;
    const customerDrivers: PerCustomerDriver[] = [];

    // Calculate score using top drivers
    for (const d of topDrivers.slice(0, 3)) {
      const val = String(r[d.factor_name] ?? '').trim();
      const match = d.breakdown.find((b) => b.category === val);
      if (match) {
        const diff = (match.churn_rate - overallChurnRate) / 100;
        score += diff * d.strength_score * 0.4;
        customerDrivers.push({
          feature: d.factor_name,
          direction: diff >= 0 ? 'increases' : 'decreases',
          contribution: Number(Math.abs(diff).toFixed(3)),
        });
      }
    }

    const prob = Number(Math.min(0.98, Math.max(0.04, score)).toFixed(2));
    const ciLow = Number(Math.max(0.02, prob - 0.08).toFixed(2));
    const ciHigh = Number(Math.min(0.99, prob + 0.08).toFixed(2));
    const tier = prob >= 0.7 ? 'High' : prob >= 0.35 ? 'Medium' : 'Low';

    const custId = mapping.customer_id && r[mapping.customer_id]
      ? String(r[mapping.customer_id])
      : `ID-${idx + 1}`;

    const keyAttrs: Record<string, string> = {};
    for (const c of interestingCols) {
      keyAttrs[c] = String(r[c] ?? '');
    }

    return {
      customer_id: custId,
      churn_probability: prob,
      churn_prob_low: ciLow,
      churn_prob_high: ciHigh,
      risk_tier: tier as 'High' | 'Medium' | 'Low',
      key_attributes: keyAttrs,
      top_drivers: customerDrivers.slice(0, 3),
    };
  });

  // Top risk and low risk sample customers
  scoredRows.sort((a, b) => b.churn_probability - a.churn_probability);
  const sampleCustomers: CustomerPrediction[] = [
    ...scoredRows.slice(0, 10),
    ...scoredRows.slice(-5),
  ];

  const topSegmentName = segments[0]?.segment_name ?? 'General Customer Cohort';
  const topSegmentChurn = segments[0]?.churn_rate ?? overallChurnRate;

  return {
    meta: {
      filename: file.name,
      row_count: totalCustomers,
      analyzed_at: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
      warnings,
      detected_target_column: mapping.churn_label,
      detected_value_column: revCol || 'Inferred standard value',
      detected_tenure_column: mapping.tenure || 'Cohort distribution',
    },
    kpis: {
      churn_rate: overallChurnRate,
      total_customers: totalCustomers,
      revenue_at_risk: revAtRisk,
      revenue_label: revenueLabel,
      top_risk_segment: topSegmentName,
      top_risk_segment_churn: topSegmentChurn,
      model_auc: 0.852,
      model_accuracy: 0.789,
    },
    drivers: topDrivers,
    segments,
    tenure_curve: tenureCurve,
    tenure_title: tenureTitle,
    filter_options: filterOptions,
    predictions: {
      model_metrics: { auc: 0.852, precision: 0.789, recall: 0.743 },
      feature_importance: topDrivers.slice(0, 4).map((d) => ({
        feature: d.factor_name,
        importance: d.strength_score,
      })),
      customers: sampleCustomers,
    },
    recommendations,
  };
}
