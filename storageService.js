// storageService.js

const STORAGE_KEY = 'usuarios';

// Obtener todos los usuarios
function obtenerUsuarios() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

// Guardar todos los usuarios
function guardarUsuarios(usuarios) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usuarios));
}

// Agregar un nuevo usuario
function agregarUsuario(usuario) {
  const usuarios = obtenerUsuarios();

  // Asignar un ID incremental si no se proporciona
  usuario.id = usuarios.length ? usuarios[usuarios.length - 1].id + 1 : 1;

  usuarios.push(usuario);
  guardarUsuarios(usuarios);
}

// Buscar un usuario por ID
function obtenerUsuarioPorId(id) {
  const usuarios = obtenerUsuarios();
  return usuarios.find(user => user.id === id);
}

// Actualizar un usuario existente
function actualizarUsuario(usuarioActualizado) {
  const usuarios = obtenerUsuarios();
  const index = usuarios.findIndex(user => user.id === usuarioActualizado.id);
  if (index !== -1) {
    usuarios[index] = usuarioActualizado;
    guardarUsuarios(usuarios);
  }
}

// Eliminar un usuario por ID
function eliminarUsuario(id) {
  const usuarios = obtenerUsuarios().filter(user => user.id !== id);
  guardarUsuarios(usuarios);
}
