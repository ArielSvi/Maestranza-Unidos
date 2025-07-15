
// Función principal: Detecta tipo de reporte y genera tabla y filtros
function cargarReporteSeleccionado() {
  const tipo = document.getElementById("tipoReporte").value;
  const filtrosDiv = document.getElementById("filtrosDinamicos");
  const tabla = document.getElementById("tablaReportes");

  filtrosDiv.innerHTML = ""; // Limpiar filtros anteriores
  tabla.querySelector("thead").innerHTML = "";
  tabla.querySelector("tbody").innerHTML = "";

  if (!tipo) return;

  switch (tipo) {
    case "productos":
      generarReporteProductos();
      break;
    case "maquinarias":
      generarReporteMaquinarias();
      break;
    case "movimientos":
      generarReporteMovimientos();
      break;
    case "compras":
      generarReporteCompras();
      break;
    case "kits":
      generarReporteKits();
      break;
    default:
      tabla.querySelector("thead").innerHTML = "<tr><th>Tipo de reporte no reconocido</th></tr>";
  }
}

// Reporte de productos
function generarReporteProductos() {
  const data = JSON.parse(localStorage.getItem("productos")) || [];

  const tabla = document.getElementById("tablaReportes");
  const thead = tabla.querySelector("thead");
  const tbody = tabla.querySelector("tbody");

  thead.innerHTML = `
    <tr>
      <th>ID</th><th>Nombre</th><th>Categoría</th><th>Stock</th><th>Stock Máximo</th>
    </tr>
  `;

  tbody.innerHTML = data.map(p => `
    <tr>
      <td>${p.id}</td>
      <td>${p.nombre}</td>
      <td>${p.categoria}</td>
      <td>${p.stock}</td>
      <td>${p.stockMax}</td>
    </tr>
  `).join("");
}

// Reporte de maquinarias
function generarReporteMaquinarias() {
  const data = JSON.parse(localStorage.getItem("maquinarias")) || [];

  const tabla = document.getElementById("tablaReportes");
  const thead = tabla.querySelector("thead");
  const tbody = tabla.querySelector("tbody");

  thead.innerHTML = `
    <tr>
      <th>ID</th><th>Nombre</th><th>Marca</th><th>Modelo</th>
      <th>Categoría</th><th>Stock</th><th>Stock Máximo</th>
    </tr>
  `;

  tbody.innerHTML = data.map(m => `
    <tr>
      <td>${m.id}</td>
      <td>${m.nombre}</td>
      <td>${m.marca}</td>
      <td>${m.modelo}</td>
      <td>${m.categoria}</td>
      <td>${m.stock || 0}</td>
      <td>${m.stockMax || 0}</td>
    </tr>
  `).join("");
}

// Reporte de movimientos con filtros
function generarReporteMovimientos() {
  const data = JSON.parse(localStorage.getItem("historial")) || [];

  // Generar lista única de usuarios
  const usuarios = [...new Set(data.map(m => m.usuario))].filter(Boolean);

  // Filtros dinámicos
  const filtrosDiv = document.getElementById("filtrosDinamicos");
  filtrosDiv.innerHTML = `
    <div class="row g-2 mb-3">
      <div class="col-md-3">
        <label class="form-label">Desde:</label>
        <input type="date" id="filtroDesde" class="form-control" />
      </div>
      <div class="col-md-3">
        <label class="form-label">Hasta:</label>
        <input type="date" id="filtroHasta" class="form-control" />
      </div>
      <div class="col-md-3">
        <label class="form-label">Tipo de Movimiento:</label>
        <select id="filtroTipo" class="form-select">
          <option value="">Todos</option>
          <option value="entrada">Entrada</option>
          <option value="salida">Salida</option>
        </select>
      </div>
      <div class="col-md-3">
        <label class="form-label">Usuario:</label>
        <select id="filtroUsuario" class="form-select">
          <option value="">Todos</option>
          ${usuarios.map(u => `<option value="${u}">${u}</option>`).join("")}
        </select>
      </div>
    </div>
    <button class="btn btn-primary mb-3" onclick="filtrarMovimientos()">Aplicar filtros</button>
  `;

  window._movimientosData = data; // Guardamos para el filtrado
  renderTablaMovimientos(data);
}

function filtrarMovimientos() {
  const desde = document.getElementById("filtroDesde").value;
  const hasta = document.getElementById("filtroHasta").value;
  const tipo = document.getElementById("filtroTipo").value;
  const usuario = document.getElementById("filtroUsuario").value;

  const datos = window._movimientosData || [];

  const filtrado = datos.filter(m => {
    const fecha = new Date(m.fecha);
    const cumpleFecha = (!desde || fecha >= new Date(desde)) &&
                        (!hasta || fecha <= new Date(hasta));
    const cumpleTipo = !tipo || m.tipo.toLowerCase() === tipo;
  const cumpleUsuario = !usuario || m.usuario === usuario;

    return cumpleFecha && cumpleTipo && cumpleUsuario;
  });

  renderTablaMovimientos(filtrado);
}

function renderTablaMovimientos(data) {
  const tabla = document.getElementById("tablaReportes");
  const thead = tabla.querySelector("thead");
  const tbody = tabla.querySelector("tbody");

  thead.innerHTML = `
    <tr>
      <th>Fecha</th><th>Tipo</th><th>Cantidad</th><th>Inventario</th>
      <th>ID Item</th><th>Nombre</th><th>Usuario</th>
    </tr>
  `;

  tbody.innerHTML = data.map(m => `
    <tr>
      <td>${m.fecha}</td>
      <td>${m.tipo}</td>
      <td>${m.cantidad}</td>
      <td>${m.inventario}</td>
      <td>${m.productoId || m.maquinariaId || "-"}</td>
      <td>${m.producto}</td>
      <td>${m.usuario}</td>
    </tr>
  `).join("");
}



