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
    const btnCancelar    = document.getElementById('btn-cancel-task');
    const userNameHeader = document.getElementById('user-name-header');

    let userProfile = null;
    let currentBoardId = null;

    // =============================
    // 1. SESIÓN Y PERFIL
    // =============================
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return window.location.href = '../login/login.html';

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

    if (profile) {
        userProfile = profile;
        if (userNameHeader) userNameHeader.textContent = profile.nombre;
        await cargarTableros();
    }

    // =============================
    // 2. GESTIÓN DE TABLEROS
    // =============================
    async function cargarTableros() {
        const { data: tableros, error } = await supabase
            .from('tableros')
            .select('*')
            .eq('empresa_id', userProfile.empresa_id)
            .or(`rol_id.eq.${userProfile.rol_id},rol_id.is.null`);

        if (tableros && tableros.length > 0) {
            boardSelector.innerHTML = tableros.map(b => 
                `<option value="${b.id}">${b.nombre}</option>`
            ).join('');
            
            boardSelector.innerHTML += `<option value="NEW_BOARD">+ Crear tablero nuevo...</option>`;
            
            // Si no hay tablero seleccionado, seleccionamos el primero por defecto
            if (!currentBoardId) currentBoardId = tableros[0].id;
            boardSelector.value = currentBoardId;
            cargarTareas(currentBoardId);
        } else {
            // Si la base de datos está vacía de tableros
            boardSelector.innerHTML = `<option value="">Selecciona "+ Nuevo"</option>`;
            boardSelector.innerHTML += `<option value="NEW_BOARD">+ Crear mi primer tablero...</option>`;
            currentBoardId = null;
            colTodo.innerHTML = '<p style="padding:1rem; opacity:0.5;">Crea un tablero para empezar.</p>';
        }
    }

    boardSelector.addEventListener('change', async (e) => {
        const valor = e.target.value;

        if (valor === 'NEW_BOARD') {
            const nombre = window.prompt('Escribe el nombre del nuevo tablero:');
            if (nombre && nombre.trim() !== "") {
                const { data: nuevo, error } = await supabase
                    .from('tableros')
                    .insert([{ 
                        nombre: nombre.trim(), 
                        empresa_id: userProfile.empresa_id
                    }])
                    .select().single();
                
                if (!error) {
                    currentBoardId = nuevo.id;
                    await cargarTableros();
                } else {
                    alert("Error al crear tablero: " + error.message);
                }
            } else {
                // Si cancela el prompt, devolvemos el selector al tablero anterior
                boardSelector.value = currentBoardId || "";
            }
        } else {
            currentBoardId = valor;
            cargarTareas(currentBoardId);
        }
    });

    // =============================
    // 3. GESTIÓN DE TAREAS
    // =============================
    async function cargarTareas(boardId) {
        if (!boardId) return;
        
        colTodo.innerHTML = ''; 
        colDoing.innerHTML = ''; 
        colDone.innerHTML = '';

        const { data: tareas } = await supabase
            .from('tareas')
            .select('*')
            .eq('tablero_id', boardId)
            .order('created_at', { ascending: true });

        tareas?.forEach(tarea => renderTarjeta(tarea));
        actualizarContadores();
    }

    function renderTarjeta(tarea) {
        const columna = document.getElementById(`kanban-content-${tarea.estado}`);
        if (!columna) return;

        const card = document.createElement('div');
        card.className = 'kanban-card';
        card.innerHTML = `
            <h3>${tarea.titulo}</h3>
            <p>${tarea.descripcion || ''}</p>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                <span class="badge-priority priority-${tarea.prioridad}">${tarea.prioridad}</span>
                <div>
                    <button class="btn-mover" title="Mover a siguiente"><i class="fas fa-arrow-right"></i></button>
                    <button class="btn-borrar" title="Eliminar"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;

        // Lógica de botones de la tarjeta
        card.querySelector('.btn-mover').onclick = () => moverTarea(tarea.id, tarea.estado);
        card.querySelector('.btn-borrar').onclick = () => borrarTarea(tarea.id);
        columna.appendChild(card);
    }

    // --- GUARDAR TAREA ---
formNuevaTarea.onsubmit = async (e) => {
        e.preventDefault();
        
        if (!currentBoardId) {
            alert("⚠️ Selecciona un tablero primero.");
            return;
        }

        const payload = {
            tablero_id: currentBoardId,
            titulo: document.getElementById('task-title').value,
            descripcion: document.getElementById('task-desc').value,
            // Quitamos la línea de prioridad para que no de error
            estado: document.getElementById('task-column').value,
            empresa_id: userProfile.empresa_id
        };

        const { error } = await supabase.from('tareas').insert([payload]);
        
        if (!error) {
            cerrarModal();
            await cargarTareas(currentBoardId);
        } else {
            alert("Error al guardar tarea: " + error.message);
        }
    };
    
    async function moverTarea(id, estadoActual) {
        const orden = ['todo', 'doing', 'done'];
        const indexActual = orden.indexOf(estadoActual);
        
        if (indexActual === -1 || indexActual === orden.length - 1) return;

        const nuevoEstado = orden[indexActual + 1];
        
        const { error } = await supabase
            .from('tareas')
            .update({ estado: nuevoEstado })
            .eq('id', id);

        if (!error) cargarTareas(currentBoardId);
    }

    async function borrarTarea(id) {
        if (confirm('¿Quieres eliminar esta tarea definitivamente?')) {
            const { error } = await supabase
                .from('tareas')
                .delete()
                .eq('id', id);
            
            if (!error) cargarTareas(currentBoardId);
        }
    }

    function actualizarContadores() {
        const cTodo = document.getElementById('count-todo');
        const cDoing = document.getElementById('count-doing');
        const cDone = document.getElementById('count-done');

        if (cTodo) cTodo.textContent = colTodo.children.length;
        if (cDoing) cDoing.textContent = colDoing.children.length;
        if (cDone) cDone.textContent = colDone.children.length;
    }

    // =============================
    // 4. CONTROL DEL MODAL
    // =============================
    const abrirModal = () => {
        if (!currentBoardId) {
            alert("Selecciona o crea un tablero primero.");
            return;
        }
        modalTarea.classList.remove('modal-hidden');
    };

    const cerrarModal = () => {
        modalTarea.classList.add('modal-hidden');
        formNuevaTarea.reset();
    };

    btnAbrirModal?.addEventListener('click', abrirModal);
    btnCerrarModal?.addEventListener('click', cerrarModal);
    btnCancelar?.addEventListener('click', cerrarModal);

    // Logout
    document.getElementById('btn-logout')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = '../login/login.html';
    });
});
