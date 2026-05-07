document.addEventListener('DOMContentLoaded', () => {

    // =============================
    // ELEMENTOS DEL DOM
    // =============================
    const btnAbrirModal   = document.getElementById('btn-open-task-modal');
    const btnCerrarModal  = document.getElementById('btn-close-task-modal');
    const btnCancelar     = document.getElementById('btn-cancel-task');
    const formNuevaTarea  = document.getElementById('new-task-form');
    const modalTarea      = document.getElementById('task-modal');

    const inputTitulo     = document.getElementById('task-title');
    const inputDesc       = document.getElementById('task-desc');
    const selectPrioridad = document.getElementById('task-priority');
    const selectColumna   = document.getElementById('task-column');

    // Contenidos de las columnas kanban
    const colTodo         = document.getElementById('kanban-content-todo');
    const colDoing        = document.getElementById('kanban-content-doing');
    const colDone         = document.getElementById('kanban-content-done');

    // =============================
    // COLORES POR PRIORIDAD
    // =============================
    const priorityConfig = {
        high:   { label: 'Alta',  clase: 'priority-high'   },
        medium: { label: 'Media', clase: 'priority-medium' },
        low:    { label: 'Baja',  clase: 'priority-low'    }
    };

    // =============================
    // CARGAR TAREAS DEL LOCALSTORAGE
    // (al iniciar renderizamos las tareas guardadas en cada columna)
    // =============================
    function cargarTareas() {

        const tareas = JSON.parse(localStorage.getItem('tareas')) || [];

        // Limpiamos las columnas antes de pintar (dejamos las hardcodeadas del HTML si no hay tareas)
        if (tareas.length > 0) {
            colTodo.innerHTML  = '';
            colDoing.innerHTML = '';
            colDone.innerHTML  = '';
        }

        tareas.forEach(tarea => renderTarjeta(tarea, false));
    }

    // =============================
    // RENDERIZAR TARJETA KANBAN
    // (creamos la tarjeta visual y la añadimos a la columna correspondiente)
    // =============================
    function renderTarjeta(tarea, guardar = true) {

        const columna = getColumna(tarea.columna);
        if (!columna) return;

        const prio    = priorityConfig[tarea.prioridad] || priorityConfig['medium'];

        const card = document.createElement('div');
        card.className = 'kanban-card';
        card.dataset.id = tarea.id;

        card.innerHTML = `
            <h3>${tarea.titulo}</h3>
            ${tarea.descripcion ? `<p>${tarea.descripcion}</p>` : ''}
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem;">
                <span class="badge-priority ${prio.clase}">${prio.label}</span>
                <div>
                    <button class="btn-mover" data-id="${tarea.id}" title="Mover a siguiente columna"
                        style="background:none;border:none;cursor:pointer;color:var(--text-light);font-size:0.8rem;">
                        <i class="fas fa-arrow-right"></i>
                    </button>
                    <button class="btn-borrar-tarea" data-id="${tarea.id}" title="Eliminar"
                        style="background:none;border:none;cursor:pointer;color:var(--red);font-size:0.8rem;margin-left:4px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>`;

        columna.appendChild(card);

        // Asignamos eventos a los botones de la tarjeta recién creada
        card.querySelector('.btn-mover').addEventListener('click', () => moverTarea(tarea.id));
        card.querySelector('.btn-borrar-tarea').addEventListener('click', () => borrarTarea(tarea.id));

        if (guardar) guardarTareas();
    }

    // =============================
    // OBTENER COLUMNA POR NOMBRE
    // =============================
    function getColumna(nombre) {
        if (nombre === 'todo')  return colTodo;
        if (nombre === 'doing') return colDoing;
        if (nombre === 'done')  return colDone;
        return null;
    }

    // =============================
    // MOVER TAREA A LA SIGUIENTE COLUMNA
    // (todo → doing → done, si ya está en done no hace nada)
    // =============================
    function moverTarea(id) {

        let tareas = JSON.parse(localStorage.getItem('tareas')) || [];
        const idx  = tareas.findIndex(t => t.id === id);
        if (idx === -1) return;

        const orden = ['todo', 'doing', 'done'];
        const actual = tareas[idx].columna;
        const posActual = orden.indexOf(actual);

        if (posActual < orden.length - 1) {
            tareas[idx].columna = orden[posActual + 1];
            localStorage.setItem('tareas', JSON.stringify(tareas));
            reconstruirTablero();
        }
    }

    // =============================
    // BORRAR TAREA
    // =============================
    function borrarTarea(id) {

        if (!confirm('¿Eliminar esta tarea?')) return;

        let tareas = JSON.parse(localStorage.getItem('tareas')) || [];
        tareas = tareas.filter(t => t.id !== id);
        localStorage.setItem('tareas', JSON.stringify(tareas));
        reconstruirTablero();
    }

    // =============================
    // RECONSTRUIR EL TABLERO COMPLETO
    // (borramos todo y volvemos a pintar desde localStorage)
    // =============================
    function reconstruirTablero() {
        colTodo.innerHTML  = '';
        colDoing.innerHTML = '';
        colDone.innerHTML  = '';
        cargarTareas();
    }

    // =============================
    // GUARDAR TAREAS EN LOCALSTORAGE
    // =============================
    function guardarTareas() {
        const tareas = JSON.parse(localStorage.getItem('tareas')) || [];
        localStorage.setItem('tareas', JSON.stringify(tareas));
    }

    // =============================
    // CREAR NUEVA TAREA DESDE EL FORMULARIO
    // =============================
    function crearTarea(event) {

        event.preventDefault();

        const titulo = inputTitulo ? inputTitulo.value.trim() : '';
        if (!titulo) {
            alert('El título es obligatorio.');
            return;
        }

        const nuevaTarea = {
            id:          Date.now().toString(),
            titulo:      titulo,
            descripcion: inputDesc       ? inputDesc.value.trim()   : '',
            prioridad:   selectPrioridad ? selectPrioridad.value    : 'medium',
            columna:     selectColumna   ? selectColumna.value      : 'todo'
        };

        // Guardamos en localStorage
        const tareas = JSON.parse(localStorage.getItem('tareas')) || [];
        tareas.push(nuevaTarea);
        localStorage.setItem('tareas', JSON.stringify(tareas));

        // Pintamos la tarjeta
        renderTarjeta(nuevaTarea, false);

        cerrarModal();
    }

    // =============================
    // CONTROL DEL MODAL
    // =============================
    function abrirModal() {
        if (modalTarea) modalTarea.classList.remove('modal-hidden');
    }

    function cerrarModal() {
        if (modalTarea) modalTarea.classList.add('modal-hidden');
        if (formNuevaTarea) formNuevaTarea.reset();
    }

    // =============================
    // EVENTOS
    // =============================
    btnAbrirModal?.addEventListener('click',  abrirModal);
    btnCerrarModal?.addEventListener('click', cerrarModal);
    btnCancelar?.addEventListener('click',    cerrarModal);
    formNuevaTarea?.addEventListener('submit', crearTarea);

    modalTarea?.addEventListener('click', (e) => {
        if (e.target === modalTarea) cerrarModal();
    });

    // =============================
    // INIT
    // =============================
    cargarTareas();
});
