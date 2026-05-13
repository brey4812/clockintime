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

    // --- 1. INICIALIZACIÓN Y SESIÓN ---
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return window.location.href = '../login/login.html';

    // Obtener perfil del usuario actual
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

    // --- 2. GESTIÓN DE TABLEROS (FILTRADO POR USUARIO LOGUEADO) ---
    async function cargarTableros() {
        // Traemos solo los tableros que pertenecen a este usuario específico
        const { data: tableros, error } = await supabase
            .from('tableros')
            .select('*')
            .eq('creado_por', userProfile.id);

        if (tableros && tableros.length > 0) {
            // Llenar el selector con los tableros del usuario
            boardSelector.innerHTML = tableros.map(b => `<option value="${b.id}">${b.nombre}</option>`).join('');
            boardSelector.innerHTML += `<option value="NEW_BOARD">+ Nuevo Tablero...</option>`;
            
            // Cargar por defecto el primer tablero
            currentBoardId = tableros[0].id;
            boardSelector.value = currentBoardId;
            await cargarTareas(currentBoardId);
        } else {
            // Caso: Usuario nuevo o sin tableros propios
            boardSelector.innerHTML = `<option value="NONE">Sin tableros activos</option>`;
            boardSelector.innerHTML += `<option value="NEW_BOARD">+ Crear mi primer tablero...</option>`;
            limpiarColumnas();
        }
    }

    // Evento al cambiar de tablero en el select
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

        // Insertar tablero vinculando empresa y usuario creador
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
            // Seleccionamos el nuevo tablero automáticamente
            currentBoardId = data[0].id;
            boardSelector.value = currentBoardId;
            await cargarTareas(currentBoardId);
        }
    }

    // --- 3. GESTIÓN DE TAREAS (FILTRADO POR TABLERO Y USUARIO) ---
    async function cargarTareas(tableroId) {
        if (!tableroId || tableroId === 'NONE' || tableroId === 'NEW_BOARD') return;
        limpiarColumnas();

        // Filtramos por el tablero seleccionado Y que el dueño sea el usuario actual
        const { data: tareas, error } = await supabase
            .from('tareas')
            .select('*')
            .eq('tablero_id', tableroId)
            .eq('creado_por', userProfile.id) 
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
                <h3 style="margin:0; font-size: 1.1rem;">${tarea.titulo}</h3>
                <p style="font-size:0.85rem; color:gray; margin-top:5px;">${tarea.descripcion || 'Sin descripción'}</p>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px;">
                <span class="badge-priority priority-${tarea.prioridad}">${tarea.prioridad}</span>
                <div class="card-actions">
                    <button class="btn-mover" title="Mover a siguiente fase"><i class="fas fa-arrow-right"></i></button>
                    <button class="btn-del" style="color:#ff4d4d; margin-left:12px;" title="Eliminar"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;

        // Editar al hacer click en la tarjeta
        card.querySelector('.card-body').onclick = () => abrirModalParaEditar(tarea);
        
        // Mover tarea entre columnas
        card.querySelector('.btn-mover').onclick = (e) => { 
            e.stopPropagation(); 
            moverTarea(tarea.id, tarea.estado); 
        };

        // Borrar tarea
        card.querySelector('.btn-del').onclick = (e) => { 
            e.stopPropagation(); 
            borrarTarea(tarea.id); 
        };

        col.appendChild(card);
    }

    // --- 4. ACCIONES (MOVER, BORRAR, GUARDAR) ---
    async function moverTarea(id, estadoActual) {
        const estados = ['todo', 'doing', 'done'];
        const sigIdx = estados.indexOf(estadoActual) + 1;
        if (sigIdx >= estados.length) return; // Límite de columnas alcanzado

        const nuevoEstado = estados[sigIdx];
        const { error } = await supabase
            .from('tareas')
            .update({ estado: nuevoEstado })
            .eq('id', id);

        if (!error) await cargarTareas(currentBoardId);
    }

    async function borrarTarea(id) {
        if (confirm('¿Seguro que quieres borrar esta tarea?')) {
            const { error } = await supabase.from('tareas').delete().eq('id', id);
            if (!error) await cargarTareas(currentBoardId);
        }
    }

    formNuevaTarea.onsubmit = async (e) => {
        e.preventDefault();
        
        if (!currentBoardId || currentBoardId === 'NONE') {
            alert("No tienes un tablero seleccionado.");
            return;
        }

        // Estructura del objeto basada en tus columnas de BD
        const payload = {
            titulo: document.getElementById('task-title').value,
            descripcion: document.getElementById('task-desc').value,
            prioridad: document.getElementById('task-priority').value,
            estado: document.getElementById('task-column').value,
            tablero_id: currentBoardId,
            empresa_id: userProfile.empresa_id,
            creado_por: userProfile.id // Vinculación UUID correcta
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
            alert("Error en la base de datos: " + res.error.message);
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
            alert("Debes crear o seleccionar un tablero primero.");
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