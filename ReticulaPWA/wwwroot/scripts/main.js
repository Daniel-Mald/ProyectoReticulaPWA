//const menu = document.querySelector(".nav__list");
const btnOpciones = document.querySelector(".header__figure");
const menuFlotante = document.querySelector(".menu-flotante");
const btnReticulaNav = document.getElementById("link-reticula");
const btnPerfilNav = document.getElementById("link-perfil");

const btnCerrarSesion = document.querySelector(".menu-flotante__logout");
const btnCancelarCerrarSesion = document.getElementById("btnCancelar");
const btnAceptarCerrarSesion = document.getElementById("btnAceptar");
const modalCerrarSesion = document.querySelector(".modal");

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
  window.location.href = "/";
}

function navegarPerfil() {
  window.location.href = "/perfil";
}

function cancelarCerrarSesion() {
  modalCerrarSesion.classList.remove("modal__cerrar-sesion--activo");
}

function mostrarModalCerrarSesion() {
  toogleClase(modalCerrarSesion, "modal__cerrar-sesion--activo");
  toogleClase(menuFlotante, "menu-flotante--activo");
}

window.addEventListener("DOMContentLoaded", () => {
  if (location.href.includes("login")) {
    return;
  } else if (location.href.includes("perfil")) {
    btnPerfilNav.classList.add("item-activo");
    btnReticulaNav.classList.remove("item-activo");
  } else {
    btnReticulaNav.classList.add("item-activo");
    btnPerfilNav.classList.remove("item-activo");
  }
});

function navegarLogin() {
  window.location.href = "/login";
}

btnAceptarCerrarSesion.addEventListener("click", navegarLogin);
btnCerrarSesion.addEventListener("click", mostrarModalCerrarSesion);
btnCancelarCerrarSesion.addEventListener("click", cancelarCerrarSesion);
btnReticulaNav.addEventListener("click", navegarReticula);
btnPerfilNav.addEventListener("click", navegarPerfil);
btnOpciones.addEventListener("click", monstrarMenuFlotante);
document.addEventListener("click", ocultarMenuFlotante);



if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/serviceworker.js');
}
let plantilla = document.querySelector("template");
let listview = document.querySelector(".listview");
async function descargarInfo() {
    let resp = await fetch("https://sie.itesrc.net/api/alumno/datosgenerales?control=201G0266&password=ESCOLARES", { mode: "no-cors" });
    if (resp.ok) {
        let datos = await resp.json();
        //for (let x = 0; x < 800; x++) {
        //    let clone = plantilla.content.firstElementChild.cloneNode(true);
        //    clone.children[0].src = datos[x].icono;
        //    clone.children[1].textContent = datos[x].numero;
        //    clone.children[2].textContent = datos[x].nombre;
        //    listview.append(clone);

        //}
        console.log(datos);
    }
}
descargarInfo();
