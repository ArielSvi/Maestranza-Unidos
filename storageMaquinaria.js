const STORAGE_MAQUINARIAS = 'maquinarias';

function obtenerMaquinarias() {
  return JSON.parse(localStorage.getItem(STORAGE_MAQUINARIAS)) || [];
}

function guardarMaquinarias(maquinarias) {
  localStorage.setItem(STORAGE_MAQUINARIAS, JSON.stringify(maquinarias));
}

function agregarMaquinaria(maquinaria) {
  const maquinarias = obtenerMaquinarias();
  maquinaria.id = maquinarias.length ? maquinarias[maquinarias.length - 1].id + 1 : 1;
  maquinarias.push(maquinaria);
  guardarMaquinarias(maquinarias);
}

function eliminarMaquinariaPorId(id) {
  const maquinarias = obtenerMaquinarias().filter(m => m.id !== id);
  guardarMaquinarias(maquinarias);
}

function obtenerMaquinariaPorId(id) {
  return obtenerMaquinarias().find(m => m.id === id);
}

function actualizarMaquinaria(maquinariaActualizada) {
  const maquinarias = obtenerMaquinarias();
  const index = maquinarias.findIndex(m => m.id === maquinariaActualizada.id);
  if (index !== -1) {
    maquinarias[index] = maquinariaActualizada;
    guardarMaquinarias(maquinarias);
  }
}
