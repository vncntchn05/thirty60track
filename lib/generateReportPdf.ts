import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// ─── Types ────────────────────────────────────────────────────────

export type ReportSet = {
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  duration_seconds: number | null;
};

export type ReportExercise = {
  name: string;
  sets: ReportSet[];
};

export type ReportWorkout = {
  performed_at: string; // 'YYYY-MM-DD'
  notes: string | null;
  exercises: ReportExercise[];
};

export type ReportExercisePR = {
  name: string;
  maxWeight: number | null;   // best in period (kg)
  prevMaxWeight: number | null; // best before period (kg)
  isNew: boolean;             // maxWeight > prevMaxWeight (or no prior)
};

export type BodyProgressPoint = {
  date: string;              // 'YYYY-MM-DD'
  weight_kg: number | null;
  bf_percent: number | null;
  lbm_kg: number | null;     // calculated: weight * (1 - bf/100)
};

export type ReportNutritionSummary = {
  avgCalories: number;
  avgProtein: number;  // grams
  avgCarbs: number;    // grams
  avgFat: number;      // grams
  daysLogged: number;
  totalDays: number;
};

export type ReportInput = {
  clientName: string;
  trainerName: string;
  periodLabel: string;
  periodStart: string; // 'YYYY-MM-DD'
  periodEnd: string;   // 'YYYY-MM-DD'
  workouts: ReportWorkout[];
  exercisePRs: ReportExercisePR[];
  bodyProgress: BodyProgressPoint[]; // from period workouts, sorted oldest→newest
  nutritionSummary?: ReportNutritionSummary;
  generatedAt: string; // formatted date string
};

// ─── HTML builder ─────────────────────────────────────────────────

function fmtKg(v: number | null): string {
  return v != null ? `${v} kg` : '—';
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}


function shortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function buildSvgLineChart(
  data: { label: string; value: number }[],
  color: string,
  unit: string,
  title: string,
): string {
  if (data.length < 2) return '';

  const W = 200, H = 90;
  const PL = 32, PR = 8, PT = 8, PB = 24;
  const CW = W - PL - PR;
  const CH = H - PT - PB;

  const vals = data.map((d) => d.value);
  const rawMin = Math.min(...vals);
  const rawMax = Math.max(...vals);
  const range = rawMax - rawMin || 1;
  const yMin = rawMin - range * 0.18;
  const yMax = rawMax + range * 0.18;

  const toX = (i: number) => PL + (i / (data.length - 1)) * CW;
  const toY = (v: number) => PT + CH - ((v - yMin) / (yMax - yMin)) * CH;

  // Horizontal grid lines + y-axis labels (3 lines for compact size)
  const grids = Array.from({ length: 3 }, (_, i) => {
    const v = yMin + (i / 2) * (yMax - yMin);
    const y = Math.round(toY(v));
    return `<line x1="${PL}" y1="${y}" x2="${W - PR}" y2="${y}" stroke="#eeeeee" stroke-width="1"/>`
      + `<text x="${PL - 4}" y="${y + 3}" text-anchor="end" font-size="7" fill="#999999">${v.toFixed(1)}</text>`;
  }).join('');

  // Area fill path
  const areaD = [
    `M ${toX(0)} ${toY(data[0].value)}`,
    ...data.slice(1).map((d, i) => `L ${toX(i + 1)} ${toY(d.value)}`),
    `L ${toX(data.length - 1)} ${PT + CH}`,
    `L ${toX(0)} ${PT + CH} Z`,
  ].join(' ');

  // Line path
  const lineD = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(d.value)}`).join(' ');

  // Dots
  const dots = data.map((d, i) =>
    `<circle cx="${toX(i)}" cy="${toY(d.value)}" r="3" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>`
  ).join('');

  // X-axis labels — only first and last for compact charts
  const xLabels = [0, data.length - 1].map((i) =>
    `<text x="${toX(i)}" y="${H - 3}" text-anchor="${i === 0 ? 'start' : 'end'}" font-size="7" fill="#999999">${data[i].label}</text>`
  ).join('');

  const gradId = `g${color.replace('#', '')}`;

  return `<td class="chart-cell">
  <div class="chart-title">${title} <span class="chart-unit">(${unit})</span></div>
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 ${W} ${H}" style="display:block;overflow:visible;">
    <defs>
      <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${grids}
    <line x1="${PL}" y1="${PT}" x2="${PL}" y2="${PT + CH}" stroke="#dddddd" stroke-width="1"/>
    <path d="${areaD}" fill="url(#${gradId})"/>
    <path d="${lineD}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}
    ${xLabels}
  </svg>
