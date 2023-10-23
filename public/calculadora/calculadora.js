let dolarInput = document.getElementById("dolarInput");
let pesoInput = document.getElementById("pesoInput");
let dolarType = document.getElementById("dolarType");
let tipoPrecioElement = document.getElementById("tipo-precio");

let cotizaciones = {};
let selectedDolarValue;
let lastTouchedInput;
let tipoPrecio = "promedio";

// Carga de cotizaciones y seleccion de dolar
getCotizaciones().then(() => {
  selectedDolarValue = cotizaciones.find(item => item.casa == dolarType.value);
});

// Detector de cambio de tipo de dolar
dolarType.addEventListener("change", function() {
  selectedDolarValue = cotizaciones.find(item => item.casa === dolarType.value);

  if (lastTouchedInput == dolarInput) {
    calcluateValue(dolarInput, pesoInput);
  } else {
    calcluateValue(pesoInput, dolarInput);
  }
});

// Detector de cambio de tipo de precio
tipoPrecioElement.addEventListener("click", function() {
  if (tipoPrecioElement.children[0].classList.contains("active")){
    tipoPrecioElement.children[0].classList.remove("active");
    tipoPrecioElement.children[1].classList.add("active");
    tipoPrecio = "promedio";
  } else if (tipoPrecioElement.children[1].classList.contains("active")){
    tipoPrecioElement.children[1].classList.remove("active");
    tipoPrecioElement.children[2].classList.add("active");
    tipoPrecio = "venta";
  } else if (tipoPrecioElement.children[2].classList.contains("active")){
    tipoPrecioElement.children[2].classList.remove("active");
    tipoPrecioElement.children[0].classList.add("active");
    tipoPrecio = "compra";
  }
  calcluateValue(lastTouchedInput, lastTouchedInput == dolarInput ? pesoInput : dolarInput);
});

// Formateo de numeros al salir del input
for (let input of [dolarInput, pesoInput]) {

  let otherInput = input == dolarInput ? pesoInput : dolarInput;

  input.addEventListener("focus", function() {
    lastTouchedInput = input;
  });

  input.addEventListener("input", function() {
    calcluateValue(input, otherInput);
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

// ------- Funciones -------

// Calculo de dolar a peso y viceversa
function calcluateValue(touchedInput, otherInput) {
  if (touchedInput.value == "") {
    otherInput.value = "";
    return;
  }

  let value = parseFloat(touchedInput.value.replace(/\./g, "").replace(",", "."));

  let result;

  if (touchedInput == pesoInput) {
    result = value / selectedDolarValue[tipoPrecio];
  } else {
    result = value * selectedDolarValue[tipoPrecio];
  }

  otherInput.value = formatNumber(result);
}

// Carga de cotizaciones
async function getCotizaciones() {
  let response = await fetch("https://dolarapi.com/v1/dolares");
  let data = await response.json();

  data.forEach(item => {
    item.promedio = (item.compra + item.venta) / 2;
  });

  cotizaciones = data;
}

function formatNumber(number) {
  return number.toLocaleString("es-AR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  });
}


