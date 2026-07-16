import { 
  Chart, 
  LineController, 
  LineElement, 
  PointElement, 
  LinearScale, 
  Title, 
  CategoryScale, 
  BarController, 
  BarElement, 
  DoughnutController, 
  ArcElement, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
Chart.register(
  LineController, 
  LineElement, 
  PointElement, 
  LinearScale, 
  Title, 
  CategoryScale, 
  BarController, 
  BarElement, 
  DoughnutController, 
  ArcElement, 
  Tooltip, 
  Legend,
  Filler
);

export class SkillsphereCharts {
  static createLineChart(ctx, labels, data, label, color = '#6366f1') {
    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: label,
          data: data,
          borderColor: color,
          backgroundColor: `${color}15`,
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: color,
          pointHoverRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(13, 12, 29, 0.95)',
            titleColor: '#fff',
            bodyColor: '#e0e0e0',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            borderWidth: 1,
            padding: 10,
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.03)' },
            ticks: { color: 'rgba(255, 255, 255, 0.6)', font: { family: 'Outfit' } }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.03)' },
            ticks: { color: 'rgba(255, 255, 255, 0.6)', font: { family: 'Outfit' } }
          }
        }
      }
    });
  }

  static createBarChart(ctx, labels, data, label, color = '#ec4899') {
    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: label,
          data: data,
          backgroundColor: color,
          borderRadius: 6,
          barThickness: 16,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(13, 12, 29, 0.95)',
            titleColor: '#fff',
            bodyColor: '#e0e0e0',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            borderWidth: 1,
            padding: 10,
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: 'rgba(255, 255, 255, 0.6)', font: { family: 'Outfit' } }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.03)' },
            ticks: { color: 'rgba(255, 255, 255, 0.6)', font: { family: 'Outfit' } }
          }
        }
      }
    });
  }

  static createDoughnutChart(ctx, labels, data, colors) {
    return new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: 'rgba(255, 255, 255, 0.7)',
              font: { family: 'Outfit', size: 12 },
              padding: 15,
              usePointStyle: true,
            }
          },
          tooltip: {
            backgroundColor: 'rgba(13, 12, 29, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            borderWidth: 1,
            padding: 10,
          }
        },
        cutout: '75%',
      }
    });
  }
}
