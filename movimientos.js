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

  actualizarProducto(producto);

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

  actualizarProducto(producto);
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

document.addEventListener("DOMContentLoaded", () => {
  const loteRecepcion = generarLoteRecepcion();
  const formEntrada = document.getElementById("formEntrada");
  const formSalida = document.getElementById("formSalida");

  if (formEntrada) {
    formEntrada.addEventListener("submit", (e) => {
      e.preventDefault();

      const tipo = document.getElementById("tipoInventario").value;
      const itemId = parseInt(document.getElementById("itemEntrada").value);
      const cantidad = parseInt(document.getElementById("cantidadEntrada").value);
      const fechaVencimiento = document.getElementById("fechaVencimientoEntrada").value;
      const usuario = JSON.parse(localStorage.getItem("usuarioActivo"))?.usuario || "admin";

      if (!tipo || !itemId || !cantidad || (tipo === "producto" && !fechaVencimiento)) {
        alert("Completa todos los campos obligatorios.");
        return;
      }

      const historial = obtenerHistorial();
      const entrada = {
        loteId: Date.now(),
        cantidad,
        fechaIngreso: new Date().toISOString().split("T")[0],
        ubicacion: "Bodega Central",
        loteRecepcion
      };

      if (tipo === "producto") {
        entrada.fechaVencimiento = fechaVencimiento;

        const productos = obtenerProductos();
        const producto = productos.find(p => p.id === itemId);
        if (!producto) return alert("Producto no encontrado.");

        if (!producto.entradas) producto.entradas = [];
        producto.entradas.push(entrada);
        producto.stock = producto.entradas.reduce((sum, e) => sum + e.cantidad, 0);
        guardarProductos(productos);

        historial.push({
          id: Date.now(),
          tipo: "Entrada",
          productoId: itemId,
          cantidad,
          loteId: entrada.loteId,
          loteRecepcion,
          fecha: new Date().toLocaleString("es-CL"),
          usuario,
          ubicacion: entrada.ubicacion,
          fechaVencimiento
        });

      } else if (tipo === "maquinaria") {
        const maquinarias = obtenerMaquinarias();
        const maquinaria = maquinarias.find(m => m.id === itemId);
        if (!maquinaria) return alert("Maquinaria no encontrada.");

        if (!maquinaria.entradas) maquinaria.entradas = [];
        maquinaria.entradas.push(entrada);
        maquinaria.stock = maquinaria.entradas.reduce((sum, e) => sum + e.cantidad, 0);
        guardarMaquinarias(maquinarias);

        historial.push({
          id: Date.now(),
          tipo: "Entrada",
          maquinariaId: itemId,
          cantidad,
          loteId: entrada.loteId,
          loteRecepcion,
          fecha: new Date().toLocaleString("es-CL"),
          usuario,
          ubicacion: entrada.ubicacion
        });
      }

      guardarHistorial(historial);
      alert("Entrada registrada correctamente.");
      formEntrada.reset();
      mostrarStockGlobal();
      mostrarStockMaquinarias();
    });
  }

  if (formSalida) {
  formSalida.addEventListener("submit", (e) => {
    e.preventDefault();

    const tipo = document.getElementById("tipoSalida").value;
    const itemId = parseInt(document.getElementById("itemSalida").value);
    const cantidad = parseInt(document.getElementById("cantidadSalida").value);
    const destino = document.getElementById("destinoSalida").value;
    const usuario = JSON.parse(localStorage.getItem("usuarioActivo"))?.usuario || "admin";

    if (!tipo || !itemId || !cantidad || !destino) {
      alert("Completa todos los campos obligatorios.");
      return;
    }

    const historial = obtenerHistorial();

    if (tipo === "producto") {
      const productos = obtenerProductos();
      const producto = productos.find(p => p.id === itemId);
      if (!producto || !producto.entradas || producto.entradas.length === 0) {
        alert("No hay stock disponible para este producto.");
        return;
      }

      let restante = cantidad;
      producto.entradas.sort((a, b) => new Date(a.fechaIngreso) - new Date(b.fechaIngreso));

      for (const entrada of producto.entradas) {
        if (entrada.ubicacion !== "Bodega Central" || entrada.cantidad === 0) continue;

        const usado = Math.min(restante, entrada.cantidad);
        entrada.cantidad -= usado;
        restante -= usado;

        historial.push({
          id: Date.now(),
          tipo: "Salida",
          productoId: itemId,
          cantidad: usado,
          loteId: entrada.loteId,
          destino,
          fecha: new Date().toLocaleString("es-CL"),
          usuario
        });

        if (restante === 0) break;
      }

      if (restante > 0) {
        alert("Stock insuficiente para producto.");
        return;
      }

      producto.stock = producto.entradas.reduce((sum, e) => sum + e.cantidad, 0);
      guardarProductos(productos);
    }

      if (tipo === "maquinaria") {
        const maquinarias = obtenerMaquinarias();
        const maquinaria = maquinarias.find(m => m.id === itemId);
        if (!maquinaria || !maquinaria.entradas || maquinaria.entradas.length === 0) {
          alert("No hay stock disponible para esta maquinaria.");
          return;
        }

        let restante = cantidad;
        maquinaria.entradas.sort((a, b) => new Date(a.fechaIngreso) - new Date(b.fechaIngreso));

        for (const entrada of maquinaria.entradas) {
          if (entrada.ubicacion !== "Bodega Central" || entrada.cantidad === 0) continue;

          const usado = Math.min(restante, entrada.cantidad);
          entrada.cantidad -= usado;
          restante -= usado;

          historial.push({
            id: Date.now(),
            tipo: "Salida",
            maquinariaId: itemId,
            cantidad: usado,
            loteId: entrada.loteId,
            destino,
            fecha: new Date().toLocaleString("es-CL"),
            usuario
          });

          if (restante === 0) break;
        }

        if (restante > 0) {
          alert("Stock insuficiente para maquinaria.");
          return;
        }

        maquinaria.stock = maquinaria.entradas.reduce((sum, e) => sum + e.cantidad, 0);
        guardarMaquinarias(maquinarias);
      }

      guardarHistorial(historial);
      alert("Salida registrada correctamente.");
      formSalida.reset();
      mostrarStockGlobal();
      mostrarStockMaquinarias();
    });
  }

  actualizarOpcionesInventario(); // Se ejecuta inicialmente
  document.getElementById("tipoInventario")?.addEventListener("change", actualizarOpcionesInventario);
  mostrarStockGlobal();
  mostrarStockMaquinarias();
  
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

function actualizarOpcionesInventario() {
  const tipo = document.getElementById("tipoInventario").value;
  const select = document.getElementById("itemEntrada");
  select.innerHTML = '<option disabled selected value="">Seleccione ítem</option>';

  let items = [];
  if (tipo === "producto") {
    items = obtenerProductos();
  } else if (tipo === "maquinaria") {
    items = obtenerMaquinarias();
  }

  items.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item.id;
    opt.textContent = `${item.nombre} (${item.modelo})`;
    select.appendChild(opt);
  });

  // 🔁 Mostrar/ocultar el campo de fecha según tipo
  const bloqueFecha = document.getElementById("bloqueFecha");
  const campoFecha = document.getElementById("fechaVencimientoEntrada");
  if (tipo === "producto") {
    bloqueFecha.classList.remove("d-none");
    campoFecha.setAttribute("required", "required");
  } else {
    bloqueFecha.classList.add("d-none");
    campoFecha.removeAttribute("required");
  }
}

