import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
    const boardSelector    = document.getElementById('board-selector');
    const colTodo          = document.getElementById('kanban-content-todo');
    const colDoing         = document.getElementById('kanban-content-doing');
    const colDone          = document.getElementById('kanban-content-done');
    const modalTarea       = document.getElementById('task-modal');
    const formNuevaTarea   = document.getElementById('new-task-form');
    
    let userProfile = null;
    let currentBoardId = null;
    let editingTaskId = null;

    // 1. INICIO DE SESIÓN
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return window.location.href = '../login/login.html';

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (profile) {
        userProfile = profile;
        document.getElementById('user-name-header').textContent = profile.nombre;
        await cargarTableros();
    }

    // 2. CARGAR TABLEROS (Filtrado por Usuario)
    async function cargarTableros() {
        // CORRECCIÓN: Filtramos por empresa_id Y por el usuario logueado (creado_por)
        const { data: tableros } = await supabase
            .from('tableros')
            .select('*')
            .eq('empresa_id', userProfile.empresa_id)
            .eq('creado_por', userProfile.id); // Solo mis tableros

        if (tableros && tableros.length > 0) {
            boardSelector.innerHTML = tableros.map(b => `<option value="${b.id}">${b.nombre}</option>`).join('');
            boardSelector.innerHTML += `<option value="NEW_BOARD">+ Nuevo Tablero...</option>`;
            currentBoardId = tableros[0].id;
            boardSelector.value = currentBoardId;
            cargarTareas(currentBoardId);
        } else {
            // Si no hay tableros, invitamos a crear uno
            boardSelector.innerHTML = `<option value="NEW_BOARD">+ Crear mi primer tablero</option>`;
            colTodo.innerHTML = ''; colDoing.innerHTML = ''; colDone.innerHTML = '';
        }
    }

    // 3. CARGAR TAREAS (Filtrado por Tablero y Usuario)
    async function cargarTareas(id) {
        if (!id || id === 'NEW_BOARD') return;
        colTodo.innerHTML = ''; colDoing.innerHTML = ''; colDone.innerHTML = '';

        // CORRECCIÓN: Filtramos que la tarea pertenezca al tablero Y al usuario
        const { data: t } = await supabase
            .from('tareas')
            .select('*')
            .eq('tablero_id', id)
            .eq('user_id', userProfile.id) // Solo mis tareas
            .order('created_at', {ascending: true});

        t?.forEach(tarea => renderTarjeta(tarea));
        actualizarContadores();
    }

    // 4. LÓGICA DE NUEVO TABLERO
    boardSelector.onchange = async (e) => {
        if (e.target.value === 'NEW_BOARD') {
            const nombre = prompt("Nombre del nuevo tablero:");
            if (nombre) {
                const { data, error } = await supabase
                    .from('tableros')
                    .insert([{ 
                        nombre: nombre, 
                        empresa_id: userProfile.empresa_id, 
                        creado_por: userProfile.id 
                    }])
                    .select();
                
                if (!error) {
                    await cargarTableros();
                    boardSelector.value = data[0].id;
                    currentBoardId = data[0].id;
                    cargarTareas(currentBoardId);
                }
            } else {
                boardSelector.value = currentBoardId; // Cancelar
            }
        } else {
            currentBoardId = e.target.value;
            cargarTareas(currentBoardId);
        }
    };

    function renderTarjeta(tarea) {
        const col = document.getElementById(`kanban-content-${tarea.estado}`);
        if (!col) return;

        const card = document.createElement('div');
        card.className = 'kanban-card';
        card.innerHTML = `
            <div class="card-body" style="cursor:pointer;">
                <h3 style="margin:0;">${tarea.titulo}</h3>
                <p style="font-size:0.9rem; color:gray;">${tarea.descripcion || 'Sin descripción'}</p>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                <span class="badge-priority priority-${tarea.prioridad}">${tarea.prioridad}</span>
                <div class="card-actions">
                    <button class="btn-mover" data-id="${tarea.id}" data-estado="${tarea.estado}"><i class="fas fa-arrow-right"></i></button>
                    <button class="btn-del" data-id="${tarea.id}" style="color:red; margin-left:10px;"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;

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

    async function moverTarea(id, estadoActual) {
        const estados = ['todo', 'doing', 'done'];
        const sigIdx = estados.indexOf(estadoActual) + 1;
        if (sigIdx >= estados.length) return;

        const nuevoEstado = estados[sigIdx];
        const { error } = await supabase.from('tareas').update({ estado: nuevoEstado }).eq('id', id);

        if (!error) cargarTareas(currentBoardId);
    }

    // 5. GUARDAR / EDITAR (Inyectando user_id)
    formNuevaTarea.onsubmit = async (e) => {
        e.preventDefault();
        
        const payload = {
            titulo: document.getElementById('task-title').value,
            descripcion: document.getElementById('task-desc').value,
            prioridad: document.getElementById('task-priority').value,
            estado: document.getElementById('task-column').value,
            tablero_id: currentBoardId,
            empresa_id: userProfile.empresa_id,
            user_id: userProfile.id // CORRECCIÓN: Guardamos quién es el dueño
        };

        let res;
        if (editingTaskId) {
            res = await supabase.from('tareas').update(payload).eq('id', editingTaskId);
        } else {
            res = await supabase.from('tareas').insert([payload]);
        }

        if (!res.error) {
            cerrarModal();
            cargarTareas(currentBoardId);
        } else {
            alert("Error: " + res.error.message);
        }
    };

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
        if (!currentBoardId || currentBoardId === 'NEW_BOARD') return alert("Crea un tablero primero");
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

    async function borrarTarea(id) {
        if(confirm('¿Borrar tarea?')) {
            await supabase.from('tareas').delete().eq('id', id);
            cargarTareas(currentBoardId);
        }
    }

    function actualizarContadores() {
        document.getElementById('count-todo').textContent = colTodo.children.length;
        document.getElementById('count-doing').textContent = colDoing.children.length;
        document.getElementById('count-done').textContent = colDone.children.length;
    }
});