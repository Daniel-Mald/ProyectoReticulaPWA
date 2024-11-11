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

    console.log(span);

    span.forEach((oportunidad) => {
        oportunidad.addEventListener("click", mostrarOportunidades);
        oportunidad.addEventListener("mouseleave", ocultarOportunidades);
    });

}



const mapeoPerfil2 = () => {
    //crearColumnas(9);

    const semestres = JSON.parse(localStorage.getItem("semestres"));
    crearMaterias(semestres);
    if (!semestres) return;
}

window.addEventListener("DOMContentLoaded", mapeoPerfil2);


