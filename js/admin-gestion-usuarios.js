import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {

    // =============================
    // 1. ELEMENTOS DEL DOM
    // =============================
    const usuariosTbody = document.getElementById('usuarios-tbody');
    const userNameHeader = document.getElementById('user-name-header');
    const btnLogout = document.getElementById('btn-logout-admin');

    // =============================
    // 2. VERIFICAR SESIÓN Y CARGAR ADMIN
    // =============================
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        window.location.href = '../login/login.html';
        return;
    }

    // Obtenemos el perfil del admin para filtrar por su empresa_id
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

    const empresaId = adminProfile.empresa_id;

    // =============================
    // 3. CARGAR EMPLEADOS DE LA MISMA EMPRESA
    // =============================
    async function cargarEmpleados() {
        if (!usuariosTbody) return;

        // Consultamos perfiles y traemos el nombre del rol desde la tabla 'roles'
        const { data: empleados, error } = await supabase
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
            .eq('empresa_id', empresaId)
            .order('nombre', { ascending: true });

        if (error) {
            console.error("Error al cargar empleados:", error);
            usuariosTbody.innerHTML = '<tr><td colspan="5" class="text-center">Error al cargar los datos.</td></tr>';
            return;
        }

        if (!empleados || empleados.length === 0) {
            usuariosTbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay empleados registrados.</td></tr>';
            return;
        }

        usuariosTbody.innerHTML = '';

        empleados.forEach(emp => {
            const fotoUrl = emp.avatar_url || 'https://iili.io/fzg2rNt.png'; // Logo por defecto
            const nombreCompleto = `${emp.nombre} ${emp.apellido || ''}`;
            const nombreRol = emp.roles?.nombre_rol || 'Empleado';
            
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>
                    <img src="${fotoUrl}" alt="Avatar" style="width:35px; height:35px; border-radius:50%; object-fit:cover;">
                </td>
                <td>${nombreCompleto}</td>
                <td>${emp.email}</td>
                <td><span class="status-badge status-pending" style="background:#0056b3; color:white;">${nombreRol}</span></td>
                <td>
                    <button class="btn-action btn-edit" title="Editar" onclick="alert('Función de edición próximamente')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-delete" data-id="${emp.id}" title="Eliminar" ${emp.id === session.user.id ? 'style="display:none;"' : ''}>
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            usuariosTbody.appendChild(fila);
        });

        // Eventos para el botón de eliminar
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => eliminarUsuario(btn.dataset.id));
        });
    }

    // =============================
    // 4. ELIMINAR USUARIO
    // =============================
    async function eliminarUsuario(userId) {
        const confirmacion = confirm("¿Estás seguro de que deseas eliminar a este usuario de la empresa? Se borrará su perfil permanentemente.");
        
        if (!confirmacion) return;

        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (error) {
            alert("Error al eliminar: " + error.message);
        } else {
            alert("Usuario eliminado correctamente.");
            cargarEmpleados();
        }
    }

    // =============================
    // 5. CERRAR SESIÓN
    // =============================
    btnLogout?.addEventListener('click', async (e) => {
        e.preventDefault();
        const { error } = await supabase.auth.signOut();
        if (!error) {
            window.location.href = '../login/login.html';
        }
    });

    // Iniciar carga
    cargarEmpleados();
});
