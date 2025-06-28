const STORAGE_ORDENES = 'ordenesCompra';

function obtenerOrdenesCompra() {
  return JSON.parse(localStorage.getItem(STORAGE_ORDENES)) || [];
}

function guardarOrdenesCompra(lista) {
  localStorage.setItem(STORAGE_ORDENES, JSON.stringify(lista));
}

function agregarOrdenCompra(orden) {
  const ordenes = obtenerOrdenesCompra();
  orden.id = ordenes.length ? ordenes[ordenes.length - 1].id + 1 : 1;
  ordenes.push(orden);
  guardarOrdenesCompra(ordenes);
}

function eliminarOrdenCompra(id) {
  const ordenes = obtenerOrdenesCompra().filter(o => o.id !== id);
  guardarOrdenesCompra(ordenes);
}

function obtenerOrdenCompraPorId(id) {
  return obtenerOrdenesCompra().find(o => o.id === id);
}

function actualizarOrdenCompra(ordenActualizada) {
  const ordenes = obtenerOrdenesCompra();
  const index = ordenes.findIndex(o => o.id === ordenActualizada.id);
  if (index !== -1) {
    ordenes[index] = ordenActualizada;
    guardarOrdenesCompra(ordenes);
  }
}
