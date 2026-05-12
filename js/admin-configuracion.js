import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {

    // =============================
    // 1. VERIFICAR SESIÓN
    // =============================
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = '../login/login.html';
        return;
    }

    // =============================
    // 2. OBTENER PERFIL ADMIN
    // =============================
    const { data: adminProfile, error: adminErr } = await supabase
        .from('profiles')
        .select('nombre, empresa_id')
        .eq('id', session.user.id)
        .single();

    if (adminErr || !adminProfile) {
        console.error("Error al obtener perfil:", adminErr);
        return;
    }

    const userNameHeader = document.getElementById('user-name-header');
    if (userNameHeader) userNameHeader.textContent = adminProfile.nombre;
    const empresaId = adminProfile.empresa_id;

    // =============================
    // 3. CARGAR DATOS DE LA EMPRESA
    // =============================
    async function cargarDatosEmpresa() {
        const { data: empresa, error } = await supabase
            .from('empresas')
            .select('*')
            .eq('id', empresaId)
            .single();

        if (error) {
            console.error("Error al cargar empresa:", error);
            return;
        }

        // Poblamos los inputs y el código
        if (document.getElementById('invite-code-display')) {
            document.getElementById('invite-code-display').textContent = empresa.codigo_invitacion || 'SIN CÓDIGO';
        }
        if (document.getElementById('input-nombre-empresa')) {
            document.getElementById('input-nombre-empresa').value = empresa.nombre || '';
        }
        if (document.getElementById('input-plan-actual')) {
            document.getElementById('input-plan-actual').value = empresa.plan || 'Gratis';
        }
    }

    // =============================
    // 4. GESTIÓN DE ROLES
    // =============================
    const rolesTbody = document.getElementById('roles-tbody');
    const formNuevoRol = document.getElementById('form-nuevo-rol');
    const inputNombreRol = document.getElementById('nuevo-rol-nombre');

    async function cargarRolesEmpresa() {
        if (!rolesTbody) return;

        const { data: roles, error } = await supabase
            .from('roles')
            .select('*')
            .or(`empresa_id.is.null,empresa_id.eq.${empresaId}`)
            .order('id', { ascending: true });

        if (error) {
            rolesTbody.innerHTML = '<tr><td colspan="3">Error al cargar roles.</td></tr>';
            return;
        }

        rolesTbody.innerHTML = roles.map(rol => {
            const esMaestro = rol.empresa_id === null;
            return `
                <tr>
                    <td>${rol.nombre_rol}</td>
                    <td><span class="status-badge" style="background:var(--bg-secondary); padding:2px 8px; border-radius:4px; font-size:0.75rem;">
                        ${esMaestro ? 'Sistema' : 'Personalizado'}
                    </span></td>
                    <td>
                        ${esMaestro ? 
                            '<i class="fas fa-lock" title="Protegido" style="opacity:0.5;"></i>' : 
                            `<button class="btn-delete-rol" data-id="${rol.id}" title="Eliminar">
                                <i class="fas fa-trash"></i>
                             </button>`
                        }
                    </td>
                </tr>
            `;
        }).join('');

        document.querySelectorAll('.btn-delete-rol').forEach(btn => {
            btn.addEventListener('click', () => eliminarRol(btn.dataset.id));
        });
    }

    async function eliminarRol(idRol) {
        if (!confirm("¿Eliminar este rol?")) return;
        const { error } = await supabase.from('roles').delete().eq('id', idRol).eq('empresa_id', empresaId);
        if (error) alert("Error: El rol podría estar asignado a un usuario.");
        else cargarRolesEmpresa();
    }

    formNuevoRol?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = inputNombreRol.value.trim();
        if (!nombre) return;
        const { error } = await supabase.from('roles').insert([{ nombre_rol: nombre, empresa_id: empresaId }]);
        if (error) alert("Error al crear: " + error.message);
        else { inputNombreRol.value = ''; cargarRolesEmpresa(); }
    });

    // =============================
    // 5. UTILIDADES (COPIAR / GENERAR)
    // =============================
    document.getElementById('btn-copiar-codigo')?.addEventListener('click', () => {
        const codigo = document.getElementById('invite-code-display').textContent;
        navigator.clipboard.writeText(codigo);
        alert("¡Código copiado al portapapeles!");
    });

    document.getElementById('btn-generar-codigo')?.addEventListener('click', async () => {
        if (!confirm("Si generas un nuevo código, el anterior dejará de funcionar. ¿Continuar?")) return;
        
        const nuevoCodigo = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { error } = await supabase
            .from('empresas')
            .update({ codigo_invitacion: nuevoCodigo })
            .eq('id', empresaId);

        if (error) alert("Error al generar código");
        else cargarDatosEmpresa();
    });

    // 6. CERRAR SESIÓN
    document.getElementById('btn-logout-admin')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = '../login/login.html';
    });

    // Ejecución inicial
    cargarDatosEmpresa();
    cargarRolesEmpresa();
});
