// Dom elements
const chartElement = document.getElementById('chart');
const chartContainer = document.getElementById('chartContainer');
const dateForm = document.getElementById('dateForm');
const dolarType = document.getElementById('dolarType');
const dateInput = document.getElementById('dateInput');
const rangeInput = document.getElementById('rangeInput');
const submitButton = document.getElementById('submitButton');
const preciosContainer = document.getElementById('preciosContainer');
const precioCompra = document.getElementById('precioCompra');
const precioPromedio = document.getElementById('precioPromedio');
const precioVenta = document.getElementById('precioVenta');
const statsContainer = document.getElementById('statsContainer');
const toggleChartType = document.getElementById('toggleChartType');
const downloadData = document.getElementById('downloadData');
const useInCalculator = document.getElementById('useInCalculator');

// Variables
let cotizaciones = [];
let selectedCasa = 'blue';
let chart = null;
let isLineChart = true;
const API_BASE_URL = 'https://dolarapi.com/v1';
const ARGENTINA_DATOS_API = 'https://api.argentinadatos.com/v1';

// Scroll behavior for back button
let lastScrollTop = 0;
let scrollTimeout;
const volverButton = document.querySelector('.back-button');
const SCROLL_THRESHOLD = 50;
const SCROLL_TIMEOUT = 1500;

// Keep track of currently displayed data
let currentDisplayData = [];

// Initialize chart
function initChart() {
  if (!chart) {
    chart = echarts.init(chartElement);
    window.addEventListener('resize', () => chart.resize());
  }
}

// Update a container's inner icon using Lucide's runtime icons
function setLucideIcon(containerEl, iconName) {
  if (!containerEl || !iconName) return;
  try {
    if (window.lucide && lucide.icons && lucide.icons[iconName]) {
      containerEl.innerHTML = lucide.icons[iconName].toSvg();
      return;
    }
  } catch (e) {
    // Fallback to attribute update below
  }
  // Fallback: update data-lucide and try to (re)create icons
  const placeholder = containerEl.querySelector('[data-lucide]');
  if (placeholder) {
    placeholder.setAttribute('data-lucide', iconName);
  }
  if (window.lucide && typeof lucide.createIcons === 'function') {
    try {
      lucide.createIcons();
    } catch (_) {}
  }
}

// Format currency
function formatCurrency(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(value);
}

// Format date
function formatDate(date) {
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

// Calculate statistics
function calculateStats(data) {
  const prices = data.map(d => d.venta);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const change = ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100;

  document.getElementById('min-price').textContent = formatCurrency(min);
  document.getElementById('max-price').textContent = formatCurrency(max);
  document.getElementById('avg-price').textContent = formatCurrency(avg);
  document.getElementById('price-change').textContent = `${change.toFixed(2)}%`;
}

// Create chart
function createChart(data) {
  initChart();

  const dates = data.map(d => formatDate(d.fecha));
  const compra = data.map(d => d.compra);
  const venta = data.map(d => d.venta);

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: function (params) {
        const date = params[0].name;
        return `${date}<br/>
          Compra: ${formatCurrency(params[0].value)}<br/>
          Venta: ${formatCurrency(params[1].value)}`;
      },
    },
    legend: {
      data: ['Compra', 'Venta'],
      textStyle: {
        color: 'hsl(97, 50%, 87%)',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        rotate: 45,
        color: 'hsl(97, 50%, 87%)',
      },
      axisLine: {
        lineStyle: {
          color: 'hsl(97, 50%, 87%)',
        },
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: formatCurrency,
        color: 'hsl(97, 50%, 87%)',
      },
      axisLine: {
        lineStyle: {
          color: 'hsl(97, 50%, 87%)',
        },
      },
      splitLine: {
        lineStyle: {
          color: 'hsla(97, 50%, 87%, 0.1)',
        },
      },
    },
    series: [
      {
        name: 'Compra',
        data: compra,
        type: isLineChart ? 'line' : 'bar',
        smooth: isLineChart,
        itemStyle: {
          color: '#88bd66',
        },
        areaStyle: isLineChart
          ? {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(136, 189, 102, 0.3)' },
                { offset: 1, color: 'rgba(136, 189, 102, 0.1)' },
              ]),
            }
          : undefined,
      },
      {
        name: 'Venta',
        data: venta,
        type: isLineChart ? 'line' : 'bar',
        smooth: isLineChart,
        itemStyle: {
          color: '#3e6029',
        },
        areaStyle: isLineChart
          ? {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(62, 96, 41, 0.3)' },
                { offset: 1, color: 'rgba(62, 96, 41, 0.1)' },
              ]),
            }
          : undefined,
      },
    ],
  };

  chart.setOption(option);
}