</td>`;
}

function fmtDelta(delta: number, unit: string): string {
  if (delta === 0) return `<span class="bp-delta-neu">—</span>`;
  const sign = delta > 0 ? '+' : '';
  const cls = delta > 0 ? 'bp-delta-pos' : 'bp-delta-neg';
  return `<span class="${cls}">${sign}${delta.toFixed(1)} ${unit}</span>`;
}

function buildBodyProgressHtml(points: BodyProgressPoint[]): string {
  const withData = points.filter((p) => p.weight_kg != null || p.bf_percent != null || p.lbm_kg != null);
  if (withData.length === 0) return '';

  const first = withData[0];
  const last = withData[withData.length - 1];
  const hasMultiple = withData.length > 1;

  const metrics: { key: keyof BodyProgressPoint; label: string; unit: string }[] = [
    { key: 'weight_kg', label: 'Body Weight', unit: 'kg' },
    { key: 'bf_percent', label: 'Body Fat', unit: '%' },
    { key: 'lbm_kg', label: 'Lean Mass', unit: 'kg' },
  ];

  const summaryBoxes = metrics
    .filter(({ key }) => first[key] != null || last[key] != null)
    .map(({ key, label, unit }) => {
      const startVal = first[key] as number | null;
      const endVal = last[key] as number | null;
      const delta = hasMultiple && startVal != null && endVal != null ? endVal - startVal : null;
      return `
      <td class="bp-box">
        <span class="bp-metric">${label}</span>
        ${hasMultiple && startVal != null ? `<span class="bp-row">Start <span class="bp-val">${startVal} ${unit}</span></span>` : ''}
        ${endVal != null ? `<span class="bp-row">${hasMultiple ? 'End ' : ''}<span class="bp-val">${endVal} ${unit}</span></span>` : ''}
        ${delta != null ? `<span class="bp-row">Change ${fmtDelta(delta, unit)}</span>` : ''}
      </td>`;
    }).join('');

  // Per-metric chart data (filter separately so a missing BF doesn't drop weight points)
  const weightPts = withData.filter((p) => p.weight_kg != null)
    .map((p) => ({ label: shortDate(p.date), value: p.weight_kg! }));
  const bfPts = withData.filter((p) => p.bf_percent != null)
    .map((p) => ({ label: shortDate(p.date), value: p.bf_percent! }));
  const lbmPts = withData.filter((p) => p.lbm_kg != null)
    .map((p) => ({ label: shortDate(p.date), value: p.lbm_kg! }));

  const chartCells = [
    buildSvgLineChart(weightPts, '#B88C32', 'kg', 'Body Weight'),
    buildSvgLineChart(bfPts,     '#888888', '%',  'Body Fat'),
    buildSvgLineChart(lbmPts,    '#2e7d32', 'kg', 'Lean Mass'),
  ].filter(Boolean).join('');

  return `
<div class="section">
  <div class="section-title">Body Progress</div>
  <table class="bp-summary"><tr>${summaryBoxes}</tr></table>
  ${chartCells ? `<table class="charts-row"><tr>${chartCells}</tr></table>` : ''}
</div>`;
}

function buildNutritionHtml(n: ReportNutritionSummary): string {
  const totalMacroG = n.avgProtein + n.avgCarbs + n.avgFat;
  const proteinPct = totalMacroG > 0 ? Math.round((n.avgProtein * 4 / (totalMacroG > 0 ? n.avgCalories : 1)) * 100) : 0;
  const carbsPct   = totalMacroG > 0 ? Math.round((n.avgCarbs   * 4 / (totalMacroG > 0 ? n.avgCalories : 1)) * 100) : 0;
  const fatPct     = totalMacroG > 0 ? Math.round((n.avgFat     * 9 / (totalMacroG > 0 ? n.avgCalories : 1)) * 100) : 0;

  const macroBar = (label: string, grams: number, pct: number, color: string) => `
    <tr>
      <td style="width:70px;font-size:11px;color:#555555;padding:3px 8px 3px 0;">${label}</td>
      <td style="font-size:11px;color:#1a1a1a;font-weight:700;width:50px;padding:3px 8px 3px 0;">${Math.round(grams)}g</td>
      <td style="width:120px;padding:3px 0;">
        <div style="background:#eeeeee;border-radius:4px;height:8px;overflow:hidden;">
          <div style="background:${color};width:${Math.min(pct, 100)}%;height:8px;border-radius:4px;"></div>
        </div>
      </td>
      <td style="font-size:10px;color:#888888;padding:3px 0 3px 6px;">${pct}%</td>
    </tr>`;

  return `
