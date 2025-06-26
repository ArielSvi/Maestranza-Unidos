// usuarios.js
document.addEventListener('DOMContentLoaded', function () {
    const tablaUsuarios = document.getElementById('tablaUsuarios');
    const modalUsuario = new bootstrap.Modal(document.getElementById('modalUsuario'));
    const formulario = document.getElementById('formUsuario');
    const btnAgregar = document.getElementById('btnAgregarUsuario');

    let modoEdicion = false;
    let usuarioEditandoId = null;

    function renderUsuarios() {
        const usuarios = obtenerUsuarios();
        tablaUsuarios.innerHTML = '';
        usuarios.forEach((usuario) => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${usuario.id}</td>
                <td>${usuario.nombre} ${usuario.apellidoPaterno} ${usuario.apellidoMaterno}</td>
                <td>${usuario.usuario}</td>
                <td>${usuario.correo}</td>
                <td>${usuario.rol}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="editarUsuario(${usuario.id})">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="eliminarUsuarioConfirmado(${usuario.id})">Eliminar</button>
                </td>
            `;
            tablaUsuarios.appendChild(fila);
        });
    }

    window.editarUsuario = function (id) {
        const usuario = obtenerUsuarioPorId(id);
        if (usuario) {
            modoEdicion = true;
            usuarioEditandoId = id;

            document.getElementById('nombre').value = usuario.nombre;
            document.getElementById('apellidoPaterno').value = usuario.apellidoPaterno;
            document.getElementById('apellidoMaterno').value = usuario.apellidoMaterno;
            document.getElementById('correo').value = usuario.correo;
            document.getElementById('rol').value = usuario.rol;
            document.getElementById('contrasena').value = usuario.contrasena;

            modalUsuario.show();
        }
    };

    window.eliminarUsuarioConfirmado = function (id) {
        if (confirm("¿Estás seguro de que deseas eliminar este usuario?")) {
            eliminarUsuario(id);
            renderUsuarios();
        }
    };

    formulario.addEventListener('submit', function (e) {
        e.preventDefault();

        const nombre = document.getElementById('nombre').value.trim();
        const apellidoPaterno = document.getElementById('apellidoPaterno').value.trim();
        const apellidoMaterno = document.getElementById('apellidoMaterno').value.trim();

        const usuarioGenerado = `${nombre.charAt(0).toLowerCase()}${apellidoPaterno.toLowerCase()}`;

        const usuarios = obtenerUsuarios();
        const usuarioYaExiste = usuarios.some(u =>
            u.usuario === usuarioGenerado && (!modoEdicion || u.id !== usuarioEditandoId)
        );

        if (usuarioYaExiste) {
            alert(`El usuario "${usuarioGenerado}" ya está registrado. Intenta con otro nombre o apellido.`);
            return;
        }

        const nuevoUsuario = {
            nombre,
            apellidoPaterno,
            apellidoMaterno,
            usuario: usuarioGenerado,
            correo: document.getElementById('correo').value.trim(),
            rol: document.getElementById('rol').value,
            contrasena: document.getElementById('contrasena').value
        };

        if (modoEdicion) {
            nuevoUsuario.id = usuarioEditandoId;
            actualizarUsuario(nuevoUsuario);
        } else {
            agregarUsuario(nuevoUsuario);
        }

        formulario.reset();
        modalUsuario.hide();
        modoEdicion = false;
        usuarioEditandoId = null;
        renderUsuarios();
    });

    btnAgregar.addEventListener('click', function () {
        modoEdicion = false;
        usuarioEditandoId = null;
        formulario.reset();
        modalUsuario.show();
    });

    renderUsuarios();
});
