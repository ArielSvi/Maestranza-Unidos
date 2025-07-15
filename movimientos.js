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

function obtenerKits() {
  return JSON.parse(localStorage.getItem("kits")) || [];
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
    productoId: itemId,
    producto: `${producto.nombre} (${producto.modelo})`,
    inventario: "Producto",
    cantidad,
    loteId: entrada.loteId,
    loteRecepcion,
    fecha: new Date().toLocaleString("es-CL"),
    usuario,
    ubicacion: entrada.ubicacion,
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
      producto: `${producto.nombre} (${producto.modelo})`,
      inventario: "Producto",
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
        if (producto.stock + cantidad > producto.stockMax) {
          alert(`La cantidad ingresada excede el stock máximo permitido (${producto.stockMax}).\nStock actual: ${producto.stock}`);
          return;
        }
        producto.entradas.push(entrada);
        producto.stock = producto.entradas.reduce((sum, e) => sum + e.cantidad, 0);
        guardarProductos(productos);

        historial.push({
          id: Date.now(),
          tipo: "Entrada",
          producto: `${producto.nombre} (${producto.modelo})`,
          inventario: "Producto",
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
        if (maquinaria.stock + cantidad > maquinaria.stockMax) {
          alert(`La cantidad ingresada excede el stock máximo permitido (${maquinaria.stockMax}).\nStock actual: ${maquinaria.stock}`);
          return;
        }

        maquinaria.entradas.push(entrada);
        maquinaria.stock = maquinaria.entradas.reduce((sum, e) => sum + e.cantidad, 0);
        guardarMaquinarias(maquinarias);

        historial.push({
          id: Date.now(),
          tipo: "Entrada",
          maquinariaId: itemId,
          producto: `${maquinaria.nombre} (${maquinaria.modelo})`,
          inventario: "Maquinaria",
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

    if (tipo === "kit") {
      const kits = obtenerKits();
      const kit = kits.find(k => k.id === itemId);
      if (!kit) return alert("Kit no encontrado.");

      // Verificar si hay stock suficiente de todos los componentes
      const productos = obtenerProductos();
      const maquinarias = obtenerMaquinarias();
      const historial = obtenerHistorial();
      const componentesInsuficientes = [];

      for (const comp of kit.componentes) {
        const cantidadTotal = comp.cantidad * cantidad;
        let entradas = [];

        if (comp.tipo === "producto") {
          const prod = productos.find(p => p.id === comp.id);
          if (!prod || !prod.entradas || prod.entradas.reduce((s, e) => s + e.cantidad, 0) < cantidadTotal) {
            componentesInsuficientes.push(comp.nombre);
          }
        } else if (comp.tipo === "maquinaria") {
          const maq = maquinarias.find(m => m.id === comp.id);
          if (!maq || !maq.entradas || maq.entradas.reduce((s, e) => s + e.cantidad, 0) < cantidadTotal) {
            componentesInsuficientes.push(comp.nombre);
          }
        }
      }

      if (componentesInsuficientes.length > 0) {
        alert("No hay stock suficiente de los siguientes componentes:\n" + componentesInsuficientes.join("\n"));
        return;
      }

      // Descontar stock de cada componente
      for (const comp of kit.componentes) {
        const cantidadTotal = comp.cantidad * cantidad;

        if (comp.tipo === "producto") {
          const prod = productos.find(p => p.id === comp.id);
          prod.entradas.sort((a, b) => new Date(a.fechaIngreso) - new Date(b.fechaIngreso));
          let restante = cantidadTotal;

          for (const entrada of prod.entradas) {
            if (entrada.ubicacion !== "Bodega Central" || entrada.cantidad === 0) continue;

            const usado = Math.min(restante, entrada.cantidad);
            entrada.cantidad -= usado;
            restante -= usado;

            historial.push({
              id: Date.now(),
              tipo: "Salida (Kit)",
              productoId: prod.id,
              producto: comp.nombre,
              inventario: "Producto",
              cantidad: usado,
              loteId: entrada.loteId,
              destino,
              fecha: new Date().toLocaleString("es-CL"),
              usuario,
              kitNombre: kit.nombre,
              kitsEntregados: cantidad
            });


            if (restante === 0) break;
          }

          prod.stock = prod.entradas.reduce((sum, e) => sum + e.cantidad, 0);
        }

        if (comp.tipo === "maquinaria") {
          const maq = maquinarias.find(m => m.id === comp.id);
          maq.entradas.sort((a, b) => new Date(a.fechaIngreso) - new Date(b.fechaIngreso));
          let restante = cantidadTotal;

          for (const entrada of maq.entradas) {
            if (entrada.ubicacion !== "Bodega Central" || entrada.cantidad === 0) continue;

            const usado = Math.min(restante, entrada.cantidad);
            entrada.cantidad -= usado;
            restante -= usado;

            historial.push({
              id: Date.now(),
              tipo: "Salida (Kit)",
              maquinariaId: maq.id,
              producto: comp.nombre,
              inventario: "Maquinaria",
              cantidad: usado,
              loteId: entrada.loteId,
              destino,
              kitNombre: kit.nombre,
              kitsEntregados: cantidad,
              fecha: new Date().toLocaleString("es-CL"),
              usuario
            });

            if (restante === 0) break;
          }

          maq.stock = maq.entradas.reduce((sum, e) => sum + e.cantidad, 0);
        }
      }

      guardarProductos(productos);
      guardarMaquinarias(maquinarias);
      guardarHistorial(historial);
      alert("Salida de kit registrada correctamente.");
      formSalida.reset();
      mostrarStockGlobal();
      mostrarStockMaquinarias();
      return;
    }


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
          producto: `${producto.nombre} (${producto.modelo})`,
          inventario: "Producto",
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
            producto: `${maquinaria.nombre} (${maquinaria.modelo})`,
            inventario: "Maquinaria",
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
  mostrarHistorialKits();

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
  } else if (tipo === "kit") {
    items = obtenerKits();
  }

  items.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item.id;
    opt.textContent = `${item.nombre}`;
    select.appendChild(opt);
  });
}

function mostrarHistorialKits() {
  const historial = obtenerHistorial();
  const tabla = document.getElementById("tablaHistorialKits");
  if (!tabla) return;
  tabla.innerHTML = "";

  // ✅ Agrupar por kitNombre + fecha + destino + usuario
  const grupos = {};

  historial
    .filter(m => m.tipo === "Salida (Kit)")
    .forEach(mov => {
      const clave = `${mov.kitNombre}|${mov.destino}|${mov.fecha}|${mov.usuario}|${mov.kitsEntregados}`;
      if (!grupos[clave]) grupos[clave] = [];
      grupos[clave].push(mov);
    });

  Object.entries(grupos).forEach(([clave, movimientos]) => {
    const [kitNombre, destino, fecha, usuario, cantidadKits] = clave.split("|");

    const componentes = {};
    movimientos.forEach(m => {
      if (!componentes[m.producto]) {
        componentes[m.producto] = { cantidad: 0, tipo: m.inventario };
      }
      componentes[m.producto].cantidad += m.cantidad;
    });

    const listaComponentes = Object.entries(componentes)
      .map(([nombre, data]) => `- ${nombre} (${data.tipo}, x${data.cantidad})`)
      .join("<br>");

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${kitNombre}</td>
      <td>${listaComponentes}</td>
      <td>${cantidadKits}</td>
      <td>${destino}</td>
      <td>${fecha}</td>
      <td>${usuario}</td>
    `;
    tabla.appendChild(fila);
  });
}

