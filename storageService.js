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

function inicializarUsuariosBase() {
  const usuarios = obtenerUsuarios();
  if (usuarios.length >= 9) return; // Ya cargados

  const base = [
    { nombre: "Ana", apellidoPaterno: "Admin", apellidoMaterno: "Uno", rol: "administrador" },
    { nombre: "Bruno", apellidoPaterno: "Bodega", apellidoMaterno: "Dos", rol: "bodeguero" },
    { nombre: "Claudia", apellidoPaterno: "Compra", apellidoMaterno: "Tres", rol: "comprador" },
    { nombre: "Diego", apellidoPaterno: "Gestion", apellidoMaterno: "Cuatro", rol: "gestorInventario" },
    { nombre: "Elisa", apellidoPaterno: "Logistica", apellidoMaterno: "Cinco", rol: "encargadoLogistica" },
    { nombre: "Fernando", apellidoPaterno: "Produccion", apellidoMaterno: "Seis", rol: "jefeProduccion" },
    { nombre: "Gabriela", apellidoPaterno: "Auditoria", apellidoMaterno: "Siete", rol: "auditorInventario" },
    { nombre: "Hugo", apellidoPaterno: "Proyecto", apellidoMaterno: "Ocho", rol: "gerenteProyectos" },
    { nombre: "Isabel", apellidoPaterno: "Planta", apellidoMaterno: "Nueve", rol: "trabajadorPlanta" }
  ];

  const usuariosBase = base.map((u, i) => ({
    id: i + 1,
    nombre: u.nombre,
    apellidoPaterno: u.apellidoPaterno,
    apellidoMaterno: u.apellidoMaterno,
    usuario: `${u.nombre.charAt(0).toLowerCase()}${u.apellidoPaterno.toLowerCase()}`,
    correo: `${u.nombre.toLowerCase()}.${u.apellidoPaterno.toLowerCase()}@demo.cl`,
    contrasena: "1234",
    rol: u.rol
  }));

  guardarUsuarios(usuariosBase);

  // ⚠️ Mostrar mensaje solo la primera vez
  if (!localStorage.getItem("usuariosBaseInicializados")) {
    alert("Usuarios demo inicializados correctamente.\n\nPuedes iniciar sesión con cualquiera de los 9 perfiles base usando la contraseña '1234'.");
    localStorage.setItem("usuariosBaseInicializados", "true");
  }
}
