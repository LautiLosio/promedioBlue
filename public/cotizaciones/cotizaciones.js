let lista = document.getElementById('lista');
let placeholders = []; // Will store placeholder elements

let cotizaciones = [];

// Scroll behavior for back button
let lastScrollTop = 0;
let scrollTimeout;
const volverButton = document.querySelector('.back-button');
const SCROLL_THRESHOLD = 50;
const SCROLL_TIMEOUT = 1500;

function formatARS(value) {
  const numeric = typeof value === 'number' ? value : parseFloat(value);
  if (Number.isNaN(numeric)) {
    return 'No disponible';
  }
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(numeric);
}

function createPlaceholders() {
  placeholders = []; // Clear any existing placeholders
  for (let i = 0; i < 9; i++) {
    const li = document.createElement('li');
    li.classList.add('cotizacion');
    li.id = 'placeholder';

    const h2 = document.createElement('h2');
    h2.classList.add('placeholder');
    h2.textContent = 'Actualizando cotizaciones...';

    const textContainer = document.createElement('div');
    textContainer.classList.add('text-container');

    const compraText = document.createElement('h2');
    compraText.classList.add('compra-venta', 'placeholder');
    compraText.textContent = 'Compra';

    const valueContainer = document.createElement('div');
    valueContainer.classList.add('value-container', 'placeholder');
    const h3 = document.createElement('h3');
    h3.textContent = 'Consultando...';
    valueContainer.appendChild(h3);

    const ventaText = document.createElement('h2');
    ventaText.classList.add('compra-venta', 'placeholder');
    ventaText.textContent = 'Venta';

    textContainer.appendChild(compraText);
    textContainer.appendChild(valueContainer);
    textContainer.appendChild(ventaText);

    li.appendChild(h2);
    li.appendChild(textContainer);
    lista.appendChild(li);
    placeholders.push(li); // Store the placeholder element
  }
}

async function getCotizaciones() {
  createPlaceholders();

  const [dolarResponse, euroResponse, realResponse] = await Promise.all([
    fetch('https://dolarapi.com/v1/dolares'),
    fetch('https://dolarapi.com/v1/cotizaciones/eur'),
    fetch('https://dolarapi.com/v1/cotizaciones/brl'),
  ]);

  const [dolarData, euroData, realData] = await Promise.all([
    dolarResponse.json(),
    euroResponse.json(),
    realResponse.json(),
  ]);

  // Remove all placeholders
  placeholders.forEach(placeholder => {
    placeholder.remove();
  });
  placeholders = []; // Clear the array

  // Combine all data into a single array
  const allData = [...dolarData, euroData, realData];
  processData(allData);
}

function processData(data) {
  // Sort the data array to ensure Euro and Real appear after oficial and blue
  data.sort((a, b) => {
    // Define the desired order
    const order = {
      oficial: 0,
      blue: 1,
      EUR: 2,
      BRL: 3,
    };

    // For dollar types, use casa for ordering
    if (a.moneda === 'USD' && b.moneda === 'USD') {
      return order[a.casa] - order[b.casa];
    }
    // For Euro and Real, use moneda for ordering
    if (order[a.moneda] !== undefined && order[b.moneda] !== undefined) {
      return order[a.moneda] - order[b.moneda];
    }
    // If only one item is in the order object, it should come first
    if (order[a.moneda] !== undefined) return -1;
    if (order[b.moneda] !== undefined) return 1;
    // For other items, maintain their original order
    return 0;
  });

  data.forEach(item => {
    item.promedio = ((item.compra + item.venta) / 2).toFixed(2);

    if (!item.compra) {
      item.promedio = item.venta;
    } else if (!item.venta) {
      item.promedio = item.compra;
    }

    let li = createCotizacionElement(item.nombre, item.casa, item.moneda);
    let textContainer = createTextContainerElement();
    let compraText = createCompraVentaElement('compra', item.compra, item.casa);
    let ventaText = createCompraVentaElement('venta', item.venta, item.casa);
    let valueContainer = createValueContainerElement();
    let value = createValueElement(item.promedio);

    appendElements(li, textContainer, compraText, ventaText, valueContainer, value);
    addClickEventListener(li, compraText, ventaText);

    // if window is larger than 1060px show all values
    if (window.innerWidth >= 1060) {
      compraText.classList.add('show');
      ventaText.classList.add('show');
    }

    lista.appendChild(li);
  });
}

function createCotizacionElement(nombre, casa, moneda) {
  let emojis = {
    oficial: '💵',
    blue: '💸',
    bolsa: '📈',
    contadoconliqui: '🇺🇲',
    tarjeta: '💳️',
    mayorista: '💰️',
    cripto: '🪙',
    EUR: '💶',
    BRL: '🇧🇷',
  };

  let li = document.createElement('li');
  li.classList.add('cotizacion');
  li.id = nombre;

  let name = document.createElement('h2');
  name.innerHTML = `${emojis[casa]} ${nombre}`;

  // special cases
  if (casa == 'contadoconliqui') {
    name.innerHTML = `${emojis[casa]} Dolar CCL`;
  }
  if (casa == 'bolsa') {
    name.innerHTML = `${emojis[casa]} Bolsa (MEP)`;
  }
  if (casa == 'oficial' && moneda == 'EUR') {
    name.innerHTML = `${emojis['EUR']} Euro`;
  }
  if (casa == 'oficial' && moneda == 'BRL') {
    name.innerHTML = `${emojis['BRL']} Real Brasileño`;
  }

  li.appendChild(name);

  return li;
}

function createTextContainerElement() {
  let textContainer = document.createElement('div');
  textContainer.classList.add('text-container');

  return textContainer;
}

function createCompraVentaElement(displayText, value, casa) {
  if (!value) {
    value = 'No disponible';
  }

  let element = document.createElement('h2');
  element.innerHTML = `${displayText.charAt(0).toUpperCase() + displayText.slice(1)}: ${formatARS(value)}`;
  element.classList.add('compra-venta');
  element.id = `${displayText}-${casa}`;

  return element;
}

function createValueContainerElement() {
  let valueContainer = document.createElement('div');
  valueContainer.classList.add('value-container');

  return valueContainer;
}

function createValueElement(value) {
  let element = document.createElement('h3');
  element.innerHTML = `${formatARS(value)}`;

  return element;
}

function appendElements(li, textContainer, compraText, ventaText, valueContainer, value) {
  textContainer.appendChild(compraText);
  valueContainer.appendChild(value);
  textContainer.appendChild(valueContainer);
  textContainer.appendChild(ventaText);
  li.appendChild(textContainer);
}

function addClickEventListener(li, compraText, ventaText) {
  li.addEventListener('click', () => {
    compraText.classList.toggle('show');
    ventaText.classList.toggle('show');
  });
}

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

getCotizaciones();