<div class="section">
  <div class="section-title">Nutrition (Avg per Day)</div>
  <table class="stats-table"><tr>
    <td class="stat-box">
      <span class="stat-value">${Math.round(n.avgCalories)}</span>
      <span class="stat-label">Avg Calories</span>
    </td>
    <td class="stat-box">
      <span class="stat-value">${Math.round(n.avgProtein)}g</span>
      <span class="stat-label">Avg Protein</span>
    </td>
    <td class="stat-box">
      <span class="stat-value">${Math.round(n.avgCarbs)}g</span>
      <span class="stat-label">Avg Carbs</span>
    </td>
    <td class="stat-box">
      <span class="stat-value">${Math.round(n.avgFat)}g</span>
      <span class="stat-label">Avg Fat</span>
    </td>
    <td class="stat-box">
      <span class="stat-value">${n.daysLogged}<span style="font-size:13px;font-weight:400;color:#888888;">/${n.totalDays}</span></span>
      <span class="stat-label">Days Logged</span>
    </td>
  </tr></table>
  <div style="margin-top:14px;">
    <div style="font-size:10px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Macro Split</div>
    <table style="border-collapse:collapse;">
      ${macroBar('Protein', n.avgProtein, proteinPct, '#B88C32')}
      ${macroBar('Carbs',   n.avgCarbs,   carbsPct,   '#4A90D9')}
      ${macroBar('Fat',     n.avgFat,     fatPct,     '#E67E22')}
    </table>
  </div>
