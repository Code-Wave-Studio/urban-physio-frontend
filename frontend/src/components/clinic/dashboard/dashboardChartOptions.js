/** Shared Chart.js options — light/dark-friendly via CSS color tokens where possible */
export const dashChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      titleFont: { size: 12, weight: '600' },
      bodyFont: { size: 11 },
      padding: 10,
      cornerRadius: 10,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#94a3b8', font: { size: 10 } },
      border: { display: false },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(148, 163, 184, 0.18)' },
      ticks: { color: '#94a3b8', font: { size: 10 } },
      border: { display: false },
    },
  },
};
