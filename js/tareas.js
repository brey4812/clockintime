import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
    // --- ELEMENTOS DEL DOM ---
    const boardSelector    = document.getElementById('board-selector');
    const colTodo          = document.getElementById('kanban-content-todo');
    const colDoing         = document.getElementById('kanban-content-doing');
    const colDone          = document.getElementById('kanban-content-done');
    const modalTarea       = document.getElementById('task-modal');
    const formNuevaTarea   = document.getElementById('new-task-form');
    
    let userProfile = null;
    let currentBoardId = null;
    let editingTaskId = null;

    // --- 1. INICIALIZACIÓN ---
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return window.location.href = '../login/login.html';

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

    if (profile) {
        userProfile = profile;
        document.getElementById('user-name-header').textContent = profile.nombre;
        await cargarTableros();
    }

    // --- 2. GESTIÓN DE TABLEROS (PRIVACIDAD TOTAL) ---
    async function cargarTableros() {
        // Solo traemos los tableros creados por ESTE usuario
        const { data: tableros, error } = await supabase
            .from('tableros')
            .select('*')
            .eq('creado_por', userProfile.id);

        if (tableros && tableros.length > 0) {
            // Llenar el selector con mis tableros
            boardSelector.innerHTML = tableros.map(b => `<option value="${b.id}">${b.nombre}</option>`).join('');
            boardSelector.innerHTML += `<option value="NEW_BOARD">+ Nuevo Tablero...</option>`;
            
            // Seleccionar el primero y cargar sus tareas
            currentBoardId = tableros[0].id;
            boardSelector.value = currentBoardId;
            await cargarTareas(currentBoardId);
        } else {
            // Caso: Usuario nuevo sin tableros
            boardSelector.innerHTML = `<option value="NONE">Sin tableros activos</option>`;
            boardSelector.innerHTML += `<option value="NEW_BOARD">+ Crear mi primer tablero...</option>`;
            limpiarColumnas();
        }
    }

    // Escuchar cambios en el selector de tableros
    boardSelector.onchange = async (e) => {
        const val = e.target.value;
        if (val === 'NEW_BOARD') {
            await crearNuevoTablero();
        } else if (val !== 'NONE') {
            currentBoardId = val;
            await cargarTareas(val);
        }
    };

    async function crearNuevoTablero() {
        const nombre = prompt("Introduce el nombre de tu nuevo tablero:");
        if (!nombre) {
            boardSelector.value = currentBoardId || "NONE";
            return;
        }

        const { data, error } = await supabase
            .from('tableros')
            .insert([{ 
                nombre: nombre, 
                empresa_id: userProfile.empresa_id, 
                creado_por: userProfile.id 
            }])
            .select();

        if (error) {
            alert("Error al crear tablero: " + error.message);
        } else {
            await cargarTableros();
            // Auto-seleccionar el recién creado
            currentBoardId = data[0].id;
            boardSelector.value = currentBoardId;
            await cargarTareas(currentBoardId);
        }
    }

    // --- 3. GESTIÓN DE TAREAS (FILTRADO POR USUARIO) ---
    async function cargarTareas(tableroId) {
        if (!tableroId || tableroId === 'NONE' || tableroId === 'NEW_BOARD') return;
        limpiarColumnas();

        const { data: tareas, error } = await supabase
            .from('tareas')
            .select('*')
            .eq('tablero_id', tableroId)
            .eq('user_id', userProfile.id) // Solo mis tareas
            .order('created_at', { ascending: true });

        if (!error) {
            tareas?.forEach(tarea => renderTarjeta(tarea));
            actualizarContadores();
        }
    }

    function limpiarColumnas() {
        colTodo.innerHTML = ''; 
        colDoing.innerHTML = ''; 
        colDone.innerHTML = '';
        actualizarContadores();
    }

    function renderTarjeta(tarea) {
        const col = document.getElementById(`kanban-content-${tarea.estado}`);
        if (!col) return;

        const card = document.createElement('div');
        card.className = 'kanban-card';
        card.innerHTML = `
            <div class="card-body" style="cursor:pointer;">
                <h3 style="margin:0;">${tarea.titulo}</h3>
                <p style="font-size:0.85rem; color:gray; margin-top:5px;">${tarea.descripcion || 'Sin descripción'}</p>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px;">
                <span class="badge-priority priority-${tarea.prioridad}">${tarea.prioridad}</span>
                <div class="card-actions">
                    <button class="btn-mover" title="Siguiente columna"><i class="fas fa-arrow-right"></i></button>
                    <button class="btn-del" style="color:#ff4d4d; margin-left:12px;"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;

        // Eventos de la tarjeta
        card.querySelector('.card-body').onclick = () => abrirModalParaEditar(tarea);
        
        card.querySelector('.btn-mover').onclick = (e) => { 
            e.stopPropagation(); 
            moverTarea(tarea.id, tarea.estado); 
        };

        card.querySelector('.btn-del').onclick = (e) => { 
            e.stopPropagation(); 
            borrarTarea(tarea.id); 
        };

        col.appendChild(card);
    }

    // --- 4. ACCIONES DE TAREA ---
    async function moverTarea(id, estadoActual) {
        const estados = ['todo', 'doing', 'done'];
        const sigIdx = estados.indexOf(estadoActual) + 1;
        if (sigIdx >= estados.length) return;

        const nuevoEstado = estados[sigIdx];
        const { error } = await supabase
            .from('tareas')
            .update({ estado: nuevoEstado })
            .eq('id', id);

        if (!error) await cargarTareas(currentBoardId);
    }

    async function borrarTarea(id) {
        if (confirm('¿Deseas eliminar esta tarea de forma permanente?')) {
            const { error } = await supabase.from('tareas').delete().eq('id', id);
            if (!error) await cargarTareas(currentBoardId);
        }
    }

    formNuevaTarea.onsubmit = async (e) => {
        e.preventDefault();
        
        if (!currentBoardId || currentBoardId === 'NONE') {
            alert("Necesitas crear un tablero antes de añadir tareas.");
            return;
        }

        const payload = {
            titulo: document.getElementById('task-title').value,
            descripcion: document.getElementById('task-desc').value,
            prioridad: document.getElementById('task-priority').value,
            estado: document.getElementById('task-column').value,
            tablero_id: currentBoardId,
            empresa_id: userProfile.empresa_id,
            user_id: userProfile.id // Guardamos quién creó la tarea
        };

        let res;
        if (editingTaskId) {
            res = await supabase.from('tareas').update(payload).eq('id', editingTaskId);
        } else {
            res = await supabase.from('tareas').insert([payload]);
        }

        if (!res.error) {
            cerrarModal();
            await cargarTareas(currentBoardId);
        } else {
            alert("Error al guardar: " + res.error.message);
        }
    };

    // --- 5. MODALES Y UI ---
    function abrirModalParaEditar(tarea) {
        editingTaskId = tarea.id;
        document.querySelector('#task-modal h2').textContent = "Editar Tarea";
        document.getElementById('task-title').value = tarea.titulo;
        document.getElementById('task-desc').value = tarea.descripcion;
        document.getElementById('task-priority').value = tarea.prioridad;
        document.getElementById('task-column').value = tarea.estado;
        modalTarea.classList.remove('modal-hidden');
    }

    document.getElementById('btn-open-task-modal').onclick = () => {
        if (!currentBoardId || currentBoardId === 'NONE') {
            crearNuevoTablero();
            return;
        }
        editingTaskId = null;
        document.querySelector('#task-modal h2').textContent = "Nueva Tarea";
        formNuevaTarea.reset();
        modalTarea.classList.remove('modal-hidden');
    };

    function cerrarModal() {
        modalTarea.classList.add('modal-hidden');
        editingTaskId = null;
    }

    document.getElementById('btn-close-task-modal').onclick = cerrarModal;
    document.getElementById('btn-cancel-task').onclick = cerrarModal;

    function actualizarContadores() {
        document.getElementById('count-todo').textContent = colTodo.children.length;
        document.getElementById('count-doing').textContent = colDoing.children.length;
        document.getElementById('count-done').textContent = colDone.children.length;
    }
});