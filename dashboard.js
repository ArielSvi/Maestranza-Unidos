document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuarioActivo"));

  if (!usuario || !usuario.rol) {
    alert("No hay sesión iniciada o el usuario no tiene rol definido.");
    window.location.href = "login.html";
    return;
  }

  const rol = usuario.rol;
  const productos = JSON.parse(localStorage.getItem("productos")) || [];

  // Mostrar nombre y rol
  const nombreCompleto = `${usuario.nombre} ${usuario.apellidoPaterno} ${usuario.apellidoMaterno}`.toUpperCase();
  document.getElementById("nombreUsuario").innerHTML = `BIENVENIDO<br>${nombreCompleto}<br>(${rol.toUpperCase()})`;

  // Mostrar stock crítico
  const rolesConAlertaStock = ["administrador", "gestorInventario", "comprador"];
  if (rolesConAlertaStock.includes(rol)) {
    renderizarTablaStock(productos);
    mostrarModalStock(productos);
  } else {
    document.querySelector(".col-md-4.mb-4")?.remove();
  }

  // Mostrar gráfico de movimientos del día
  generarGraficoEntradasSalidas();
});


function renderizarTablaStock(productos) {
  const tablaBody = document.querySelector("tbody");
  tablaBody.innerHTML = "";

  productos.forEach(prod => {
    const porcentaje = (prod.stock / prod.stockMax) * 100;
    let clase = "";

    if (porcentaje <= 20) clase = "stock-critical";
    else if (porcentaje <= 50) clase = "stock-low";

    if (clase) {
      const fila = document.createElement("tr");
      fila.innerHTML = `<td>${prod.nombre}</td><td class="${clase}">${prod.stock}</td>`;
      tablaBody.appendChild(fila);
    }
  });
}

function mostrarModalStock(productos) {
  const listaCriticos = document.getElementById("listaCriticos");
  const listaBajos = document.getElementById("listaBajos");
  listaCriticos.innerHTML = "";
  listaBajos.innerHTML = "";
  let hayCriticos = false;

  productos.forEach(prod => {
    const porcentaje = (prod.stock / prod.stockMax) * 100;
    if (porcentaje <= 20) {
      const item = document.createElement("li");
      item.className = "list-group-item";
      item.textContent = `${prod.nombre}: ${prod.stock} unidades`;
      listaCriticos.appendChild(item);
      hayCriticos = true;
    } else if (porcentaje <= 50) {
      const item = document.createElement("li");
      item.className = "list-group-item";
      item.textContent = `${prod.nombre}: ${prod.stock} unidades`;
      listaBajos.appendChild(item);
    }
  });

  if (hayCriticos) {
    const modal = new bootstrap.Modal(document.getElementById("modalStockCritico"));
    modal.show();
  }
}

function generarGraficoEntradasSalidas() {
  const movimientos = JSON.parse(localStorage.getItem("historial")) || [];

    const hoy = new Date();
    const hoyStr = hoy.toLocaleDateString("es-CL"); // Ej: "15-07-2025"

    const movimientosHoy = movimientos.filter(m => {
    return (
        m.inventario === "Producto" &&
        (m.tipo === "Entrada" || m.tipo === "Salida") &&
        m.fecha?.startsWith(hoyStr)
    );
    });


  // Agrupar por nombre
  const conteo = {};
  movimientosHoy.forEach(m => {
    if (!conteo[m.producto]) {
      conteo[m.producto] = { entrada: 0, salida: 0 };
    }

    if (m.tipo === "Entrada") conteo[m.producto].entrada += m.cantidad;
    else if (m.tipo === "Salida") conteo[m.producto].salida += m.cantidad;
  });

  const categorias = Object.keys(conteo);
  const dataEntrada = categorias.map(p => conteo[p].entrada);
  const dataSalida = categorias.map(p => conteo[p].salida);

  const opciones = {
    chart: { type: 'bar', height: 350 },
    series: [
      { name: 'Entrada', data: dataEntrada },
      { name: 'Salida', data: dataSalida }
    ],
    plotOptions: {
      bar: { horizontal: true, barHeight: '60%' }
    },
    colors: ['#00BFFF', '#1E3A8A'],
    xaxis: { categories: categorias },
    legend: { position: 'top' },
    noData: { text: 'Sin movimientos registrados hoy' }
  };

  const chart = new ApexCharts(document.querySelector("#chart"), opciones);
  chart.render();
}
