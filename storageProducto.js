const STORAGE_PRODUCTOS = 'productos';

function obtenerProductos() {
  return JSON.parse(localStorage.getItem(STORAGE_PRODUCTOS)) || [];
}

function guardarProductos(productos) {
  localStorage.setItem(STORAGE_PRODUCTOS, JSON.stringify(productos));
}

function agregarProducto(producto) {
  const productos = obtenerProductos();
  producto.id = productos.length ? productos[productos.length - 1].id + 1 : 1;
  productos.push(producto);
  guardarProductos(productos);
}

function eliminarProductoPorId(id) {
  const productos = obtenerProductos().filter(p => p.id !== id);
  guardarProductos(productos);
}

function obtenerProductoPorId(id) {
  return obtenerProductos().find(p => p.id === id);
}

function actualizarProducto(productoActualizado) {
  const productos = obtenerProductos();
  const index = productos.findIndex(p => p.id === productoActualizado.id);
  if (index !== -1) {
    productos[index] = productoActualizado;
    guardarProductos(productos);
  }
}
