import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
    // =============================
    // ELEMENTOS DEL DOM
    // =============================
    const boardSelector  = document.getElementById('board-selector');
    const boardTitle     = document.getElementById('current-board-name');
    const colTodo        = document.getElementById('kanban-content-todo');
    const colDoing       = document.getElementById('kanban-content-doing');
    const colDone        = document.getElementById('kanban-content-done');
    
    const btnAbrirModal  = document.getElementById('btn-open-task-modal');
    const btnCerrarModal = document.getElementById('btn-close-task-modal');
    const modalTarea     = document.getElementById('task-modal');
    const formNuevaTarea = document.getElementById('new-task-form');

    let userProfile = null;
    let currentBoardId = null;

    // =============================
    // 1. SESIÓN Y PERFIL
    // =============================
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return window.location.href = '../login/login.html';

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

    if (profile) {
        userProfile = profile;
        document.getElementById('user-name-header').textContent = profile.nombre;
        await cargarTableros();
    }

    // =============================
    // 2. GESTIÓN DE TABLEROS
    // =============================
    async function cargarTableros() {
        // Traemos tableros personales, de rol o globales
        const { data: tableros, error } = await supabase
            .from('tableros')
            .select('*')
            .eq('empresa_id', userProfile.empresa_id)
            .or(`creado_por.eq.${userProfile.id},rol_id.eq.${userProfile.rol_id},rol_id.is.null`);

        if (error) {
            console.error("Error cargando tableros:", error.message);
            return;
        }

        if (tableros && tableros.length > 0) {
            boardSelector.innerHTML = tableros.map(b => 
                `<option value="${b.id}">${b.nombre}</option>`
            ).join('');
            
            // Opción mágica para crear tablero
            boardSelector.innerHTML += `<option value="NEW_BOARD">+ Nuevo Tablero Personal...</option>`;
            
            // Si no hay tablero seleccionado, cogemos el primero
            if (!currentBoardId) currentBoardId = tableros[0].id;
            
            boardSelector.value = currentBoardId;
            const selectedText = boardSelector.options[boardSelector.selectedIndex].text;
            boardTitle.textContent = selectedText;
            
            cargarTareas(currentBoardId);
        } else {
            // Si no hay tableros, forzamos la creación de uno
            boardSelector.innerHTML = `<option value="NEW_BOARD">+ Crear mi primer tablero...</option>`;
            boardTitle.textContent = "Sin tableros";
        }
    }

    boardSelector.addEventListener('change', async (e) => {
        if (e.target.value === 'NEW_BOARD') {
            const nombre = prompt('Escribe el nombre de tu nuevo tablero personal:');
            if (nombre && nombre.trim() !== "") {
                const { data: nuevo, error } = await supabase
                    .from('tableros')
                    .insert([{ 
                        nombre: nombre.trim(), 
                        empresa_id: userProfile.empresa_id,
                        creado_por: userProfile.id 
                    }])
                    .select()
                    .single();
                
                if (!error) {
                    currentBoardId = nuevo.id;
                    await cargarTableros();
                }
            } else {
                boardSelector.value = currentBoardId || "";
            }
        } else {
            currentBoardId = e.target.value;
            boardTitle.textContent = boardSelector.options[boardSelector.selectedIndex].text;
            cargarTareas(currentBoardId);
        }
    });

    // =============================
    // 3. GESTIÓN DE TAREAS
    // =============================
    async function cargarTareas(boardId) {
        if (!boardId) return;
        
        // Limpiar columnas
        colTodo.innerHTML = ''; colDoing.innerHTML = ''; colDone.innerHTML = '';

        const { data: tareas, error } = await supabase
            .from('tareas')
            .select('*')
            .eq('tablero_id', boardId)
            .order('created_at', { ascending: true });

        if (!error && tareas) {
            tareas.forEach(tarea => renderTarjeta(tarea));
        }
        actualizarContadores();
    }

    function renderTarjeta(tarea) {
        const columnaId = `kanban-content-${tarea.estado}`;
        const columna = document.getElementById(columnaId);
        if (!columna) return;

        const card = document.createElement('div');
        card.className = 'kanban-card';
        card.innerHTML = `
            <h3>${tarea.titulo}</h3>
            <p>${tarea.descripcion || ''}</p>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                <span class="badge-priority priority-${tarea.prioridad}">${tarea.prioridad}</span>
                <div class="card-btns">
                    <button class="btn-next" data-id="${tarea.id}" title="Mover"><i class="fas fa-arrow-right"></i></button>
                    <button class="btn-del" data-id="${tarea.id}" title="Borrar"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;

        card.querySelector('.btn-next').onclick = () => moverTarea(tarea.id, tarea.estado);
        card.querySelector('.btn-del').onclick = () => borrarTarea(tarea.id);
        columna.appendChild(card);
    }

    // --- ACCIÓN: GUARDAR TAREA ---
    formNuevaTarea.onsubmit = async (e) => {
        e.preventDefault();
        
        if (!currentBoardId) {
            alert("Selecciona un tablero primero");
            return;
        }

        const btnSubmit = document.getElementById('btn-submit-task');
        btnSubmit.disabled = true;
        btnSubmit.textContent = "Guardando...";

        const nuevaTarea = {
            tablero_id: currentBoardId,
            titulo: document.getElementById('task-title').value.trim(),
            descripcion: document.getElementById('task-desc').value.trim(),
            prioridad: document.getElementById('task-priority').value,
            estado: document.getElementById('task-column').value,
            empresa_id: userProfile.empresa_id,
            creado_por: userProfile.id
        };

        const { error } = await supabase.from('tareas').insert([nuevaTarea]);

        if (error) {
            console.error("Error Supabase:", error.message);
            alert("Error al guardar: " + error.message);
        } else {
            cerrarModal();
            await cargarTareas(currentBoardId);
        }
        
        btnSubmit.disabled = false;
        btnSubmit.textContent = "Guardar Tarea";
    };

    // --- ACCIÓN: MOVER TAREA ---
    async function moverTarea(id, estadoActual) {
        const orden = ['todo', 'doing', 'done'];
        const indice = orden.indexOf(estadoActual);
        if (indice === -1 || indice === orden.length - 1) return;

        const nuevoEstado = orden[indice + 1];
        const { error } = await supabase
            .from('tareas')
            .update({ estado: nuevoEstado })
            .eq('id', id);

        if (!error) cargarTareas(currentBoardId);
    }

    // --- ACCIÓN: BORRAR TAREA ---
    async function borrarTarea(id) {
        if (!confirm('¿Seguro que quieres eliminar esta tarea?')) return;
        const { error } = await supabase.from('tareas').delete().eq('id', id);
        if (!error) cargarTareas(currentBoardId);
    }

    function actualizarContadores() {
        document.getElementById('count-todo').textContent = colTodo.children.length;
        document.getElementById('count-doing').textContent = colDoing.children.length;
        document.getElementById('count-done').textContent = colDone.children.length;
    }

    // =============================
    // 4. CONTROL DEL MODAL
    // =============================
    btnAbrirModal.onclick = () => modalTarea.classList.remove('modal-hidden');
    btnCerrarModal.onclick = cerrarModal;
    document.getElementById('btn-cancel-task').onclick = cerrarModal;

    function cerrarModal() {
        modalTarea.classList.add('modal-hidden');
        formNuevaTarea.reset();
    }

    // Logout
    document.getElementById('btn-logout')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = '../login/login.html';
    });
});
