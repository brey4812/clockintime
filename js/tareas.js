//cogemos todos los elementos necesarios ( boton, contenedor oculto y sus inputs del contenedor oculto)
const botonNuevaTarea = document.getElementById("btn-open-task-modal");
const contenedorDeNuevaTarea = document.getElementById("task-modal");
const inputTitulo = document.getElementById("task-title");
const inputDescripcion = document.getElementById("task-desc");
const inputPrioridad = document.getElementById("task-priority");
const inputEstado = document.getElementById("task-column");
const btnGuardarTarea = document.getElementById("btn-submit-task");
const btnCloseIcon = document.getElementById("btn-close-task-modal");

btnCloseIcon.addEventListener("click", cerrarModal);



//cuando carga la página que ocurre
document.addEventListener("DOMContentLoaded", () => {
    //cargamos las tareas guardadas en el localStorage y las mostramos (la clave del localStorage es "tareas")
    const tareasGuardadas = JSON.parse(localStorage.getItem("tareas")) || [];
    tareasGuardadas.forEach(tarea => {
        agregarTareaAlDOM(tarea);
    });
    //ocultamos el contenedor de nueva tarea verificando que la clase sea modal-overlay modal-hidden
    contenedorDeNuevaTarea.classList.add("modal-hidden");
});

//eventos
//cuando se hace click en el boton de nueva tarea, se muestra el contenedor de nueva tarea
botonNuevaTarea.addEventListener("click", () => {
    contenedorDeNuevaTarea.classList.remove("modal-hidden");
});

//cuando se hace click en el boton de guardar tarea, se crea un objeto tarea con los valores de los inputs, se guarda en el localStorage y se muestra en el DOM
btnGuardarTarea.addEventListener("click", () => {
    const nuevaTarea = {
        id: Date.now(),
        titulo: inputTitulo.value,
        descripcion: inputDescripcion.value,
        prioridad: inputPrioridad.value,
        estado: inputEstado.value
    };
    //validamos que el titulo no esté vacío o repetido dentro de el localStorage de tareas
    if (nuevaTarea.titulo.trim() === "") {
        alert("El título de la tarea no puede estar vacío.");
        return;
    };
    const tareasGuardadas = JSON.parse(localStorage.getItem("tareas")) || [];
    if (tareasGuardadas.some(tarea => tarea.titulo === nuevaTarea.titulo)) {
        alert("Ya existe una tarea con ese título. Por favor, elige otro título.");
        return;
    };
    //si la validación es correcta, se guarda la tarea en el localStorage y se muestra en el DOM
    tareasGuardadas.push(nuevaTarea);
    localStorage.setItem("tareas", JSON.stringify(tareasGuardadas));
    agregarTareaAlDOM(nuevaTarea);
    //se oculta el contenedor de nueva tarea y se reinician los inputs
    cerrarModal();
});

//editar tarea
//coge toda la informacion de la tarea a editar y la muestra en el contenedor de nueva tarea,
//cuando se hace click en el boton de guardar tarea, se actualiza la tarea en el localStorage y se muestra en el DOM y si le da a cancelar se oculta el contenedor de nueva tarea y se reinician los inputs
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("edit-btn")) {
        const card = e.target.closest(".task-card");
        const tareaId = parseInt(card.getAttribute("data-id"));
        const tareasGuardadas = JSON.parse(localStorage.getItem("tareas")) || [];
        const tareaAEditar = tareasGuardadas.find(tarea => tarea.id === tareaId);
        if (tareaAEditar) {
            inputTitulo.value = tareaAEditar.titulo;
            inputDescripcion.value = tareaAEditar.descripcion;
            inputPrioridad.value = tareaAEditar.prioridad;
            inputEstado.value = tareaAEditar.estado;
            contenedorDeNuevaTarea.classList.remove("modal-hidden");
            btnGuardarTarea.onclick = () => {
                tareaAEditar.titulo = inputTitulo.value;
                tareaAEditar.descripcion = inputDescripcion.value;
                tareaAEditar.prioridad = inputPrioridad.value;
                tareaAEditar.estado = inputEstado.value;
                localStorage.setItem("tareas", JSON.stringify(tareasGuardadas));
                //actualizamos el DOM eliminando la tarea antigua y agregando la tarea editada
                card.remove();
                agregarTareaAlDOM(tareaAEditar);
                cerrarModal();
            };
            btnCerrarModal.onclick = () => {
                cerrarModal();
            };
        };
    } else if (e.target.classList.contains("delete-btn")) {
        const card = e.target.closest(".task-card");
        const tareaId = parseInt(card.getAttribute("data-id"));
        eliminarTarea(tareaId);
    };
});

//eliminar tarea
function eliminarTarea(tareaId) {
    const tareasGuardadas = JSON.parse(localStorage.getItem("tareas")) || [];
    const tareasActualizadas = tareasGuardadas.filter(tarea => tarea.id !== tareaId);
    localStorage.setItem("tareas", JSON.stringify(tareasActualizadas));
    const card = document.querySelector(`.task-card[data-id="${tareaId}"]`);
    if (card) {
        card.remove();
    };
};
    
//funcion para oculta el contenedor de nueva tarea y se reinician los inputs
function cerrarModal() {
    contenedorDeNuevaTarea.classList.add("modal-hidden");
    inputTitulo.value = "";
    inputDescripcion.value = "";
    inputEstado.value = "Pendiente";
    inputPrioridad.value = "media";
};

//funcion para agregar una tarea al DOM, recibe un objeto tarea como parametro
function agregarTareaAlDOM(tarea) {

    // Crear tarjeta
    const card = document.createElement("div");
    card.classList.add("task-card");
    card.setAttribute("data-id", tarea.id);

    // Badge dinámico de prioridad
    let clasePrioridad = "";
    let textoPrioridad = "";

    if (tarea.prioridad === "high") {
        clasePrioridad = "priority-high";
        textoPrioridad = "Alta";
    } else if (tarea.prioridad === "medium") {
        clasePrioridad = "priority-medium";
        textoPrioridad = "Media";
    } else {
        clasePrioridad = "priority-low";
        textoPrioridad = "Baja";
    }

    // Contenido interno
card.classList.add("kanban-card");

card.innerHTML = `
    <h3>${tarea.titulo}</h3>
    <p>${tarea.descripcion || ""}</p>
    <span class="badge-priority ${clasePrioridad}">
        ${textoPrioridad}
    </span>

    <div style="display:flex; gap:8px; margin-top:10px;">
        <button class="edit-btn" 
            style="background:#28a745;color:white;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;">
            Editar
        </button>

        <button class="delete-btn" 
            style="background:#dc3545;color:white;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;">
            Eliminar
        </button>
    </div>
`;


    // 🔥 AQUÍ ESTABA EL ERROR → ahora coincide con tu HTML
    const contenedor = document.getElementById(`kanban-content-${tarea.estado}`);

    if (!contenedor) {
        console.error("No se encontró el contenedor:", tarea.estado);
        return;
    }

    contenedor.appendChild(card);
}