// Download data as CSV
function downloadCSV(data) {
  const headers = ['Fecha', 'Compra', 'Venta', 'Promedio'];
  const csvContent = [
    headers.join(','),
    ...data.map(d => [d.fecha, d.compra, d.venta, (d.compra + d.venta) / 2].join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `dolar-${selectedCasa}-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

// Fetch current data from API
async function fetchCurrentData(casa) {
  try {
    const response = await fetch(`${API_BASE_URL}/dolares/${casa}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching current data:', error);
    return null;
  }
}

// Fetch historical data from API
async function fetchHistoricalData(casa) {
  try {
    const response = await fetch(`${ARGENTINA_DATOS_API}/cotizaciones/dolares/${casa}`);
    const data = await response.json();
    return data.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return [];
  }
}

// Update UI with data
function updateUI(data) {
  if (data.length === 0) return;

  currentDisplayData = data; // Store current data
  const latest = data[data.length - 1];
  precioCompra.textContent = formatCurrency(latest.compra);
  precioPromedio.textContent = formatCurrency((latest.compra + latest.venta) / 2);
  precioVenta.textContent = formatCurrency(latest.venta);

  chartContainer.classList.remove('hidden');
  statsContainer.classList.remove('hidden');
  createChart(data);
  calculateStats(data);
}

// Filter data by date range
function filterDataByRange(data, range, referenceDate = new Date()) {
  const endDate = referenceDate;
  const startDate = new Date(referenceDate);
  startDate.setDate(startDate.getDate() - range);

  return data.filter(d => {
    const date = new Date(d.fecha);
    return date >= startDate && date <= endDate;
  });
}

// Event listeners
dolarType.addEventListener('change', async function () {
  selectedCasa = dolarType.value;
  if (!selectedCasa) return;

  dateInput.disabled = true;
  dateInput.value = '';
  dateInput.placeholder = 'Cargando...';

  const data = await fetchHistoricalData(selectedCasa);
  if (data.length > 0) {
    cotizaciones = data;
    const oldestDate = new Date(data[0].fecha);
    const newestDate = new Date(data[data.length - 1].fecha);

    // Use local time to avoid timezone shift issues on mobile
    function formatDateForInput(d) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }

    dateInput.min = formatDateForInput(oldestDate);
    dateInput.max = formatDateForInput(newestDate);
    dateInput.disabled = false;

    // Update UI with last month's data by default
    const filteredData = filterDataByRange(data, 30);
    updateUI(filteredData);
  }
});

dateInput.addEventListener('change', function () {
  submitButton.disabled = !dateInput.value;
});

// Separate range input handler
rangeInput.addEventListener('change', function () {
  if (!selectedCasa) return;

  const range = parseInt(rangeInput.value);
  const referenceDate = dateInput.value ? new Date(dateInput.value) : new Date();
  const filteredData = filterDataByRange(cotizaciones, range, referenceDate);
  updateUI(filteredData);
});

