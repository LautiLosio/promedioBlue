// Parámetros
// Path Parameters
// casa
// *
// Casa de cambio
// Type
// string
// Requerido
// Enum
// oficial, blue, bolsa, mayorista, solidario, turista
// Respuesta
// 200
// Devuelve una lista de cotizaciones del dólar
// Content-Type:
// application/json
// array of:
// moneda
// string
// casa
// string
// fecha
// string
// compra
// number
// venta
// number
// [
//   {
//     "moneda": "string",
//     "casa": "string",
//     "fecha": "string",
//     "compra": "number",
//     "venta": "number"
//   }
// ]
// GET
// /v1/cotizaciones/dolares/{casa}
// Variables
// KEY
// VALUE
// casa
// *
// blue
// curl -X GET \
//  https://api.argentinadatos.com/v1/cotizaciones/dolares/blue

// Import the necessary libraries
// Fetch the data from the API

// Dom elements
const chartElement = document.getElementById('chart');
const chartContainer = document.getElementById('chartContainer');
const dateForm = document.getElementById('dateForm');
const dolarType = document.getElementById('dolarType');
const dateContainer = document.getElementById('dateContainer');
const dateInput = document.getElementById('dateInput');
const submitButton = document.getElementById('submitButton');
const preciosContainer = document.getElementById('preciosContainer');
const precioCompra = document.getElementById('precioCompra');
const precioPromedio = document.getElementById('precioPromedio');
const precioVenta = document.getElementById('precioVenta');


// Variables
let cotizaciones = [];
let selectedCasa = 'blue';


// Event listeners
dolarType.addEventListener('change', async function() {
  selectedCasa = dolarType.value;
  
  // disable the date input, set the placeholder to 'Cargando...', and the type to text
  dateInput.disabled = true;
  dateInput.value = '';
  dateInput.type = 'text';
  dateInput.placeholder = 'Cargando...';

  // fetch the data from the API
  await fetchByHouse(selectedCasa).then(data => {
    // get the oldest and newest date from the data
    const oldestDate = new Date(data[0].fecha)
    const newestDate = new Date(data[data.length - 1].fecha)

    // set the input type to date
    dateInput.type = 'date';

    // set the date range for the date input
    dateInput.min = oldestDate.toISOString().split('T')[0];
    dateInput.max = newestDate.toISOString().split('T')[0];

    // enable the date input
    dateInput.disabled = false;
  });
  
});

dateInput.addEventListener('change', async function() {
  if (dateInput.value) {
    submitButton.disabled = false;
  } else {
    submitButton.disabled = true;
  }
});

dateForm.addEventListener('submit', async function(event) {
  event.preventDefault();

  const date = dateInput.value;

  // fetch the data from the API
  await fetchByHouseAndDate(selectedCasa, date).then(data => {


    // get the average price
    const averagePrice = (data.compra + data.venta) / 2;

    // set the prices
    precioCompra.textContent = data.compra.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    precioVenta.textContent = data.venta.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    precioPromedio.textContent = averagePrice.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

    // create the chart
    createChart(data);

  });

});


submitButton.addEventListener('click', function() {
  // preciosContainer.classList.toggle('hidden');
});

// Functions

/**
 * Retrieves the cotizaciones from the specified API endpoint.
 * @returns {Promise<Array>} Array of objects with the cotizaciones
 * @example
 * [
 *  {
 *   "moneda": "USD",
 *   "casa": "oficial",
 *   "nombre": "Oficial",
 *   "compra": 810,
 *   "venta": 850,
 *   "fechaActualizacion": "2024-02-09T16:04:00.000Z"
 *  }
 * ]
 */
async function getCotizaciones() {
  let response = await fetch("https://dolarapi.com/v1/dolares");
  let data = await response.json();
  
  return data;
}

/**
 * Fetch the cotizaciones from the specified casa.
 * @param {string} casa - The casa to fetch the cotizaciones from.
 * @returns {Promise<Array>} Array of objects with historical cotizaciones
 * @example
 * [
 *  {
 *   "casa": "blue",
 *   "compra": 4,
 *   "venta": 4,
 *   "fecha": "2011-01-03"
 *  }
 * ]
 */
async function fetchByHouse(casa) {
  let response = await fetch(`https://api.argentinadatos.com/v1/cotizaciones/dolares/${casa}/`);
  let data = await response.json();
  
  return data;
}

/**
 * Fetch the cotizaciones from the specified casa and date.
 * @param {string} casa - The casa to fetch the cotizaciones from.
 * @param {string} date - The format of the date is 'YYYY-MM-DD'.
 * @returns {Promise<Object>} Array of objects with historical cotizaciones
 * @example
 * {
 *  "casa": "blue",
 *  "compra": 4,
 *  "venta": 4,
 *  "fecha": "2011-01-03"
 * }
 */
