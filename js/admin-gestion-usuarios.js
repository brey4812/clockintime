import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Elementos de la tabla
    const usuariosTbody = document.getElementById('usuarios-tbody');
    const userNameHeader = document.getElementById('user-name-header');
    const btnLogout = document.getElementById('btn-logout-admin') || document.getElementById('btn-logout');
    
    // Elementos del Modal de Edición
    const modalEditar = document.getElementById('modal-editar-usuario');
    const btnCerrarModal = document.getElementById('btn-cerrar-modal-edit');
    const formEditar = document.getElementById('form-editar-usuario-modal');
    
    // Inputs del Modal
    const editUserId = document.getElementById('edit-user-id');
    const editNombre = document.getElementById('edit-nombre');
    const editApellido = document.getElementById('edit-apellido');
    const editEmail = document.getElementById('edit-email');
    const editRolSelect = document.getElementById('edit-rol');
    const editAvatarPreview = document.getElementById('edit-avatar-preview');

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

    // =============================
    // CARGAR ROLES DINÁMICAMENTE
    // =============================
    async function cargarRolesDisponibles() {
        const { data: roles, error } = await supabase
            .from('roles')
            .select('*')
            .or(`empresa_id.is.null, empresa_id.eq.${adminProfile.empresa_id}`)
            .order('id', { ascending: true });

        if (error) return [];
        
        if (editRolSelect) {
            editRolSelect.innerHTML = '';
            roles.forEach(rol => {
                const option = new Option(rol.nombre_rol, rol.id);
                editRolSelect.add(option);
            });
        }
        return roles;
    }

    // =============================
    // CARGAR TABLA DE EMPLEADOS
    // =============================
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
                <td>
                    <span class="status-badge" style="background: var(--primary-light); color: var(--primary-color); text-transform: capitalize;">
                        ${emp.roles?.nombre_rol || 'Empleado'}
                    </span>
                </td>
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

        // Eventos Editar
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => abrirModalEdicion(btn.dataset.id));
        });

        // Eventos Eliminar
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => eliminarUsuario(btn.dataset.id));
        });
    }

    // =============================
    // LÓGICA DE LA MINI PESTAÑA (MODAL)
    // =============================
    async function abrirModalEdicion(userId) {
        const { data: user, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) return alert("Error al obtener datos del usuario");

        // Rellenar Modal
        editUserId.value = user.id;
        editNombre.value = user.nombre;
        editApellido.value = user.apellido || '';
        editEmail.value = user.email;
        editRolSelect.value = user.rol_id;
        editAvatarPreview.src = user.avatar_url || 'https://iili.io/fzg2rNt.png';

        // Mostrar Modal
        modalEditar.classList.remove('modal-hidden');
    }

    btnCerrarModal?.addEventListener('click', () => {
        modalEditar.classList.add('modal-hidden');
    });

    formEditar?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const updates = {
            nombre: editNombre.value.trim(),
            apellido: editApellido.value.trim(),
            rol_id: editRolSelect.value,
            updated_at: new Date()
        };

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', editUserId.value);

        if (error) {
            alert("Error al actualizar: " + error.message);
        } else {
            modalEditar.classList.add('modal-hidden');
            cargarEmpleados(); // Recargar tabla
        }
    });

    // =============================
    // ELIMINAR Y LOGOUT
    // =============================
    async function eliminarUsuario(userId) {
        if (!confirm("¿Eliminar a este empleado? Esta acción no se puede deshacer.")) return;
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (error) alert("Error: " + error.message);
        else cargarEmpleados();
    }

    btnLogout?.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = '../login/login.html';
    });

    // INICIALIZACIÓN
    await cargarRolesDisponibles();
    await cargarEmpleados();
});
