import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
    // ELEMENTOS DEL DOM
    const boardSelector  = document.getElementById('board-selector');
    const boardTitle     = document.getElementById('current-board-name');
    const colTodo        = document.getElementById('kanban-content-todo');
    const colDoing       = document.getElementById('kanban-content-doing');
    const colDone        = document.getElementById('kanban-content-done');
    
    const formNuevaTarea = document.getElementById('new-task-form');
    const modalTarea     = document.getElementById('task-modal');

    let userProfile = null;
    let currentBoardId = null;

    // =============================
    // 1. INICIO Y SESIÓN
    // =============================
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return window.location.href = '../login/login.html';

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, nombre, empresa_id, rol_id')
        .eq('id', session.user.id)
        .single();

    if (profile) {
        userProfile = profile;
        document.getElementById('user-name-header').textContent = profile.nombre;
        await cargarTableros();
    }

    // =============================
    // 2. CARGAR TABLEROS (POR ROL O PROYECTO)
    // =============================
    async function cargarTableros() {
        // Traemos tableros que: o son globales de la empresa, o son de tu rol, o fuiste invitado
        const { data: tableros, error } = await supabase
            .from('tableros')
            .select('*')
            .eq('empresa_id', userProfile.empresa_id)
            .or(`rol_id.eq.${userProfile.rol_id},rol_id.is.null`);

        if (tableros && tableros.length > 0) {
            boardSelector.innerHTML = tableros.map(b => 
                `<option value="${b.id}">${b.nombre}</option>`
            ).join('');
            
            currentBoardId = tableros[0].id;
            boardTitle.textContent = tableros[0].nombre;
            cargarTareas(currentBoardId);
        }
    }

    // Al cambiar el selector, cargamos otro tablero
    boardSelector.addEventListener('change', (e) => {
        currentBoardId = e.target.value;
        boardTitle.textContent = boardSelector.options[boardSelector.selectedIndex].text;
        cargarTareas(currentBoardId);
    });

    // =============================
    // 3. CARGAR Y RENDERIZAR TAREAS
    // =============================
    async function cargarTareas(boardId) {
        colTodo.innerHTML = ''; colDoing.innerHTML = ''; colDone.innerHTML = '';

        const { data: tareas } = await supabase
            .from('tareas')
            .select('*')
            .eq('tablero_id', boardId)
            .order('created_at', { ascending: true });

        tareas?.forEach(tarea => renderTarjeta(tarea));
    }

    function renderTarjeta(tarea) {
        const columna = document.getElementById(`kanban-content-${tarea.estado}`);
        if (!columna) return;

        const card = document.createElement('div');
        card.className = 'kanban-card';
        card.innerHTML = `
            <h3>${tarea.titulo}</h3>
            <p>${tarea.descripcion || ''}</p>
            <div class="card-actions">
                <span class="priority-badge ${tarea.prioridad}">${tarea.prioridad}</span>
                <button class="btn-next" data-id="${tarea.id}"><i class="fas fa-arrow-right"></i></button>
                <button class="btn-delete" data-id="${tarea.id}"><i class="fas fa-trash"></i></button>
            </div>
        `;

        card.querySelector('.btn-next').onclick = () => moverTarea(tarea.id, tarea.estado);
        card.querySelector('.btn-delete').onclick = () => borrarTarea(tarea.id);
        
        columna.appendChild(card);
    }

    // =============================
    // 4. ACCIONES (MOVER / BORRAR / CREAR)
    // =============================
    async function moverTarea(id, estadoActual) {
        const orden = ['todo', 'doing', 'done'];
        const nuevoEstado = orden[orden.indexOf(estadoActual) + 1];
        if (!nuevoEstado) return;

        await supabase.from('tareas').update({ estado: nuevoEstado }).eq('id', id);
        cargarTareas(currentBoardId);
    }

    async function borrarTarea(id) {
        if (!confirm('¿Borrar tarea?')) return;
        await supabase.from('tareas').delete().eq('id', id);
        cargarTareas(currentBoardId);
    }

    formNuevaTarea.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            tablero_id: currentBoardId,
            titulo: document.getElementById('task-title').value,
            descripcion: document.getElementById('task-desc').value,
            prioridad: document.getElementById('task-priority').value,
            estado: 'todo',
            empresa_id: userProfile.empresa_id
        };

        const { error } = await supabase.from('tareas').insert([payload]);
        if (!error) {
            cerrarModal();
            cargarTareas(currentBoardId);
        }
    });

    // Funciones de Modal (abrirModal / cerrarModal) abreviadas...
});
