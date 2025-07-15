// movimientos.js

// === Utilidades de almacenamiento ===
function obtenerProductos() {
  return JSON.parse(localStorage.getItem("productos")) || [];
}

function guardarProductos(productos) {
  localStorage.setItem("productos", JSON.stringify(productos));
}

function obtenerHistorial() {
  return JSON.parse(localStorage.getItem("historial")) || [];
}

function guardarHistorial(historial) {
  localStorage.setItem("historial", JSON.stringify(historial));
}

function generarLoteRecepcion() {
  const fecha = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const secuencia = Date.now().toString().slice(-4);
  return `RC-${fecha}-${secuencia}`;
}

function registrarEntrada({ productoId, cantidad, fechaVencimiento, loteRecepcion, usuario }) {
  const productos = obtenerProductos();
  const producto = productos.find(p => p.id === productoId);
  if (!producto) return alert("Producto no encontrado.");

  if (!producto.entradas) producto.entradas = [];

  const entrada = {
    loteId: Date.now(),
    cantidad,
    fechaIngreso: new Date().toISOString().split("T")[0],
    fechaVencimiento,
    ubicacion: "Bodega Central",
    loteRecepcion
  };

  producto.entradas.push(entrada);

  // ✅ Actualizar stock total del producto
  producto.stock = producto.entradas
    .filter(e => e.cantidad > 0)
    .reduce((sum, e) => sum + e.cantidad, 0);

  guardarProductos(productos);

  const historial = obtenerHistorial();
  historial.push({
    id: Date.now(),
    tipo: "Entrada",
    productoId,
    cantidad,
    loteId: entrada.loteId,
    loteRecepcion,
    fecha: new Date().toLocaleString("es-CL"),
    usuario,
    ubicacion: "Bodega Central",
    fechaVencimiento
  });
  guardarHistorial(historial);

  alert("Entrada registrada correctamente en lote " + loteRecepcion);
}

function registrarEntradaMaquinaria({ maquinariaId, cantidad, fechaVencimiento, loteRecepcion, usuario }) {
  const maquinarias = obtenerMaquinarias();
  const maquinaria = maquinarias.find(m => m.id === maquinariaId);
  if (!maquinaria) return alert("Maquinaria no encontrada.");

  if (!maquinaria.entradas) maquinaria.entradas = [];

  const entrada = {
    loteId: Date.now(),
    cantidad,
    fechaIngreso: new Date().toISOString().split("T")[0],
    fechaVencimiento,
    ubicacion: "Bodega Central",
    loteRecepcion
  };

  maquinaria.entradas.push(entrada);

  maquinaria.stock = maquinaria.entradas
    .filter(e => e.cantidad > 0)
    .reduce((sum, e) => sum + e.cantidad, 0);

  actualizarMaquinaria(maquinaria);

  const historial = obtenerHistorial();
  historial.push({
    id: Date.now(),
    tipo: "Entrada",
    inventario: "maquinaria",
    maquinariaId,
    cantidad,
    loteId: entrada.loteId,
    loteRecepcion,
    fecha: new Date().toLocaleString("es-CL"),
    usuario,
    ubicacion: "Bodega Central",
    fechaVencimiento
  });
  guardarHistorial(historial);

  alert("Entrada registrada correctamente en lote " + loteRecepcion);
}


function registrarSalidaOptimizada({ productoId, cantidad, destino, usuario }) {
  const productos = obtenerProductos();
  const producto = productos.find(p => p.id === productoId);
  if (!producto || !producto.entradas || producto.entradas.length === 0) {
    alert("No hay stock disponible para este producto.");
    return;
  }

  let cantidadRestante = cantidad;
  const historial = obtenerHistorial();

  producto.entradas.sort((a, b) => new Date(a.fechaIngreso) - new Date(b.fechaIngreso));

  for (const entrada of producto.entradas) {
    if (entrada.ubicacion !== "Bodega Central") continue;
    if (entrada.cantidad === 0) continue;

    const usado = Math.min(cantidadRestante, entrada.cantidad);
    entrada.cantidad -= usado;
    cantidadRestante -= usado;

    historial.push({
      id: Date.now(),
      tipo: "Salida",
      productoId,
      cantidad: usado,
      loteId: entrada.loteId,
      destino,
      fecha: new Date().toLocaleString("es-CL"),
      usuario
    });

    if (cantidadRestante === 0) break;
  }

  if (cantidadRestante > 0) {
    alert("Stock insuficiente en Bodega Central. No se pudo completar la salida completa.");
    return;
  }

  // ✅ Actualizar stock total del producto
  producto.stock = producto.entradas
    .filter(e => e.cantidad > 0)
    .reduce((sum, e) => sum + e.cantidad, 0);

  guardarProductos(productos);
  guardarHistorial(historial);

  alert("Salida registrada correctamente.");
}


