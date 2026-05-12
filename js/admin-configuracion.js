import { supabase } from './supabase-client.js';
import { initTheme } from './theme-handler.js';

document.addEventListener('DOMContentLoaded', async () => {
    initTheme();

    const { data: { session } } = await supabase.auth.getSession();
    const inviteCodeDisplay = document.getElementById('invite-code-display');
    const inputNombreEmpresa = document.getElementById('input-nombre-empresa');

    // Obtener datos de la empresa vinculada al admin
    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', session.user.id)
        .single();

    const { data: empresa } = await supabase
        .from('empresas')
        .select('nombre, codigo_invitacion')
        .eq('id', adminProfile.empresa_id)
        .single();

    if (empresa) {
        inputNombreEmpresa.value = empresa.nombre;
        inviteCodeDisplay.textContent = empresa.codigo_invitacion;
    }

    // Función para generar nuevo código (Update en BD)
    document.getElementById('btn-generar-codigo')?.addEventListener('click', async () => {
        const nuevoCodigo = Math.random().toString(36).substring(2, 10).toUpperCase();
        
        const { error } = await supabase
            .from('empresas')
            .update({ codigo_invitacion: nuevoCodigo })
            .eq('id', adminProfile.empresa_id);

        if (!error) {
            inviteCodeDisplay.textContent = nuevoCodigo;
            alert("Código actualizado correctamente");
        }
    });
});
