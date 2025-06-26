const STORAGE_KEY = 'usuarios';

function obtenerUsuarios() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function guardarUsuarios(usuarios) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usuarios));
}

function agregarUsuario(usuario) {
  const usuarios = obtenerUsuarios();
  usuario.id = usuarios.length ? usuarios[usuarios.length - 1].id + 1 : 1;
  usuarios.push(usuario);
  guardarUsuarios(usuarios);
}

function obtenerUsuarioPorId(id) {
  const usuarios = obtenerUsuarios();
  return usuarios.find(u => u.id === id);
}

function actualizarUsuario(usuarioActualizado) {
  const usuarios = obtenerUsuarios();
  const index = usuarios.findIndex(u => u.id === usuarioActualizado.id);
  if (index !== -1) {
    usuarios[index] = usuarioActualizado;
    guardarUsuarios(usuarios);
  }
}

function eliminarUsuario(id) {
  const usuarios = obtenerUsuarios().filter(u => u.id !== id);
  guardarUsuarios(usuarios);
}
