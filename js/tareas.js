import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
    // ELEMENTOS DEL DOM
    const boardSelector  = document.getElementById('board-selector');
    const boardTitle     = document.getElementById('current-board-name');
    const colTodo        = document.getElementById('kanban-content-todo');
    const colDoing       = document.getElementById('kanban-content-doing');
    const colDone        = document.getElementById('kanban-content-done');
    
    // Elementos del Modal de Tareas
    const btnAbrirModal  = document.getElementById('btn-open-task-modal');
    const btnCerrarModal = document.getElementById('btn-close-task-modal');
    const modalTarea     = document.getElementById('task-modal');
    const formNuevaTarea = document.getElementById('new-task-form');

    let userProfile = null;
    let currentBoardId = null;

    // =============================
    // 1. INICIO Y SESIÓN
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
        document.getElementById('user-name-header').textContent = profile.nombre;
        await cargarTableros();
    }

    // =============================
    // 2. LÓGICA DE TABLEROS
    // =============================
    async function cargarTableros() {
        // Traemos: 
        // 1. Tableros creados por mí (personales)
        // 2. Tableros de mi rol (departamento)
        // 3. Tableros globales (null)
        const { data: tableros, error } = await supabase
            .from('tableros')
            .select('*')
            .eq('empresa_id', userProfile.empresa_id)
            .or(`creado_por.eq.${userProfile.id},rol_id.eq.${userProfile.rol_id},rol_id.is.null`);

        if (tableros && tableros.length > 0) {
            boardSelector.innerHTML = tableros.map(b => 
                `<option value="${b.id}">${b.nombre}</option>`
            ).join('');
            
            // Añadir opción para crear uno nuevo
            boardSelector.innerHTML += `<option value="NEW_BOARD">+ Crear nuevo tablero...</option>`;
            
            if (!currentBoardId) currentBoardId = tableros[0].id;
            actualizarInterfazTablero(currentBoardId);
        }
    }

    boardSelector.addEventListener('change', async (e) => {
        if (e.target.value === 'NEW_BOARD') {
            const nombre = prompt('Nombre del nuevo tablero:');
            if (nombre) {
                const { data: nuevo, error } = await supabase
                    .from('tableros')
                    .insert([{ 
                        nombre: nombre, 
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
                boardSelector.value = currentBoardId;
            }
        } else {
            currentBoardId = e.target.value;
            actualizarInterfazTablero(currentBoardId);
        }
    });

    function actualizarInterfazTablero(id) {
        const selectedOption = boardSelector.querySelector(`option[value="${id}"]`);
        if (selectedOption) boardTitle.textContent = selectedOption.text;
        cargarTareas(id);
    }

    // =============================
    // 3. GESTIÓN DE TAREAS
    // =============================
    async function cargarTareas(boardId) {
        colTodo.innerHTML = ''; colDoing.innerHTML = ''; colDone.innerHTML = '';

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
                    <button class="btn-action btn-next" title="Mover"><i class="fas fa-arrow-right"></i></button>
                    <button class="btn-action btn-del" title="Borrar"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;

        card.querySelector('.btn-next').onclick = () => moverTarea(tarea.id, tarea.estado);
        card.querySelector('.btn-del').onclick = () => borrarTarea(tarea.id);
        columna.appendChild(card);
    }

    async function moverTarea(id, estadoActual) {
        const orden = ['todo', 'doing', 'done'];
        const proximo = orden[orden.indexOf(estadoActual) + 1];
        if (!proximo) return;

        await supabase.from('tareas').update({ estado: proximo }).eq('id', id);
        cargarTareas(currentBoardId);
    }

    async function borrarTarea(id) {
        if (confirm('¿Eliminar tarea?')) {
            await supabase.from('tareas').delete().eq('id', id);
            cargarTareas(currentBoardId);
        }
    }

    formNuevaTarea.onsubmit = async (e) => {
        e.preventDefault();
        const info = {
            tablero_id: currentBoardId,
            titulo: document.getElementById('task-title').value,
            descripcion: document.getElementById('task-desc').value,
            prioridad: document.getElementById('task-priority').value,
            estado: document.getElementById('task-column').value,
            empresa_id: userProfile.empresa_id,
            creado_por: userProfile.id
        };

        const { error } = await supabase.from('tareas').insert([info]);
        if (!error) {
            cerrarModal();
            cargarTareas(currentBoardId);
        }
    };

    function actualizarContadores() {
        document.getElementById('count-todo').textContent = colTodo.children.length;
        document.getElementById('count-doing').textContent = colDoing.children.length;
        document.getElementById('count-done').textContent = colDone.children.length;
    }

    // Modal helpers
    btnAbrirModal.onclick = () => modalTarea.classList.remove('modal-hidden');
    btnCerrarModal.onclick = cerrarModal;
    document.getElementById('btn-cancel-task').onclick = cerrarModal;
    function cerrarModal() { 
        modalTarea.classList.add('modal-hidden'); 
        formNuevaTarea.reset(); 
    }
});