</div>`;
}

export function buildReportHtml(input: ReportInput): string {
  const { clientName, trainerName, periodLabel, periodStart, periodEnd, workouts, exercisePRs, bodyProgress, nutritionSummary, generatedAt } = input;

  const totalVolume = workouts.reduce((sum, w) =>
    sum + w.exercises.reduce((es, ex) =>
      es + ex.sets.reduce((ss, s) => ss + (s.reps ?? 0) * (s.weight_kg ?? 0), 0), 0), 0);

  const totalSets = workouts.reduce((sum, w) =>
    sum + w.exercises.reduce((es, ex) => es + ex.sets.length, 0), 0);

  const newPRs = exercisePRs.filter((p) => p.isNew);

  const prRows = exercisePRs.map((p) => `
    <tr>
      <td>${p.name}</td>
      <td class="${p.isNew ? 'pr-new' : ''}">${fmtKg(p.maxWeight)}${p.isNew ? ' 🏆' : ''}</td>
      <td class="pr-prev">${fmtKg(p.prevMaxWeight)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>thirty60 — ${clientName} Performance Report</title>
<script>window.onload = function() { window.print(); };</script>
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; background: #ffffff; font-size: 13px; line-height: 1.5; }

  .header { background-color: #111111 !important; color: #ffffff; padding: 28px 32px 20px; }
  .header-label { font-size: 10px; letter-spacing: 2px; color: #B88C32 !important; text-transform: uppercase; margin-bottom: 6px; }
  .header-name { font-size: 26px; font-weight: 700; margin-bottom: 4px; color: #ffffff; }
  .header-sub { font-size: 12px; color: #999999; }

  .meta-bar { background-color: #f5f5f5 !important; border-bottom: 1px solid #e5e5e5; padding: 10px 32px; font-size: 12px; color: #555555; }
  .meta-bar table { width: 100%; border-collapse: collapse; }
  .meta-bar td { padding-right: 24px; white-space: nowrap; }
  .meta-bar strong { color: #1a1a1a; }

  .section { padding: 20px 32px; border-bottom: 1px solid #eeeeee; }
  .section-title { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #B88C32 !important; font-weight: 700; margin-bottom: 12px; }

  .stats-table { border-collapse: separate; border-spacing: 10px 0; margin-left: -10px; }
  .stat-box { background-color: #f9f9f9 !important; border: 1px solid #e5e5e5; border-radius: 6px; padding: 12px 16px; vertical-align: top; min-width: 90px; }
  .stat-value { font-size: 22px; font-weight: 700; color: #1a1a1a; display: block; }
  .stat-label { font-size: 10px; color: #888888; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; display: block; }
  .stat-value-gold { font-size: 22px; font-weight: 700; color: #B88C32 !important; display: block; }

.pr-table { width: 100%; border-collapse: collapse; }
  .pr-table th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #888888; padding: 6px 8px; border-bottom: 2px solid #eeeeee; }
  .pr-table td { padding: 7px 8px; border-bottom: 1px solid #f3f3f3; }
  .pr-new { font-weight: 700; color: #B88C32 !important; }
  .pr-prev { color: #888888; }

  .bp-summary { border-collapse: separate; border-spacing: 10px 0; margin-left: -10px; margin-bottom: 16px; }
  .bp-box { background-color: #f9f9f9 !important; border: 1px solid #e5e5e5; border-radius: 6px; padding: 12px 16px; vertical-align: top; min-width: 110px; }
  .bp-metric { font-size: 10px; color: #888888; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 6px; font-weight: 600; }
  .bp-row { display: block; font-size: 12px; color: #555555; }
  .bp-val { font-weight: 700; color: #1a1a1a; }
  .bp-delta-pos { font-weight: 700; color: #2e7d32; }
  .bp-delta-neg { font-weight: 700; color: #c62828; }
  .bp-delta-neu { font-weight: 700; color: #888888; }

  .charts-row { width: 100%; border-collapse: separate; border-spacing: 10px 0; margin-top: 12px; margin-left: -10px; }
  .chart-cell { vertical-align: top; width: 33%; }
  .chart-title { font-size: 9px; font-weight: 700; color: #555555; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
  .chart-unit { font-weight: 400; color: #888888; }

  .footer { padding: 16px 32px; font-size: 10px; color: #aaaaaa; text-align: center; border-top: 1px solid #eeeeee; }
</style>
</head>
<body>

<div class="header">
  <div class="header-label">thirty60 Performance Report</div>
  <div class="header-name">${clientName}</div>
  <div class="header-sub">Trainer: ${trainerName}</div>
</div>

<div class="meta-bar">
  <table><tr>
    <td><strong>Period:</strong> ${periodLabel}</td>
    <td><strong>Dates:</strong> ${fmtDate(periodStart)} – ${fmtDate(periodEnd)}</td>
    <td><strong>Generated:</strong> ${generatedAt}</td>
  </tr></table>
</div>

<div class="section">
  <div class="section-title">Summary</div>
  <table class="stats-table"><tr>
    <td class="stat-box">
      <span class="stat-value">${workouts.length}</span>
      <span class="stat-label">Sessions</span>
    </td>
    <td class="stat-box">
      <span class="stat-value">${totalSets}</span>
      <span class="stat-label">Total Sets</span>
    </td>
    <td class="stat-box">
      <span class="stat-value">${totalVolume > 0 ? Math.round(totalVolume).toLocaleString() : '—'}</span>
      <span class="stat-label">Volume (kg)</span>
    </td>
    <td class="stat-box">
      <span class="stat-value-gold">${newPRs.length}</span>
      <span class="stat-label">New PRs</span>
    </td>
  </tr></table>
</div>

${buildBodyProgressHtml(bodyProgress)}

${nutritionSummary ? buildNutritionHtml(nutritionSummary) : ''}

${exercisePRs.length > 0 ? `
<div class="section">
  <div class="section-title">Exercise Bests This Period</div>
  <table class="pr-table">
    <thead>
      <tr>
        <th>Exercise</th>
        <th>Best This Period</th>
        <th>Previous Best</th>
      </tr>
    </thead>
    <tbody>${prRows}</tbody>
  </table>
</div>` : ''}

<div class="footer">Generated by thirty60 · ${generatedAt}</div>

</body>
</html>`;
}

// ─── Share / print ────────────────────────────────────────────────

export async function generateAndShare(input: ReportInput): Promise<{ error: string | null }> {
  try {
    const html = buildReportHtml(input);

    if (Platform.OS === 'web') {
      // expo-print on web ignores the html parameter and prints the current page.
      // Instead, open the HTML in a new tab so the user can print/save from there.
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      // Clean up the blob URL after the new window has loaded it
      if (win) {
        win.addEventListener('load', () => URL.revokeObjectURL(url));
      } else {
        // Popup blocked — fallback: navigate current tab to the blob URL
        window.location.href = url;
      }
    } else {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `${input.clientName} — Performance Report`,
        UTI: 'com.adobe.pdf',
      });
    }

    return { error: null };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Failed to generate report' };
  }
}