function mostrarStockMaquinarias() {
  const maquinarias = obtenerMaquinarias();
  const tabla = document.getElementById("tablaStockMaquinarias");
  tabla.innerHTML = "";

  maquinarias.forEach(maquinaria => {
    if (!maquinaria.entradas || maquinaria.entradas.length === 0) return;

    const entradasActivas = maquinaria.entradas.filter(e => e.cantidad > 0);
    if (entradasActivas.length === 0) return;

    const stockTotal = entradasActivas.reduce((sum, e) => sum + e.cantidad, 0);
    const lotesActivos = entradasActivas.length;

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${maquinaria.nombre}</td>
      <td>${maquinaria.modelo}</td>
      <td>${stockTotal}</td>
      <td>${lotesActivos}</td>
    `;
    tabla.appendChild(fila);
  });
}

function actualizarOpcionesSalida() {
  const tipo = document.getElementById("tipoSalida").value;
  const select = document.getElementById("itemSalida");
  select.innerHTML = '<option disabled selected value="">Seleccione ítem</option>';

  let items = [];
  if (tipo === "producto") {
    items = obtenerProductos();
  } else if (tipo === "maquinaria") {
    items = obtenerMaquinarias();
  }

  items.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item.id;
    opt.textContent = `${item.nombre} (${item.modelo})`;
    select.appendChild(opt);
  });
}
