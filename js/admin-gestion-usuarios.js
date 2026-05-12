import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
    const usuariosTbody = document.getElementById('usuarios-tbody');
    const userNameHeader = document.getElementById('user-name-header');
    const btnLogout = document.getElementById('btn-logout-admin') || document.getElementById('btn-logout');

    // 1. VERIFICAR SESIÓN
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = '../login/login.html';
        return;
    }

    // 2. OBTENER PERFIL DEL ADMIN
    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('nombre, empresa_id')
        .eq('id', session.user.id)
        .single();

    if (userNameHeader && adminProfile) userNameHeader.textContent = adminProfile.nombre;

    // 3. CARGAR EMPLEADOS
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
            
            // Ajuste de foto: object-fit cover para que no se vea rara/estirada
            const fotoHTML = `
                <div style="width: 40px; height: 40px; overflow: hidden; border-radius: 50%; border: 2px solid var(--primary-color);">
                    <img src="${emp.avatar_url || 'https://iili.io/fzg2rNt.png'}" 
                         style="width: 100%; height: 100%; object-fit: cover;">
                </div>
            `;

            fila.innerHTML = `
                <td>${fotoHTML}</td>
                <td>${emp.nombre} ${emp.apellido || ''}</td>
                <td>${emp.email}</td>
                <td><span class="status-badge" style="background: var(--primary-light); color: var(--primary-color);">${emp.roles?.nombre_rol || 'Empleado'}</span></td>
                <td>
                    ${isSelf ? 
                        '<span style="font-size: 0.85rem; color: var(--text-light);">Tú (Admin)</span>' : 
                        `<button class="btn-action btn-edit" data-id="${emp.id}" title="Editar"><i class="fas fa-edit"></i></button>
                         <button class="btn-action btn-delete" data-id="${emp.id}" title="Eliminar"><i class="fas fa-trash"></i></button>`
                    }
                </td>
            `;
            usuariosTbody.appendChild(fila);
        });

        // ASIGNAR EVENTOS
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                window.location.href = `admin-editar-usuario.html?id=${btn.dataset.id}`;
            });
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => eliminarUsuario(btn.dataset.id));
        });
    }

    async function eliminarUsuario(userId) {
        if (!confirm("¿Eliminar a este empleado de la empresa?")) return;

        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (error) alert("Error: " + error.message);
        else cargarEmpleados();
    }

    // 4. CERRAR SESIÓN
    btnLogout?.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = '../login/login.html';
    });

    cargarEmpleados();
});