// Reporte de compras


function generarReporteCompras() {
  const data = JSON.parse(localStorage.getItem("ordenesCompra")) || [];

  // Descomponer en filas por ítem
  const filas = data.flatMap(orden => {
    return orden.items.map(item => ({
      fecha: orden.fecha,
      id: orden.id,
      proveedor: orden.proveedorNombre,
      categoria: item.categoria,
      producto: item.nombre,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
      usuario: orden.usuario
    }));
  });

  // Obtener usuarios únicos
  const usuarios = [...new Set(filas.map(f => f.usuario))].filter(Boolean);

  // Mostrar filtros
  const filtrosDiv = document.getElementById("filtrosDinamicos");
  filtrosDiv.innerHTML = `
    <div class="row g-2 mb-3">
      <div class="col-md-4">
        <label class="form-label">Desde:</label>
        <input type="date" id="filtroFechaDesdeCompra" class="form-control" />
      </div>
      <div class="col-md-4">
        <label class="form-label">Hasta:</label>
        <input type="date" id="filtroFechaHastaCompra" class="form-control" />
      </div>
      <div class="col-md-4">
        <label class="form-label">Usuario:</label>
        <select id="filtroUsuarioCompra" class="form-select">
          <option value="">Todos</option>
          ${usuarios.map(u => `<option value="${u}">${u}</option>`).join("")}
        </select>
      </div>
    </div>
    <button class="btn btn-primary mb-3" onclick="filtrarCompras()">Aplicar filtros</button>
  `;

  window._comprasData = filas;
  renderTablaCompras(filas);
}

function filtrarCompras() {
  const desde = document.getElementById("filtroFechaDesdeCompra").value;
  const hasta = document.getElementById("filtroFechaHastaCompra").value;
  const usuario = document.getElementById("filtroUsuarioCompra").value;

  const datos = window._comprasData || [];

  const filtrado = datos.filter(c => {
    const fecha = new Date(c.fecha);
    const cumpleFecha = (!desde || fecha >= new Date(desde)) && (!hasta || fecha <= new Date(hasta));
    const cumpleUsuario = !usuario || c.usuario === usuario;
    return cumpleFecha && cumpleUsuario;
  });

  renderTablaCompras(filtrado);
}

function renderTablaCompras(data) {
  const tabla = document.getElementById("tablaReportes");
  const thead = tabla.querySelector("thead");
  const tbody = tabla.querySelector("tbody");

  thead.innerHTML = `
    <tr>
      <th>Fecha</th>
      <th>ID Orden</th>
      <th>Proveedor</th>
      <th>Categoría</th>
      <th>Producto</th>
      <th>Cantidad</th>
      <th>Precio Unitario</th>
      <th>Total</th>
      <th>Usuario</th>
    </tr>
  `;

  tbody.innerHTML = data.map(c => `
    <tr>
      <td>${c.fecha || "-"}</td>
      <td>${c.id || "-"}</td>
      <td>${c.proveedor || "-"}</td>
      <td>${c.categoria || "-"}</td>
      <td>${c.producto || "-"}</td>
      <td>${c.cantidad || 0}</td>
      <td>$${c.precioUnitario?.toLocaleString() || 0}</td>
      <td>$${(c.cantidad * c.precioUnitario)?.toLocaleString() || 0}</td>
      <td>${c.usuario || "-"}</td>
    </tr>
  `).join("");
}




function generarReporteKits() {
  const data = JSON.parse(localStorage.getItem("kits")) || [];

  const tabla = document.getElementById("tablaReportes");
  const thead = tabla.querySelector("thead");
  const tbody = tabla.querySelector("tbody");

  thead.innerHTML = `
    <tr>
      <th>ID</th>
      <th>Nombre del Kit</th>
      <th>Cantidad Disponible</th>
      <th>Componentes</th>
    </tr>
  `;

  tbody.innerHTML = data.map(kit => {
    const lista = kit.componentes?.map(c => {
      return `- ${c.nombre} (${c.tipo}) x${c.cantidad}`;
    }).join("<br>") || "Sin componentes";

    return `
      <tr>
        <td>${kit.id}</td>
        <td>${kit.nombre}</td>
        <td>${kit.stock || 0}</td>
        <td>${lista}</td>
      </tr>
    `;
  }).join("");
}


// Exportar a Excel
function exportarExcel() {
  const tabla = document.getElementById("tablaReportes");
  const wb = XLSX.utils.table_to_book(tabla, { sheet: "Reporte" });
  XLSX.writeFile(wb, "reporte.xlsx");
}

// Exportar a PDF
function exportarPDF() {
  const tabla = document.getElementById("tablaReportes");
  const tipo = document.getElementById("tipoReporte").value;
  const doc = new jspdf.jsPDF('l', 'pt', 'a4');

  // Título del reporte
  const titulo = tipo.charAt(0).toUpperCase() + tipo.slice(1) + " - Reporte de Inventario";
  const fechaHora = new Date().toLocaleString("es-CL");

  // Insertar logo
  const img = new Image();
  img.src = "src/logo.jpg";
  img.onload = function () {
    doc.addImage(img, "JPEG", 40, 20, 80, 40);

    // Título y fecha
    doc.setFontSize(14);
    doc.text(titulo, 140, 40);
    doc.setFontSize(10);
    doc.text(`Generado: ${fechaHora}`, 140, 60);

    // Tabla
    doc.autoTable({
      html: tabla,
      startY: 80,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 191, 255] }
    });

    doc.save(`reporte_${tipo}_${fechaHora.replace(/[:\\/, ]/g, "_")}.pdf`);
  };
}

