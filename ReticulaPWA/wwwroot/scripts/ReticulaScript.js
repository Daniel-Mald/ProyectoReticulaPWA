const plantillaColumna = document.querySelector(".plantilla-columna");
const plantillaMateria = document.querySelector(".plantilla-materia");
const plantillaOportunidad = document.querySelector(
    ".platilla-oportunidad"
);

const tabla = document.getElementById("tabla-materias");


function crearMaterias(semestresFetch) {

    const fragmento = document.createDocumentFragment();
    const fragmentoMateria = document.createDocumentFragment();


    tabla.innerHTML = "";
    let i = 0;
    for (let semestre of semestresFetch) {

        const columna = plantillaColumna.content.cloneNode(true);
        const titulo = columna.querySelector(".tabla__columna__titulo");
        let tablaColumna = columna.querySelector(".tabla__columna");
        titulo.textContent = semestre.numero;
        i++;

        for (let materias of semestre.materias) {
            let materia = plantillaMateria.content.cloneNode(true);
            let estado = materia.querySelector(".tabla__materia");
            let titulo = materia.querySelector(".tabla__materia__titulo");
            let clave = materia.querySelector(".tabla__materia__clave");
            estado.classList.remove("materia-acreditada");

            titulo.textContent = materias.nombre;
            let estado1 = materias.estado;
            if (estado1 == "Acreditada") {
                estado.classList.add("materia-acreditada");
                if (materias.oportunidad > 1) {
                    let oport = plantillaOportunidad.content.cloneNode(true);
                    let oportunid = oport.querySelector(".oportunidad");

                    oportunid.textContent = materias.oportunidad;

                    estado.appendChild(oport);
                }

            } else if (estado1 == "No acreditada") {
                estado.classList.add("materia-no-acreditada");
            } else if (estado1 == "Cursando") {
                estado.classList.add("materia-cursando");
            } else {
                estado.classList.add("materia-sin-cursar");
            }

            clave.textContent = materias.clave;
            tablaColumna.appendChild(materia);


        }
        // columna.appendChild(fragmentoMateria);
        fragmento.appendChild(columna);

    }

    tabla.appendChild(fragmento);

    oportunidadesEvento();

}

function mostrarOportunidades(event) {
    event.target.classList.toggle("oportunidad-active");
}

function ocultarOportunidades(event) {
    event.target.classList.remove("oportunidad-active");
}


function oportunidadesEvento() {

    const span = document.querySelectorAll(".oportunidad");

    span.forEach((oportunidad) => {
        oportunidad.addEventListener("click", mostrarOportunidades);
        oportunidad.addEventListener("mouseleave", ocultarOportunidades);
    });

}

const plantillaInfo = ({ nombre, numControl, carrera, especialidad }) => {

    return `
 <h2>INSTITUTO TECNOLÓGICO DE ESTUDIOS SUPERIORES DE LA REGIÓN CARBONÍFERA</h2>
<div class="infoAlumnoPdf">
<label>Nombre: ${nombre}</label>
<label>No. Control: ${numControl}</label>
<label>Carrera: ${carrera}</label>
<label>Especialidad: ${especialidad}</label>
</div>

`
}


let reticulaClon;

function guardarTablaLocalStorage() {

    reticulaClon = document.createElement("div");
    reticulaClon.classList.add("pdf-Alumno");

    const perfil = JSON.parse(localStorage.getItem("perfil"));
    const credenciales = JSON.parse(localStorage.getItem("credenciales"));

    const info = plantillaInfo({
        nombre: perfil.nombreDelAlumno,
        numControl: credenciales.numeroControl,
        carrera: perfil.carrera,
        especialidad: perfil.especialidad || "No especialidad"
    });

    reticulaClon.innerHTML = info;

    reticula = document.querySelector("#tabla-materias").cloneNode(true);

    reticula.classList.add("reticula-pdf");

    Array.from(reticula.querySelectorAll(".tabla__materia")).forEach((materia) => {

        materia.classList.add("tabla__materiaPDF");

        const oportunidad = materia.querySelector(".oportunidad");
        if (oportunidad) {
            oportunidad.classList.add("oportunidadPDF");
        }
    });

    reticulaClon.appendChild(reticula);
}


const mapeoPerfil2 = () => {
    //crearColumnas(9);

    const semestres = JSON.parse(localStorage.getItem("semestres"));
    crearMaterias(semestres);
    if (!semestres) return;
    guardarTablaLocalStorage();
}

window.addEventListener("DOMContentLoaded", mapeoPerfil2);


