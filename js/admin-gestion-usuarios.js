import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {

    // =============================
    // ELEMENTOS DEL DOM
    // =============================
    const usuariosTbody = document.getElementById('usuarios-tbody');
    const userNameHeader = document.getElementById('user-name-header');
    const btnLogout = document.getElementById('btn-logout');

    // =============================
    // 1. VERIFICAR SESIÓN Y CARGAR ADMIN
    // =============================
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        window.location.href = '../login/login.html';
        return;
    }

    // Obtenemos el perfil del admin logueado para saber su empresa_id
    const { data: adminProfile, error: adminError } = await supabase
        .from('profiles')
        .select('nombre, empresa_id')
        .eq('id', session.user.id)
        .single();

    if (adminError || !adminProfile) {
        console.error("Error al obtener perfil del admin:", adminError);
        return;
    }

    // Ponemos el nombre en el header
    if (userNameHeader) userNameHeader.textContent = adminProfile.nombre;

    // =============================
    // 2. CARGAR EMPLEADOS DE LA MISMA EMPRESA
    // =============================
    async function cargarEmpleados() {
        if (!usuariosTbody) return;

        // Consultamos los perfiles que compartan el empresa_id del admin
        // Hacemos un join con 'roles' para traer el nombre del rol
        const { data: empleados, error: empError } = await supabase
            .from('profiles')
            .select(`
                id,
                nombre,
                apellido,
                email,
                avatar_url,
                rol_id,
                roles (nombre_rol)
            `)
            .eq('empresa_id', adminProfile.empresa_id);

        if (empError) {
            console.error("Error cargando empleados:", empError);
            usuariosTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Error al cargar datos</td></tr>`;
            return;
        }

        renderTabla(empleados);
    }

    // =============================
    // 3. RENDERIZAR TABLA
    // =============================
    function renderTabla(empleados) {
        usuariosTbody.innerHTML = '';

        if (!empleados || empleados.length === 0) {
            usuariosTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No hay empleados registrados en tu empresa.</td></tr>`;
            return;
        }

        empleados.forEach(emp => {
            const fila = document.createElement('tr');
            
            // Foto de perfil: prioridad a la subida, si no hay, icono gris
            const fotoHTML = emp.avatar_url 
                ? `<img src="${emp.avatar_url}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">`
                : `<i class="fas fa-user-circle" style="font-size:2rem; color:#cbd5e1;"></i>`;

            // Definimos clases de CSS para los roles
            const rolClase = emp.rol_id === 1 ? 'role-admin' : 'role-employee';
            const esMismoAdmin = emp.id === session.user.id;

            fila.innerHTML = `
                <td><div class="table-profile-pic">${fotoHTML}</div></td>
                <td>${emp.nombre} ${emp.apellido || ''}</td>
                <td>${emp.email}</td>
                <td><span class="role-badge ${rolClase}">${emp.roles?.nombre_rol || 'Empleado'}</span></td>
                <td class="actions-cell">
                    <button class="btn-action btn-delete" data-id="${emp.id}" 
                        ${esMismoAdmin ? 'disabled title="No puedes eliminarte a ti mismo"' : 'title="Eliminar"'}>
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;

            usuariosTbody.appendChild(fila);
        });

        // Eventos para el botón de eliminar
        document.querySelectorAll('.btn-delete').forEach(btn => {
            if (!btn.disabled) {
                btn.addEventListener('click', () => eliminarUsuario(btn.dataset.id));
            }
        });
    }

    // =============================
    // 4. ELIMINAR USUARIO
    // =============================
    async function eliminarUsuario(userId) {
        const confirmacion = confirm("¿Estás seguro de que deseas eliminar a este usuario de la empresa? Esta acción no se puede deshacer.");
        
        if (!confirmacion) return;

        // Nota: En una app real, el borrado de Auth requiere funciones de Admin (Edge Functions)
        // Por ahora, eliminamos su perfil de la tabla 'profiles'
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (error) {
            alert("Error al eliminar: " + error.message);
        } else {
            alert("Usuario eliminado correctamente.");
            cargarEmpleados(); // Recargamos la tabla
        }
    }

    // =============================
    // 5. CERRAR SESIÓN
    // =============================
    btnLogout?.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = '../login/login.html';
    });

    // Iniciar carga de datos
    cargarEmpleados();
});