async function fetchByHouseAndDate(casa, date) {

  //curl -X GET \
  //https://api.argentinadatos.com/v1/cotizaciones/dolares/blue/2024/01/01

  let response = await fetch(`https://api.argentinadatos.com/v1/cotizaciones/dolares/${casa}/${date.slice(0, 4)}/${date.slice(5, 7)}/${date.slice(8, 10)}/`);
  
  let data = await response.json();

  return data;
}

/**
 * Create a chart with the historical cotizaciones.
 */
async function createChart() {
  console.log('Creating chart...');

  // fetch the data from the API
  const data = await fetchByHouse(selectedCasa);

  // Get the dates and average values
  const dates = data.map(cotizacion => cotizacion.fecha.toLocaleString('es-AR', { year: 'numeric', month: 'short', day: 'numeric' }));
  const averageValues = data.map(cotizacion => (cotizacion.compra + cotizacion.venta) / 2);
  
  // Remove the hidden class from the chart
  chartContainer.classList.remove('hidden');

  // Create the chart

  // Initialize the chart
  const chart = echarts.init(chartElement, null, { useCoarsePointer: true, pointerSize: 10 });

  // Set the chart options
  const options = {
    // Set the title of the chart
    title: {
      text: `Precio historico del dólar ${data[0].casa}`,
      left: 'center',
      textStyle: {
        color: 'white',
        fontWeight: 'bold',
        fontFamily: 'Space Grotesk',
        fontSize: 20,
      },
    },

    xAxis: {
      type: 'category',
      data: dates,
      axisPointer: {
        type: 'shadow',
      },
      axisLabel: {
        color: 'white',
        fontWeight: 'bold',
        fontFamily: 'Space Grotesk',
        fontSize: 16,
      },
      axisLine: {
        lineStyle: {
          color: 'white', // Set the color of the x-axis baseline
        },
      },
      splitLine: { // Add subtle reference lines
        show: true,
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)', // Set the color of the reference lines
        },
      },
    },

    yAxis: {
      type: 'value',
      axisLabel: {
        color: 'white',
        fontWeight: 'bold',
        fontFamily: 'Space Grotesk',
        fontSize: 16,
      },
    },

    tooltip: { // Add tooltip on hover
      trigger: 'axis',
      formatter: '{b0}<br/>${c0}',
      textStyle: {
        color: 'white',
        fontWeight: 'bold',
        fontFamily: 'Space Grotesk',
      },
      backgroundColor: 'rgba(0, 0, 0, 0.7)', // Set the background color of the tooltip
      borderColor: 'white', // Set the border color of the tooltip

    },

    series: [{
      type: 'line',
      data: averageValues,
      smooth: true, // Make the line smooth
      lineStyle: {
        color: '#3e6029', // Set the color of the line
      },
      areaStyle: {
        color: '#3e6029', // Set the color of the area under the line
      },
      showSymbol: false, // Hide the symbols at data points
    }],

    dataZoom: [
      {
        type: 'slider', // Add the datazoom slider
        start: 100 - Math.min(100, Math.floor((365 / dates.length) * 100)), // Set the default zoom to the last year
        end: 100,
        textStyle: {
          color: 'white',
          fontWeight: 'bold',
          fontFamily: 'Space Grotesk',
        },
      },
      {
        type: 'inside', // Enable zooming and panning with mouse or touch
        start: 0,
        end: 100,
      },
    ],
  };

  // Set the chart options and render the chart
  chart.setOption(options);

  
  // Make the chart responsive
  window.addEventListener('resize', () => {
    chart.resize();
  });
}

/**
 * Create the options for the select element
 * @param {Array} cotizaciones - Array of objects with the cotizaciones
 * @example
 * [
 *  {
 *   "moneda": "USD",
 *   "casa": "oficial",
 *   "nombre": "Oficial",
 *   "compra": 810,
 *   "venta": 850,
 *   "fechaActualizacion": "2024-02-09T16:04:00.000Z"
 *  }
 * ]
 */
function createInputOptions(cotizaciones) {
  // Create an unselectable option for placeholder text
  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.textContent = 'Seleccione una cotización';
  placeholderOption.disabled = true;
  placeholderOption.selected = true;
  dolarType.appendChild(placeholderOption);

  // Dynamically create the options for the select element
  cotizaciones.forEach(cotizacion => {
    const option = document.createElement('option');
    option.value = cotizacion.casa;
    option.textContent = cotizacion.nombre;
    dolarType.appendChild(option);
  });
}

// --------------------------

// Main function
async function main() {

  // Fetch the cotizaciones from the API and create the input options
  cotizaciones = await getCotizaciones()
  createInputOptions(cotizaciones);

}


// Run the main function

main();