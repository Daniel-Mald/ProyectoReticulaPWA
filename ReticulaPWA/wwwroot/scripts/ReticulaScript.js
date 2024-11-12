const plantillaColumna = document.querySelector(".plantilla-columna");
const plantillaMateria = document.querySelector(".plantilla-materia");
const plantillaOportunidad = document.querySelector(".platilla-oportunidad");
const plantillaPDF = document.querySelector("#plantilla-pdf");

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



function guardarTablaLocalStorage() {

    const clon = plantillaPDF.content.firstElementChild.cloneNode(true);

    const perfil = JSON.parse(localStorage.getItem("perfil"));

    clon.querySelector(".pdf__nombre").innerHTML = `<b>Nombre:</b> ${perfil.nombreDelAlumno}`;
    clon.querySelector(".pdf__numControl").innerHTML = `<b>Número de control:</b> ${perfil.numeroControl}`;
    clon.querySelector(".pdf__carrera").innerHTML = `<b>Carrera:</b> ${perfil.carrera}`;
    clon.querySelector(".pdf__especialidad").innerHTML = `<b>Especialidad:</b> ${perfil.especialidad}`;
    clon.querySelector(".pdf__especialidad").style.display = (perfil.especialidad) ? "block" : "none";


    reticula = document.querySelector("#tabla-materias").cloneNode(true);
    reticula.classList.add("reticula-pdf");

    Array.from(reticula.querySelectorAll(".tabla__materia")).forEach((materia) => {
        materia.classList.replace("tabla__materia", "tabla__materiaPDF");
        const oportunidad = materia.querySelector(".oportunidad");
        if (oportunidad) {
            oportunidad.classList.add("oportunidadPDF");
        }
    });

    clon.appendChild(reticula);

    localStorage.setItem("reticulaPDF", JSON.stringify(clon.outerHTML));
}


const mapeoPerfil2 = () => {
    //crearColumnas(9);
    const semestres = JSON.parse(localStorage.getItem("semestres"));
    crearMaterias(semestres);
    if (!semestres) return;
    guardarTablaLocalStorage();
};

window.addEventListener("DOMContentLoaded", mapeoPerfil2);