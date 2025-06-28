const STORAGE_KEY_PROVEEDORES = 'proveedores';

function obtenerProveedores() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY_PROVEEDORES)) || [];
}

function guardarProveedores(proveedores) {
  localStorage.setItem(STORAGE_KEY_PROVEEDORES, JSON.stringify(proveedores));
}

function agregarProveedor(proveedor) {
  const proveedores = obtenerProveedores();
  proveedor.id = proveedores.length ? proveedores[proveedores.length - 1].id + 1 : 1;
  proveedores.push(proveedor);
  guardarProveedores(proveedores);
}

function eliminarProveedorPorId(id) {
  const proveedores = obtenerProveedores().filter(p => p.id !== id);
  guardarProveedores(proveedores);
}

function obtenerProveedorPorId(id) {
  const proveedores = obtenerProveedores();
  return proveedores.find(p => p.id === id);
}

function actualizarProveedor(proveedorActualizado) {
  const proveedores = obtenerProveedores();
  const index = proveedores.findIndex(p => p.id === proveedorActualizado.id);
  if (index !== -1) {
    proveedores[index] = proveedorActualizado;
    guardarProveedores(proveedores);
  }
}
