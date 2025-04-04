let fromInput = document.getElementById("fromInput");
let pesoInput = document.getElementById("pesoInput");
let fromCurrency = document.getElementById("fromCurrency");
let dolarType = document.getElementById("dolarType");
let dolaresSelect = document.getElementById("dolaresSelect");
let tipoPrecioElement = document.getElementById("tipo-precio");
let arrow = document.querySelector(".arrow-symbol");
let fromLabel = document.querySelector('label[for="fromInput"]');

let cotizaciones = {};
let selectedDolarValue;
let lastTouchedInput;
let tipoPrecio = "promedio";
let rates = {};

// Load initial data
async function loadData() {
  await Promise.all([
    getCotizaciones(),
    getRates()
  ]);

  // Load dolar options
  cotizaciones.forEach(item => {
    let option = document.createElement("option");
    option.value = item.casa;
    option.textContent = item.casa.slice(0, 1).toUpperCase() + item.casa.slice(1);
    option.selected = item.casa == "blue" ? true : false;
    dolarType.appendChild(option);
  });

  selectedDolarValue = cotizaciones.find(item => item.casa == dolarType.value);
}

loadData();

function updateFromLabel() {
  const currency = fromCurrency.value;
  if (currency === "USD") {
    fromLabel.textContent = `Dólar ${dolarType.value.charAt(0).toUpperCase() + dolarType.value.slice(1)}`;
  } else {
    const currencyNames = {
      "EUR": "Euro",
      "BRL": "Real",
      "CLP": "Peso Chileno",
      "UYU": "Peso Uruguayo"
    };
    fromLabel.textContent = currencyNames[currency];
  }
}

// Currency selection change
fromCurrency.addEventListener("change", function() {
  dolaresSelect.style.display = this.value === "USD" ? "flex" : "none";
  updateFromLabel();
  if (lastTouchedInput) {
    calcluateValue(lastTouchedInput, lastTouchedInput == fromInput ? pesoInput : fromInput);
  }
});

// Dolar type change
dolarType.addEventListener("change", function() {
  selectedDolarValue = cotizaciones.find(item => item.casa === dolarType.value);
  updateFromLabel();
  if (lastTouchedInput) {
    calcluateValue(lastTouchedInput, lastTouchedInput == fromInput ? pesoInput : fromInput);
  }
});

// Update price type selection
tipoPrecioElement.addEventListener("click", function(e) {
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
  switch(text) {
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
});

// Input handling
for (let input of [fromInput, pesoInput]) {
  let otherInput = input == fromInput ? pesoInput : fromInput;

  input.addEventListener("focus", function() {
    lastTouchedInput = input;
    updateArrowDirection();
  });

  input.addEventListener("input", function() {
    calcluateValue(input, otherInput);
    updateArrowDirection();
  });

  input.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      input.blur();
    }
  });

  input.addEventListener("blur", function() {
    input.value = formatNumber(parseFloat(input.value.replace(/\./g, "").replace(",", ".")));
    otherInput.value = formatNumber(parseFloat(otherInput.value.replace(/\./g, "").replace(",", ".")));

    if (input.value == "") {
      otherInput.value = "";
    }

    if (input.value == "NaN") {
      input.value = "";
      otherInput.value = "";
    }
  });
}

function calcluateValue(touchedInput, otherInput) {
  if (touchedInput.value == "") {
    otherInput.value = "";
    return;
  }

  let value = parseFloat(touchedInput.value.replace(/\./g, "").replace(",", "."));
  let result;

  if (touchedInput == pesoInput) {
    if (fromCurrency.value === "USD") {
      result = value / selectedDolarValue[tipoPrecio];
    } else {
      result = value / rates[fromCurrency.value.toLowerCase()].venta;
    }
  } else {
    if (fromCurrency.value === "USD") {
      result = value * selectedDolarValue[tipoPrecio];
    } else {
      result = value * rates[fromCurrency.value.toLowerCase()].venta;
    }
  }

  otherInput.value = formatNumber(result);
}

async function getCotizaciones() {
  let response = await fetch("https://dolarapi.com/v1/dolares");
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
      })
  );
  
  await Promise.all(promises);
}

function formatNumber(number) {
  return number.toLocaleString("es-AR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
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
  if (currentScroll < 10 || (windowHeight + currentScroll) >= documentHeight - 10 || currentScroll < lastScrollTop) {
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

document.addEventListener('mousemove', (e) => {
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
  const isMobile = window.innerWidth <= 768;
  const arrow = document.querySelector(".arrow-symbol");
  
  if (lastTouchedInput === fromInput) {
    arrow.classList.remove("arrow-symbol-left");
  } else {
    arrow.classList.add("arrow-symbol-left");
  }
}

window.addEventListener('resize', updateArrowDirection);


