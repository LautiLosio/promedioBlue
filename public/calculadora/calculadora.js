let fromInput = document.getElementById('fromInput');
let pesoInput = document.getElementById('pesoInput');
let fromCurrency = document.getElementById('fromCurrency');
let dolarType = document.getElementById('dolarType');
let dolaresSelect = document.getElementById('dolaresSelect');
let fromCurrencyGroup = document.getElementById('fromCurrencyGroup');
let tipoPrecioElement = document.getElementById('tipo-precio');
let arrow = document.querySelector('.arrow-symbol');
let fromLabel = document.querySelector('label[for="fromInput"]');
let rateLeft = document.getElementById('rateLeft');
let rateRight = document.getElementById('rateRight');
let historicoNotice = document.getElementById('historicoNotice');
let historicoNoticeCasa = document.getElementById('historicoNoticeCasa');
let historicoNoticeFecha = document.getElementById('historicoNoticeFecha');

let cotizaciones = {};
let selectedDolarValue;
let lastTouchedInput;
let tipoPrecio = 'promedio';
let rates = {};

function resetHistoricoModeUI() {
  // Hide notice
  if (historicoNotice) historicoNotice.classList.add('hidden');
  // Show selectors and enable inputs
  if (fromCurrencyGroup) fromCurrencyGroup.classList.remove('hidden');
  if (dolaresSelect) dolaresSelect.classList.remove('hidden');
  if (fromCurrency) fromCurrency.disabled = false;
  if (dolarType) dolarType.disabled = false;
}

