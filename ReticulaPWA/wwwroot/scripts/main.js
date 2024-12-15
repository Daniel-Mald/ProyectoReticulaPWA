const btnOpciones = document.querySelector(".header__opciones-icono");
const menuFlotante = document.querySelector(".menu-flotante");
const btnReticulaNav = document.getElementById("link-reticula");
const btnHorarioNav = document.getElementById("link-horario");
const btnPerfilNav = document.getElementById("link-perfil");
const btnDescargarPdf = document.querySelector(".menu-flotante__pdf");
const btnDescargarHorario = document.querySelector(".menu-flotante__horario");

const btnCerrarSesion = document.querySelector(".menu-flotante__logout");
const btnCancelarCerrarSesion = document.getElementById("btnCancelar");
const btnAceptarCerrarSesion = document.getElementById("btnAceptar");
const modalCerrarSesion = document.querySelector(".modal");

const usuarioChannel = new BroadcastChannel("USUARIO_CHANNEL");
function toogleClase(event, claseRemover) {
    event.classList.toggle(claseRemover);
}
function ocultarMenuFlotante(event) {
    if (
        !menuFlotante.contains(event.target) &&
        !btnOpciones.contains(event.target)
    ) {
        menuFlotante.classList.remove("menu-flotante--activo");
    }
}
function monstrarMenuFlotante() {
    toogleClase(menuFlotante, "menu-flotante--activo");
}

function navegarReticula(e) {
    window.location.replace("/");
}

function navegarPerfil() {
    window.location.replace("/perfil");
}
function navegarLogin() {

    localStorage.removeItem("perfil");
    localStorage.clear();

    usuarioChannel.postMessage({ operacion: "ELIMINAR", credencial: null });

    sessionStorage.clear();

    window.location.replace("/login");
}
function cancelarCerrarSesion() {
    modalCerrarSesion.classList.remove("modal__cerrar-sesion--activo");
}

function mostrarModalCerrarSesion() {
    toogleClase(modalCerrarSesion, "modal__cerrar-sesion--activo");
    toogleClase(menuFlotante, "menu-flotante--activo");
}

function redirigirLogin() {

    if (location.href.includes("login")) {
        return;
    }
    else if (location.href.includes("perfil")) {
        btnPerfilNav.classList.add("item-activo");
        btnReticulaNav.classList.remove("item-activo");
        btnHorarioNav.classList.remove("item-activo");


    }
    else if (location.href.includes("horario")) {
        btnHorarioNav.classList.add("item-activo");
        btnReticulaNav.classList.remove("item-activo");
        btnPerfilNav.classList.remove("item-activo");

    }
    else {
        btnReticulaNav.classList.add("item-activo");
        btnPerfilNav.classList.remove("item-activo");
        btnHorarioNav.classList.remove("item-activo");
    }
}

function navegarPdf() {
    setTimeout(() => {
        const reticulaPDF = JSON.parse(localStorage.getItem("reticulaPDF"));

        if (!reticulaPDF) return;

        const opciones = {
            filename: "Reticula.pdf",
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 3 },
            jsPDF: { format: "a4", orientation: "landscape" },
        };

        html2pdf().set(opciones).from(reticulaPDF).save();
    }, 0);
}



function navegarHorario() {
    window.location.replace("/horario");
}

function descargarHorario() {
    setTimeout(() => {
        const horarioPdf = localStorage.getItem("horario");

        if (!horarioPdf) return;

        const opciones = {
            filename: "Horario.pdf",
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 3 },
            jsPDF: { format: "a4", orientation: "landscape" },
        };

        html2pdf().set(opciones).from(horarioPdf).save();
    }, 0);
}




btnDescargarHorario.addEventListener("click", descargarHorario);
btnDescargarPdf.addEventListener("click", navegarPdf);
window.addEventListener("DOMContentLoaded", redirigirLogin);
btnAceptarCerrarSesion.addEventListener("click", navegarLogin);
btnHorarioNav.addEventListener("click", navegarHorario);
btnCerrarSesion.addEventListener("click", mostrarModalCerrarSesion);
btnCancelarCerrarSesion.addEventListener("click", cancelarCerrarSesion);
btnReticulaNav.addEventListener("click", navegarReticula);
btnPerfilNav.addEventListener("click", navegarPerfil);
btnOpciones.addEventListener("click", monstrarMenuFlotante);
document.addEventListener("click", ocultarMenuFlotante);
