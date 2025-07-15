// --- Sidebar Toggle ---
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("collapsed");
  document.querySelector(".main-content").style.marginLeft = sidebar.classList.contains("collapsed") ? "60px" : "220px";
}

// --- Al cargar la página ---
document.addEventListener("DOMContentLoaded", () => {
  cargarKits();
  cargarComponentes();
});

// --- Cargar componentes (productos y maquinarias) con input de cantidad ---
function cargarComponentes() {
  const listaProductos = document.getElementById("listaProductos");
  const listaMaquinarias = document.getElementById("listaMaquinarias");
  listaProductos.innerHTML = "";
  listaMaquinarias.innerHTML = "";

  const productos = JSON.parse(localStorage.getItem("productos") || "[]");
  const maquinarias = JSON.parse(localStorage.getItem("maquinarias") || "[]");

  productos.forEach((item, i) => {
    const id = `prod-${i}`;
    listaProductos.innerHTML += `
      <div class="form-check d-flex align-items-center justify-content-between">
        <div>
          <input class="form-check-input check-producto" type="checkbox" id="${id}" onchange="habilitarCantidad(this)">
          <label class="form-check-label" for="${id}">${item.nombre} (${item.modelo})</label>
        </div>
        <input type="number" class="form-control ms-2 cantidad-input" data-label="Producto - ${item.nombre} (${item.modelo})" disabled min="1" style="width: 70px;">
      </div>`;
  });

  maquinarias.forEach((item, i) => {
    const id = `maq-${i}`;
    listaMaquinarias.innerHTML += `
      <div class="form-check d-flex align-items-center justify-content-between">
        <div>
          <input class="form-check-input check-maquinaria" type="checkbox" id="${id}" onchange="habilitarCantidad(this)">
          <label class="form-check-label" for="${id}">${item.nombre} (${item.modelo})</label>
        </div>
        <input type="number" class="form-control ms-2 cantidad-input" data-label="Maquinaria - ${item.nombre} (${item.modelo})" disabled min="1" style="width: 70px;">
      </div>`;
  });
}

// --- Habilita input de cantidad al marcar checkbox ---
function habilitarCantidad(checkbox) {
  const input = checkbox.parentElement.parentElement.querySelector(".cantidad-input");
  input.disabled = !checkbox.checked;
  if (checkbox.checked) input.value = 1;
  else input.value = "";
}

// --- Filtro en buscadores ---
function filtrarCheckboxes(input, className) {
  const filtro = input.value.toLowerCase();
  const checks = document.getElementsByClassName(className);
  for (let i = 0; i < checks.length; i++) {
    const label = checks[i].nextElementSibling;
    const visible = label.textContent.toLowerCase().includes(filtro);
    checks[i].parentElement.parentElement.style.display = visible ? "block" : "none";
  }
}

// --- Mostrar kits existentes ---
function cargarKits() {
  const tabla = document.getElementById("tablaKits");
  tabla.innerHTML = "";
  const kits = JSON.parse(localStorage.getItem("kits") || "[]");

  kits.forEach(kit => {
    const lista = kit.componentes.map(comp => `${comp.nombre} (x${comp.cantidad})`).join("<br>");
    tabla.innerHTML += `
      <tr>
        <td>${kit.id}</td>
        <td>${kit.nombre}</td>
        <td>${lista}</td>
        <td><button class="btn btn-danger btn-sm" onclick="eliminarKit(${kit.id})">Eliminar</button></td>
      </tr>`;
  });
}

// --- Eliminar un kit ---
function eliminarKit(id) {
  let kits = JSON.parse(localStorage.getItem("kits") || "[]");
  kits = kits.filter(k => k.id !== id);
  localStorage.setItem("kits", JSON.stringify(kits));
  cargarKits();
}

// --- Crear nuevo kit ---
document.getElementById("formKit").addEventListener("submit", function (e) {
  e.preventDefault();

  const nombre = document.getElementById("nombreKit").value.trim();

  const inputsCantidad = document.querySelectorAll(".cantidad-input");
  const componentes = [];

  const productos = obtenerProductos(); // función de storageProducto.js
  const maquinarias = obtenerMaquinarias(); // función de storageMaquinaria.js


  inputsCantidad.forEach(input => {
    if (!input.disabled || parseInt(input.value) > 0) {
      const label = input.dataset.label;
      const cantidadPorKit = parseInt(input.value);
      // Detectar si es producto o maquinaria
      let tipo = "";
      let item = productos.find(p => `Producto - ${p.nombre} (${p.modelo})` === label);
      if (item) tipo = "producto";
      else {
        item = maquinarias.find(m => `Maquinaria - ${m.nombre} (${m.modelo})` === label);
        if (item) tipo = "maquinaria";
      }

      if (item) {
        componentes.push({
          tipo,
          id: item.id,
          nombre: label,
          cantidad: cantidadPorKit
        });
      }

    }
  });

  if (!nombre || componentes.length === 0) {
    alert("Completa todos los campos y selecciona al menos un componente.");
    return;
  }


  // Guardar nuevo kit
  const nuevoKit = {
    id: Date.now(),
    nombre,
    componentes
  };


  const kits = JSON.parse(localStorage.getItem("kits") || "[]");
  kits.push(nuevoKit);
  localStorage.setItem("kits", JSON.stringify(kits));

  document.getElementById("formKit").reset();
  bootstrap.Modal.getInstance(document.getElementById("nuevoKitModal")).hide();
  cargarKits();
});