// Evaluate a number or a simple math expression (.+-*/ and parentheses)
function parseNumericOrExpression(raw) {
  if (typeof raw !== 'string') return NaN;
  const trimmed = raw.trim();
  if (trimmed === '') return NaN;
  // Remove thousands separators and normalize decimal comma
  const normalized = trimmed.replace(/\./g, '').replace(/,/g, '.');
  // If it contains only digits and a dot, parse normally
  if (/^[0-9]*\.?[0-9]*$/.test(normalized)) {
    const num = parseFloat(normalized);
    return isFinite(num) ? num : NaN;
  }
  // Allow only math-safe characters
  if (!/^[0-9+\-*/().\s]+$/.test(normalized)) return NaN;
  // Must contain an operator or parentheses to be treated as expression
  if (!/[+\-*/()]/.test(normalized)) {
    const num = parseFloat(normalized);
    return isFinite(num) ? num : NaN;
  }
  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${normalized})`)();
    return typeof result === 'number' && isFinite(result) ? result : NaN;
  } catch (_) {
    return NaN;
  }
}

// Load initial data
async function loadData() {
  await Promise.all([getCotizaciones(), getRates()]);

  // Load dolar options
  cotizaciones.forEach(item => {
    let option = document.createElement('option');
    option.value = item.casa;
    option.textContent = item.casa.slice(0, 1).toUpperCase() + item.casa.slice(1);
    option.selected = item.casa == 'blue' ? true : false;
    dolarType.appendChild(option);
  });

  selectedDolarValue = cotizaciones.find(item => item.casa == dolarType.value);
  updateFromLabel();
  updateRateDisplay();
}

function initHistoricoMode(selection) {
  fromCurrency.value = 'USD';
  if (selection.casa) {
    dolarType.value = selection.casa;
  }
  selectedDolarValue = {
    casa: selection.casa,
    compra: selection.compra,
    venta: selection.venta,
    promedio: selection.promedio,
  };
  if (fromCurrencyGroup) {
    fromCurrencyGroup.classList.add('hidden');
    fromCurrency.disabled = true;
  }
  if (dolaresSelect) {
    dolaresSelect.classList.add('hidden');
    dolarType.disabled = true;
  }
  if (historicoNotice && historicoNoticeCasa && historicoNoticeFecha) {
    historicoNoticeCasa.textContent = `Dólar ${selection.casa.charAt(0).toUpperCase() + selection.casa.slice(1)}`;
    try {
      historicoNoticeFecha.textContent = new Intl.DateTimeFormat('es-AR', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
      }).format(new Date(selection.fecha));
    } catch (e) {
      historicoNoticeFecha.textContent = selection.fecha;
    }
    historicoNotice.classList.remove('hidden');
  }
  updateFromLabel();
  updateRateDisplay();
}

const params = new URLSearchParams(window.location.search);
const fromHistorico = params.get('from') === 'historico';
let historicoMode = false;
const storedSelectionRaw = sessionStorage.getItem('historicoSelection');
if (fromHistorico && storedSelectionRaw) {
  try {
    const selection = JSON.parse(storedSelectionRaw);
    historicoMode = true;
    initHistoricoMode(selection);
  } catch (e) {
    resetHistoricoModeUI();
    loadData();
  }
} else {
  historicoMode = false;
  resetHistoricoModeUI();
  loadData();
}

// Handle bfcache/back-forward restore
window.addEventListener('pageshow', function () {
  const paramsNow = new URLSearchParams(window.location.search);
  const fromNow = paramsNow.get('from') === 'historico';
  if (!fromNow) {
    historicoMode = false;
    resetHistoricoModeUI();
  }
});

function updateFromLabel() {
  const currency = fromCurrency.value;
  if (currency === 'USD') {
    const casaName = selectedDolarValue && selectedDolarValue.casa ? selectedDolarValue.casa : dolarType.value;
    if (casaName) {
      fromLabel.textContent = `Dólar ${casaName.charAt(0).toUpperCase() + casaName.slice(1)}`;
    }
  } else {
    const currencyNames = {
      EUR: 'Euro',
      BRL: 'Real',
      CLP: 'Peso Chileno',
      UYU: 'Peso Uruguayo',
    };
    fromLabel.textContent = currencyNames[currency];
  }
}

function getSelectedRate() {
  if (fromCurrency.value === 'USD') {
    return selectedDolarValue ? selectedDolarValue[tipoPrecio] : undefined;
  }
  const selected = rates[fromCurrency.value.toLowerCase()];
  return selected ? selected.venta : undefined;
}

function formatSmallCurrency(value) {
  if (!isFinite(value) || value === 0) return '0';
  const abs = Math.abs(value);
  if (abs >= 1) {
    return abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  // Find first non-zero digit after decimal and round to that place
  const asString = abs.toString();
  const match = asString.match(/0\.(0*)(\d)/);
  if (!match) {
    return abs.toLocaleString('en-US', { maximumFractionDigits: 6 });
  }
  const zeros = match[1].length;
  const decimals = zeros + 1;
  const rounded = Math.round(abs * Math.pow(10, decimals)) / Math.pow(10, decimals);
  return rounded.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function updateRateDisplay() {
  const rate = getSelectedRate();
  if (!rate || !rateLeft || !rateRight) return;

  if (lastTouchedInput === pesoInput) {
    // ARS -> Foreign
    rateLeft.textContent = 'ARS $1';
    const inverted = 1 / rate;
    rateRight.textContent = `${fromCurrency.value} $${formatSmallCurrency(inverted)}`;
  } else {
    // Foreign -> ARS (default)
    rateLeft.textContent = `${fromCurrency.value} $1`;
    rateRight.textContent = `ARS $${formatNumber(rate)}`;
  }
}

// Currency selection change
fromCurrency.addEventListener('change', function () {
  if (historicoMode) return; // locked by historico selection
  dolaresSelect.style.display = this.value === 'USD' ? 'flex' : 'none';
  updateFromLabel();
  if (lastTouchedInput) {
    calcluateValue(lastTouchedInput, lastTouchedInput == fromInput ? pesoInput : fromInput);
  }
  updateRateDisplay();
});

// Dolar type change
dolarType.addEventListener('change', function () {
  if (historicoMode) return; // locked by historico selection
  selectedDolarValue = cotizaciones.find(item => item.casa === dolarType.value);
  updateFromLabel();
  if (lastTouchedInput) {
    calcluateValue(lastTouchedInput, lastTouchedInput == fromInput ? pesoInput : fromInput);
  }
  updateRateDisplay();
});

// Update price type selection
tipoPrecioElement.addEventListener('click', function (e) {
  const option = e.target.closest('.price-type-option');
  if (!option) return;

  // Remove active class from all options
  tipoPrecioElement.querySelectorAll('.price-type-option').forEach(opt => {
    opt.classList.remove('price-type-option-active');
  });

  // Add active class to clicked option
  option.classList.add('price-type-option-active');

  // Update tipo precio based on text
  const text = option.textContent.toLowerCase();
  switch (text) {
    case 'compra':
      tipoPrecio = 'compra';
      break;
    case 'promedio':
      tipoPrecio = 'promedio';
      break;
    case 'venta':
      tipoPrecio = 'venta';
      break;
  }

  if (lastTouchedInput) {
    calcluateValue(lastTouchedInput, lastTouchedInput == fromInput ? pesoInput : fromInput);
  }
  updateRateDisplay();
});

// Input handling
for (let input of [fromInput, pesoInput]) {
  let otherInput = input == fromInput ? pesoInput : fromInput;

  input.addEventListener('focus', function () {
    lastTouchedInput = input;
    updateArrowDirection();
    updateRateDisplay();
  });

  input.addEventListener('input', function () {
    calcluateValue(input, otherInput);
    updateArrowDirection();
    updateRateDisplay();
  });

  input.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      input.blur();
    }
  });

  input.addEventListener('blur', function () {
    const leftVal = parseNumericOrExpression(input.value);
    const rightVal = parseNumericOrExpression(otherInput.value);
    input.value = isFinite(leftVal) ? formatNumber(leftVal) : '';
    otherInput.value = isFinite(rightVal) ? formatNumber(rightVal) : '';

    if (input.value == '') {
      otherInput.value = '';
    }
  });
}

function calcluateValue(touchedInput, otherInput) {
  if (touchedInput.value == '') {
    otherInput.value = '';
    return;
  }

  let value = parseNumericOrExpression(touchedInput.value);
  if (!isFinite(value)) {
    otherInput.value = '';
    return;
  }
  let result;

  if (touchedInput == pesoInput) {
    if (fromCurrency.value === 'USD') {
      result = value / selectedDolarValue[tipoPrecio];
    } else {
      result = value / rates[fromCurrency.value.toLowerCase()].venta;
    }
  } else {
    if (fromCurrency.value === 'USD') {
      result = value * selectedDolarValue[tipoPrecio];
    } else {
      result = value * rates[fromCurrency.value.toLowerCase()].venta;
    }
  }

  otherInput.value = formatNumber(result);
}

async function getCotizaciones() {
  let response = await fetch('https://dolarapi.com/v1/dolares');
  let data = await response.json();

  data.forEach(item => {
    item.promedio = (item.compra + item.venta) / 2;
  });

  cotizaciones = data;
}

async function getRates() {
  const currencies = ['eur', 'brl', 'clp', 'uyu'];
  const promises = currencies.map(currency =>
    fetch(`https://dolarapi.com/v1/cotizaciones/${currency}`)
      .then(response => response.json())
      .then(data => {
        rates[currency] = data;
      }),
  );

  await Promise.all(promises);
}

function formatNumber(number) {
  return number.toLocaleString('es-AR', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

// Scroll behavior
let lastScrollTop = 0;
let scrollTimeout;
const volverButton = document.querySelector('.back-button');
const SCROLL_THRESHOLD = 50;
const SCROLL_TIMEOUT = 1500;

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

window.addEventListener('scroll', handleScroll, { passive: true });
window.addEventListener('resize', handleScroll, { passive: true });
handleScroll();

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

function updateArrowDirection() {
  if (lastTouchedInput === pesoInput) {
    arrow.classList.add('arrow-symbol-left');
  } else {
    arrow.classList.remove('arrow-symbol-left');
  }
}

window.addEventListener('resize', updateArrowDirection);
