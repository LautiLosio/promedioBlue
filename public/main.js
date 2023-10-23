const textBlueAvg = document.getElementById("avg");
const textBlueCompra = document.getElementById("compra");
const textBlueVenta = document.getElementById("venta");
const scrollArrow = document.getElementById("arrow");
const ultimaActualizacion = document.getElementById("ultimaActualizacion");
const reload = document.getElementById("reload");

let blue = {}
const api = "https://dolarapi.com/v1/dolares/"

async function getDolar() {
  const response = await fetch(api + "blue");
  const data = await response.json();
  
  const compra = parseFloat(data.compra);
  const venta = parseFloat(data.venta);
  
  blue = {
    compra: compra,
    venta: venta,
    fechaActualizacion: data.fechaActualizacion,
    avg: (compra + venta) / 2
  }

  updatePage();
}

// Get the date of the last update
async function updatePage() {
  document.title = "Dolar Blue | " + blue.avg.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  
  textBlueAvg.innerHTML = blue.avg.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  textBlueCompra.innerHTML = blue.compra.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  textBlueVenta.innerHTML = blue.venta.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  
  let fecha = new Date(blue.fechaActualizacion) || 'No disponible';
  
  ultimaActualizacion.innerHTML = `Actualizado: ${fecha.toLocaleDateString( 'es-AR')} - ${fecha.toLocaleTimeString('es-AR')}`;
}

[textBlueAvg, textBlueCompra, textBlueVenta].forEach(text => {
  text.addEventListener("click", function () {
    navigator.clipboard.writeText(blue[text.id])
    .then(() => {
      Swal.fire({
        title: `${blue[text.id]} copiado!`,
        icon: 'success',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        position: 'top',
        toast: true,
        color: '#40612a',
        background: '#f0ffdd'
      })
    })
  });
});

// Scroll to bottom
scrollArrow.addEventListener("click", function () {
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: 'smooth'
  });
});

// Reload page
reload.addEventListener("click", function () {
  textBlueAvg.innerHTML = "Cargando...";
  document.title = "Dolar Blue | Cargando...";
  textBlueCompra.innerHTML = "Cargando...";
  textBlueVenta.innerHTML = "Cargando...";
  ultimaActualizacion.innerHTML = `Actualizado: Cargando...`;
  // wait 1 second for suspense
  setTimeout(() => {
    getDolar();
  }, 1000);
});

getDolar();

// auto reload page every 30 minutes
setInterval(() => {
  getDolar();
}, 1800000);