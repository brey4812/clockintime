import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
    const usuariosTbody = document.getElementById('usuarios-tbody');
    const userNameHeader = document.getElementById('user-name-header');
    const btnLogout = document.getElementById('btn-logout-admin');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = '../login/login.html';
        return;
    }

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('nombre, empresa_id')
        .eq('id', session.user.id)
        .single();

    if (userNameHeader && adminProfile) userNameHeader.textContent = adminProfile.nombre;

    async function cargarEmpleados() {
        if (!usuariosTbody) return;

        const { data: empleados, error } = await supabase
            .from('profiles')
            .select(`*, roles(nombre_rol)`)
            .eq('empresa_id', adminProfile.empresa_id)
            .order('nombre', { ascending: true });

        if (error) {
            usuariosTbody.innerHTML = '<tr><td colspan="5">Error al cargar datos.</td></tr>';
            return;
        }

        usuariosTbody.innerHTML = '';

        empleados.forEach(emp => {
            const isSelf = emp.id === session.user.id;
            const fila = document.createElement('tr');
            
            fila.innerHTML = `
                <td><img src="${emp.avatar_url || 'https://iili.io/fzg2rNt.png'}" style="width:35px; border-radius:50%;"></td>
                <td>${emp.nombre} ${emp.apellido || ''}</td>
                <td>${emp.email}</td>
                <td><span class="status-badge">${emp.roles?.nombre_rol || 'Empleado'}</span></td>
                <td>
                    ${isSelf ? 
                        '<span class="text-light">Tú (Gestionar en Perfil)</span>' : 
                        `<button class="btn-action btn-edit" data-id="${emp.id}"><i class="fas fa-edit"></i></button>
                         <button class="btn-action btn-delete" data-id="${emp.id}"><i class="fas fa-trash"></i></button>`
                    }
                </td>
            `;
            usuariosTbody.appendChild(fila);
        });

        // Eventos funcionales
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => editarUsuario(btn.dataset.id));
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => eliminarUsuario(btn.dataset.id));
        });
    }

    // Función de edición real
    function editarUsuario(userId) {
        // Redirigir a una página de edición con el ID o abrir un modal
        // Por ejemplo, si tienes una página de edición:
        window.location.href = `admin-editar-usuario.html?id=${userId}`;
    }

    async function eliminarUsuario(userId) {
        if (!confirm("¿Eliminar este empleado permanentemente?")) return;

        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (error) alert("Error: " + error.message);
        else cargarEmpleados();
    }

    btnLogout?.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = '../login/login.html';
    });

    cargarEmpleados();
});