function cargarOpcionesProductos(selectElementId) {
  const productos = obtenerProductos();
  const select = document.getElementById(selectElementId);
  select.innerHTML = '<option disabled selected value="">Seleccione producto</option>';
  productos.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.nombre} (${p.modelo})`;
    select.appendChild(opt);
  });
}

function cargarOpcionesMaquinarias(selectElementId) {
  const maquinarias = obtenerMaquinarias();
  const select = document.getElementById(selectElementId);
  select.innerHTML = '<option disabled selected value="">Seleccione maquinaria</option>';
  maquinarias.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = `${m.nombre} (${m.modelo})`;
    select.appendChild(opt);
  });
}


document.addEventListener("DOMContentLoaded", () => {
  cargarOpcionesProductos("producto");
  cargarOpcionesProductos("productoSalida");

  cargarOpcionesMaquinarias("maquinaria");

  const formEntradaMaquinaria = document.getElementById("formEntradaMaquinaria");
  if (formEntradaMaquinaria) {
    formEntradaMaquinaria.addEventListener("submit", (e) => {
      e.preventDefault();
      const maquinariaId = parseInt(document.getElementById("maquinaria").value);
      const cantidad = parseInt(document.getElementById("cantidadMaquinaria").value);
      const fechaVencimiento = document.getElementById("fechaVencimientoMaquinaria").value;
      const usuario = JSON.parse(localStorage.getItem("usuarioActivo"))?.usuario || "admin";

      if (!maquinariaId || !cantidad || !fechaVencimiento) {
        alert("Completa todos los campos obligatorios.");
        return;
      }

      registrarEntradaMaquinaria({ maquinariaId, cantidad, fechaVencimiento, loteRecepcion, usuario });
      formEntradaMaquinaria.reset();
      mostrarStockGlobal(); // o mostrarStockGlobalMaquinaria();
    });
  }

  const loteRecepcion = generarLoteRecepcion();
  const formEntrada = document.getElementById("formEntradaProducto");
  if (formEntrada) {
    formEntrada.addEventListener("submit", (e) => {
      e.preventDefault();
      const productoId = parseInt(document.getElementById("producto").value);
      const cantidad = parseInt(document.getElementById("cantidad").value);
      const fechaVencimiento = document.getElementById("fechaVencimiento").value;
      const usuario = JSON.parse(localStorage.getItem("usuarioActivo"))?.usuario || "admin";

      if (!productoId || !cantidad || !fechaVencimiento) {
        alert("Completa todos los campos obligatorios.");
        return;
      }

      registrarEntrada({ productoId, cantidad, fechaVencimiento, loteRecepcion, usuario });
      formEntrada.reset();
      mostrarStockGlobal();
    });
  }

  const formSalida = document.getElementById("formSalidaProducto");
  if (formSalida) {
    formSalida.addEventListener("submit", (e) => {
      e.preventDefault();
      const productoId = parseInt(document.getElementById("productoSalida").value);
      const cantidad = parseInt(document.getElementById("cantidadSalida").value);
      const destino = document.getElementById("destinoSalida").value;
      const usuario = JSON.parse(localStorage.getItem("usuarioActivo"))?.usuario || "admin";

      if (!productoId || !cantidad || !destino) {
        alert("Completa todos los campos obligatorios.");
        return;
      }

      registrarSalidaOptimizada({ productoId, cantidad, destino, usuario });
      formSalida.reset();
      mostrarStockGlobal();
    });
  }

  mostrarStockGlobal();
});



function mostrarStockGlobal() {
  const productos = obtenerProductos();
  const tabla = document.getElementById("tablaStockGlobal");
  tabla.innerHTML = "";

  productos.forEach(producto => {
    if (!producto.entradas || producto.entradas.length === 0) return;

    const entradasActivas = producto.entradas.filter(e => e.cantidad > 0);
    if (entradasActivas.length === 0) return;

    const stockTotal = entradasActivas.reduce((sum, e) => sum + e.cantidad, 0);
    const lotesActivos = entradasActivas.length;
    const fechasVencimiento = entradasActivas.map(e => new Date(e.fechaVencimiento));
    const proxVencimiento = fechasVencimiento.length
      ? fechasVencimiento.sort((a, b) => a - b)[0].toISOString().split("T")[0]
      : "-";

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${producto.nombre}</td>
      <td>${producto.modelo}</td>
      <td>${stockTotal}</td>
      <td>${lotesActivos}</td>
      <td>${proxVencimiento}</td>
    `;
    tabla.appendChild(fila);
  });
}

