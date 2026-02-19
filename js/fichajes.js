document.addEventListener("DOMContentLoaded", () => {

    const fichajes = JSON.parse(localStorage.getItem("workDays")) || [];
    const fichajesTbody = document.getElementById("fichajes-tbody");

    if (!fichajesTbody) {
        console.warn("No existe fichajes-tbody");
        return;
    }

    fichajesTbody.innerHTML = "";

    /* ===============================
       Utils
    =============================== */

    function secondsToHMS(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return `${hours.toString().padStart(2, "0")}:${minutes
            .toString().padStart(2, "0")}:${seconds
            .toString().padStart(2, "0")}`;
    }

    /* ===============================
       Agrupar fichajes por día
    =============================== */

    const fichajesPorDia = {};

    fichajes.forEach(f => {

        // YYYY-MM-DD
        const fecha = f.date.split("T")[0];

        if (!fichajesPorDia[fecha]) {
            fichajesPorDia[fecha] = {
                startTime: f.startTime,
                endTime: f.endTime,
                totalSeconds: f.totalSeconds || 0,
                pausedTime: f.pausedTime || 0
            };
        } else {
            fichajesPorDia[fecha].totalSeconds += f.totalSeconds || 0;
            fichajesPorDia[fecha].pausedTime += f.pausedTime || 0;

            if (f.startTime < fichajesPorDia[fecha].startTime) {
                fichajesPorDia[fecha].startTime = f.startTime;
            }
            if (f.endTime > fichajesPorDia[fecha].endTime) {
                fichajesPorDia[fecha].endTime = f.endTime;
            }
        }
    });

    /* ===============================
       Pintar tabla
    =============================== */

    Object.entries(fichajesPorDia).forEach(([date, data]) => {

        const totalHoras = secondsToHMS(data.totalSeconds);
        const pausas = secondsToHMS(data.pausedTime);

        let estado = "Incidencia";
        let estadoClase = "status-issue";

        if (data.totalSeconds >= 7 * 3600) {
            estado = "Completado";
            estadoClase = "status-completed";
        } 
        if (data.totalSeconds === 0) {
            estado = "Ausencia";
            estadoClase = "status-off";
        }

        const row = document.createElement("tr");

        if (estado === "Ausencia") {
            row.innerHTML = `
                <td>${date}</td>
                <td colspan="3" class="text-center">Vacaciones</td>
                <td>${totalHoras}</td>
                <td><span class="status-badge ${estadoClase}">${estado}</span></td>
            `;
        } else {
            row.innerHTML = `
                <td>${date}</td>
                <td>${data.startTime}</td>
                <td>${data.endTime}</td>
                <td>${pausas}</td>
                <td>${totalHoras}</td>
                <td><span class="status-badge ${estadoClase}">${estado}</span></td>
            `;
        }

        fichajesTbody.appendChild(row);
    });

});