// Update form submit to not handle range
dateForm.addEventListener('submit', async function (e) {
  e.preventDefault();

  if (!dateInput.value) return;

  const selectedDate = new Date(dateInput.value);
  const range = parseInt(rangeInput.value);
  const startDate = new Date(selectedDate);
  startDate.setDate(startDate.getDate() - range);

  const filteredData = cotizaciones.filter(d => {
    const date = new Date(d.fecha);
    return date >= startDate && date <= selectedDate;
  });

  updateUI(filteredData);
  // Reveal the "Use in Calculator" button after a specific search
  if (useInCalculator && filteredData.length > 0) {
    useInCalculator.classList.add('show');
  }
});

// Update toggle chart to use current data
toggleChartType.addEventListener('click', function () {
  isLineChart = !isLineChart;
  const nextIcon = isLineChart ? 'bar-chart' : 'line-chart';
  setLucideIcon(toggleChartType, nextIcon);
  if (chart && currentDisplayData.length > 0) {
    createChart(currentDisplayData);
  }
});

downloadData.addEventListener('click', function () {
  if (cotizaciones.length > 0) {
    downloadCSV(cotizaciones);
  }
});

// Send selected quotation to calculator
if (useInCalculator) {
  useInCalculator.addEventListener('click', function () {
    if (!currentDisplayData || currentDisplayData.length === 0) return;
    const last = currentDisplayData[currentDisplayData.length - 1];
    const selection = {
      source: 'historico',
      casa: selectedCasa,
      fecha: last.fecha,
      compra: last.compra,
      venta: last.venta,
      promedio: (last.compra + last.venta) / 2,
    };
    try {
      sessionStorage.setItem('historicoSelection', JSON.stringify(selection));
    } catch (e) {
      console.error('No se pudo guardar la cotización seleccionada:', e);
    }
    window.location.href = '../calculadora/calculadora.html?from=historico';
  });
}

// Scroll behavior for back button
function handleScroll() {
  const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;

  // Show button at the top, bottom, or when scrolling up
  if (currentScroll < 10 || windowHeight + currentScroll >= documentHeight - 10 || currentScroll < lastScrollTop) {
    volverButton.classList.add('visible');
    clearTimeout(scrollTimeout);
  } else {
    volverButton.classList.remove('visible');
  }

  lastScrollTop = currentScroll;
}

// Add scroll and resize listeners
window.addEventListener('scroll', handleScroll, { passive: true });
window.addEventListener('resize', handleScroll, { passive: true });

// Initial check for button visibility
handleScroll();

// Show button on mouse movement near bottom
document.addEventListener('mousemove', e => {
  const bottomThreshold = window.innerHeight - 50;
  if (e.clientY > bottomThreshold && window.pageYOffset > SCROLL_THRESHOLD) {
    volverButton.classList.add('visible');
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      if (window.pageYOffset > SCROLL_THRESHOLD) {
        volverButton.classList.remove('visible');
      }
    }, SCROLL_TIMEOUT);
  }
});

// Initialize
async function main() {
  // Set up dolar types
  const casas = ['blue', 'oficial', 'bolsa', 'mayorista', 'solidario', 'turista'];
  const options = casas.map(casa => {
    const name = casa.charAt(0).toUpperCase() + casa.slice(1);
    return `<option value="${casa}">Dólar ${name}</option>`;
  });

  dolarType.innerHTML = options.join('');

  // Set default range to 1 month
  rangeInput.value = '30';

  // Set initial data for blue dollar
  selectedCasa = 'blue';
  dolarType.value = selectedCasa;

  // Initial visibility handled by handleScroll()

  const data = await fetchHistoricalData(selectedCasa);
  if (data.length > 0) {
    cotizaciones = data;
    const filteredData = filterDataByRange(data, 30);
    updateUI(filteredData);

    const oldestDate = new Date(data[0].fecha);
    const newestDate = new Date(data[data.length - 1].fecha);

    function formatDateForInput(d) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }

    dateInput.min = formatDateForInput(oldestDate);
    dateInput.max = formatDateForInput(newestDate);
    dateInput.disabled = false;
  }
}

main();
