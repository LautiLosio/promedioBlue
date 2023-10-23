let lista = document.getElementById("lista");
let placehoders = document.querySelectorAll("#placeholder");

let cotizaciones = [];

async function getCotizaciones() {
  const response = await fetch("https://dolarapi.com/v1/dolares");
  const data = await response.json();
  
  setTimeout(() => {
    placehoders.forEach(placeholder => {
      placeholder ? placeholder.remove() : null;
    });
    processData(data);
  }, 500);

}

function processData(data) {
  data.forEach(item => {

    item.promedio = ((item.compra + item.venta) / 2).toFixed(2);

    if (!item.compra) {
      item.promedio = item.venta;
    } else if (!item.venta) {
      item.promedio = item.compra;
    }


    let li = createCotizacionElement(item.nombre, item.casa);
    let textContainer = createTextContainerElement();
    let compraText = createCompraVentaElement("compra", item.compra);
    let ventaText = createCompraVentaElement("venta", item.venta);
    let valueContainer = createValueContainerElement();
    let value = createValueElement(item.promedio);

    appendElements(li, textContainer, compraText, ventaText, valueContainer, value);
    addClickEventListener(li, compraText, ventaText);

    // if window is larger than 1060px show all values
    if (window.innerWidth >= 1060) {
      compraText.classList.add("show");
      ventaText.classList.add("show");
    }
    
    lista.appendChild(li);
  });
}

function createCotizacionElement(nombre, casa) {
  let emojis = {
    "oficial": "💵",
    "blue": "💸",
    "bolsa": "📈",
    "contadoconliqui": "🇺🇲",
    "solidario": "💳️",
    "mayorista": "💰️"
  }

  let li = document.createElement("li");
  li.classList.add("cotizacion");
  li.id = nombre;

  let name = document.createElement("h2");
  name.innerHTML = `${emojis[casa]} ${nombre}`;

  if (casa == "contadoconliqui") {
    name.innerHTML = `${emojis[casa]} Dolar CCL`;
  }

  li.appendChild(name);

  return li;
}

function createTextContainerElement() {
  let textContainer = document.createElement("div");
  textContainer.classList.add("text-container");

  return textContainer;
}

function createCompraVentaElement(id, value) {
  if (!value) {
    value = "No disponible";
  }

  let element = document.createElement("h2");
  element.innerHTML = `${id.charAt(0).toUpperCase() + id.slice(1)}: ${value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) || value}`;
  element.classList.add("compra-venta");
  element.id = id;

  return element;
}

function createValueContainerElement() {
  let valueContainer = document.createElement("div");
  valueContainer.classList.add("value-container");

  return valueContainer;
}

function createValueElement(value) {
  let element = document.createElement("h3");
  element.innerHTML = value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

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
  li.addEventListener("click", () => {
    compraText.classList.toggle("show");
    ventaText.classList.toggle("show");
  });
}

getCotizaciones();
