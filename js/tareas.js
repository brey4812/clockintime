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
    // 2. LÓGICA DE TABLEROS
    // =============================
    async function cargarTableros() {
        const { data: tableros, error } = await supabase
            .from('tableros')
            .select('*')
            .eq('empresa_id', userProfile.empresa_id)
            .or(`creado_por.eq.${userProfile.id},rol_id.eq.${userProfile.rol_id},rol_id.is.null`);

        if (tableros && tableros.length > 0) {
            boardSelector.innerHTML = tableros.map(b => 
                `<option value="${b.id}">${b.nombre}</option>`
            ).join('');
            
            boardSelector.innerHTML += `<option value="NEW_BOARD">+ Crear tablero personal...</option>`;
            
            if (!currentBoardId) currentBoardId = tableros[0].id;
            boardSelector.value = currentBoardId;
            cargarTareas(currentBoardId);
        } else {
            boardSelector.innerHTML = `<option value="NEW_BOARD">+ Crear mi primer tablero...</option>`;
        }
    }

    boardSelector.addEventListener('change', async (e) => {
        if (e.target.value === 'NEW_BOARD') {
            const nombre = prompt('Nombre del nuevo tablero personal:');
            if (nombre && nombre.trim() !== "") {
                const { data: nuevo, error } = await supabase
                    .from('tableros')
                    .insert([{ 
                        nombre: nombre.trim(), 
                        empresa_id: userProfile.empresa_id,
                        creado_por: userProfile.id 
                    }])
                    .select().single();
                
                if (!error) {
                    currentBoardId = nuevo.id;
                    await cargarTableros();
                }
            } else {
                boardSelector.value = currentBoardId;
            }
        } else {
            currentBoardId = e.target.value;
            cargarTareas(currentBoardId);
        }
    });

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
                    <button class="btn-mover" data-id="${tarea.id}" style="background:none;border:none;cursor:pointer;color:var(--primary-color);"><i class="fas fa-arrow-right"></i></button>
                    <button class="btn-borrar" data-id="${tarea.id}" style="background:none;border:none;cursor:pointer;color:var(--red);margin-left:8px;"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;

        card.querySelector('.btn-mover').onclick = () => moverTarea(tarea.id, tarea.estado);
        card.querySelector('.btn-borrar').onclick = () => borrarTarea(tarea.id);
        columna.appendChild(card);
    }

    formNuevaTarea.onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
            tablero_id: currentBoardId,
            titulo: document.getElementById('task-title').value,
            descripcion: document.getElementById('task-desc').value,
            prioridad: document.getElementById('task-priority').value,
            estado: document.getElementById('task-column').value,
            empresa_id: userProfile.empresa_id,
            creado_por: userProfile.id
        };

        const { error } = await supabase.from('tareas').insert([payload]);
        if (!error) {
            cerrarModal();
            cargarTareas(currentBoardId);
        } else {
            alert("Error al guardar: " + error.message);
        }
    };

    async function moverTarea(id, estadoActual) {
        const orden = ['todo', 'doing', 'done'];
        const nuevo = orden[orden.indexOf(estadoActual) + 1];
        if (!nuevo) return;
        await supabase.from('tareas').update({ estado: nuevo }).eq('id', id);
        cargarTareas(currentBoardId);
    }

    async function borrarTarea(id) {
        if (confirm('¿Eliminar tarea?')) {
            await supabase.from('tareas').delete().eq('id', id);
            cargarTareas(currentBoardId);
        }
    }

    function actualizarContadores() {
        document.getElementById('count-todo').textContent = colTodo.children.length;
        document.getElementById('count-doing').textContent = colDoing.children.length;
        document.getElementById('count-done').textContent = colDone.children.length;
    }

    // =============================
    // 4. CONTROL DEL MODAL
    // =============================
    const abrirModal = () => {
        console.log("Abriendo modal...");
        modalTarea.classList.remove('modal-hidden');
    };

    const cerrarModal = () => {
        modalTarea.classList.add('modal-hidden');
        formNuevaTarea.reset();
    };

    btnAbrirModal?.addEventListener('click', abrirModal);
    btnCerrarModal?.addEventListener('click', cerrarModal);
    btnCancelar?.addEventListener('click', cerrarModal);

    // Cerrar sesión
    document.getElementById('btn-logout')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = '../login/login.html';
    });
});
