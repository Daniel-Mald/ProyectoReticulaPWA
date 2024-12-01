const listaHorario = document.querySelector(".horario");
const plantillaColumnaHoraio =
    document.getElementById("plantilla-horario").content;
const plantillaMateria = document.getElementById(
    "plantilla-horario-materia"
).content;

const diaMap = new Map([
    ["lunes", "Lunes"],
    ["martes", "Martes"],
    ["miercoles", "Miércoles"],
    ["jueves", "Jueves"],
    ["viernes", "Viernes"],
    ["sabado", "Sabado"],
]);
const cargarHorario = async () => {
    try {
        const request = await fetch("/api/reticula/horario");

        if (!request.ok) throw new Error("No se pudo obtener el horario");

        const horario = await request.json();

        console.log(horario);

        for (const propiedad in horario) {
            const columna = plantillaColumnaHoraio.firstElementChild.cloneNode(true);
            columna.querySelector(".horario-dia").textContent =
                diaMap.get(propiedad) || "Error";

            const materias = horario[propiedad];

            materias.forEach((materia) => {

                const nuevaMateria = plantillaMateria.firstElementChild.cloneNode(true);


                nuevaMateria.querySelector(".horario-materia__nombre").textContent = materia.nombre;
                nuevaMateria.querySelector(".horario-materia__docente").textContent = `Docente: ${materia.docente}`;
                nuevaMateria.querySelector(".horario-materia__hora").textContent = materia.hora;
                nuevaMateria.querySelector(".horario-materia__salon").textContent = `Salon: ${materia.salon}`;

                columna.appendChild(nuevaMateria);

            });

            listaHorario.appendChild(columna);
        }
    } catch (error) {
        console.error(error);
    }
};

window.addEventListener("DOMContentLoaded", cargarHorario);
