/** Shared Chart.js options — aligned with site primary orange */
export const dashChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  layout: {
    padding: { top: 8, right: 10, bottom: 2, left: 2 },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(124, 45, 18, 0.94)',
      titleFont: { size: 12, weight: '600' },
      bodyFont: { size: 11 },
      padding: 12,
      cornerRadius: 12,
      borderColor: 'rgba(249, 115, 22, 0.35)',
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        color: '#94a3b8',
        font: { size: 10, weight: '500' },
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 6,
        padding: 6,
      },
      border: { display: false },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(249, 115, 22, 0.08)' },
      ticks: {
        color: '#94a3b8',
        font: { size: 10 },
        maxTicksLimit: 5,
        padding: 8,
      },
      border: { display: false },
    },
  },
};

export const DASH_CHART_COLORS = {
  line: {
    border: '#ea580c',
    fill: 'rgba(249, 115, 22, 0.12)',
    point: '#f97316',
  },
  bar: {
    fill: 'rgba(249, 115, 22, 0.88)',
    hover: 'rgba(234, 88, 12, 1)',
  },
};
