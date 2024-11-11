const plantilla = document.getElementById("plantilla__informacion");
const nombreLbl = document.getElementById("perfil__nombre");
const numControlLbl = document.getElementById("perfil__numControl");
const fotoPerfil = document.getElementById("perfil__fotografia");





const mapeoPerfil2 = () => {
    const perfilDto = JSON.parse(localStorage.getItem("perfil"));

    if (!perfilDto) return;

    nombreLbl.textContent = perfilDto.nombreDelAlumno || "ERROR";

    const numeroControl =
        JSON.parse(localStorage.getItem("credenciales")).numeroControl || "ERROR";

    numControlLbl.textContent = numeroControl;

    const año = numeroControl.substring(0, 2);
    fotoPerfil.src = `https://intertec.tec-carbonifera.edu.mx/fotos/al/${año}/${numeroControl}.jpg`;

    document.getElementById("perfil__carrera").textContent = perfilDto.carrera;
    document.getElementById("perfil__planEstudios").textContent =
        perfilDto.planDeEstudios;
    document.getElementById("perfil__especialidad").textContent =
        perfilDto.especialidad;
    document.getElementById("perfil__creditos").textContent =
        perfilDto.creditosTotales;
    document.getElementById("perfil__vigencia").textContent = perfilDto.vigencia;
    document.getElementById("perfil__vigencia").textContent = perfilDto.vigencia;
    document.getElementById("perfil__periodoActual").textContent =
        perfilDto.periodoActualUltimo;
    document.getElementById("perfil__numConvalidados").textContent =
        perfilDto.periodosConvalidos;
};

window.addEventListener("DOMContentLoaded", mapeoPerfil2);