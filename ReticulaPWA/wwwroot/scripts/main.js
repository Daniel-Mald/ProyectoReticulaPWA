const btnOpciones = document.querySelector(".header__figure");
const menuFlotante = document.querySelector(".menu-flotante");
const btnReticulaNav = document.getElementById("link-reticula");
const btnPerfilNav = document.getElementById("link-perfil");

const btnCerrarSesion = document.querySelector(".menu-flotante__logout");
const btnCancelarCerrarSesion = document.getElementById("btnCancelar");
const btnAceptarCerrarSesion = document.getElementById("btnAceptar");
const modalCerrarSesion = document.querySelector(".modal");

function logout() {
    // Limpiar almacenamiento
    localStorage.clear();
    sessionStorage.clear();

    // Eliminar cachés de Service Workers
    if ('caches' in window) {
        caches.keys().then((names) => {
            names.forEach((name) => caches.delete(name));
        });
    }
    // Recargar sin caché
    window.location.reload(true);

    // Redirigir sin caché
    //window.location.href = '/login?timestamp=' + new Date().getTime();
}
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
function navegarLogin() {
  window.location.href = "/login";
  localStorage.removeItem("perfil");
    localStorage.removeItem("credenciales");
    logout();
}
function cancelarCerrarSesion() {
  modalCerrarSesion.classList.remove("modal__cerrar-sesion--activo");
}

function mostrarModalCerrarSesion() {
  toogleClase(modalCerrarSesion, "modal__cerrar-sesion--activo");
    toogleClase(menuFlotante, "menu-flotante--activo");
    //logout();
}

function redirigirLogin() {
  if (location.href.includes("login")) {
    return;
  } else if (location.href.includes("perfil")) {
    btnPerfilNav.classList.add("item-activo");
    btnReticulaNav.classList.remove("item-activo");
  } else {
    btnReticulaNav.classList.add("item-activo");
    btnPerfilNav.classList.remove("item-activo");
  }
}

window.addEventListener("DOMContentLoaded", redirigirLogin);
btnAceptarCerrarSesion.addEventListener("click", navegarLogin);
btnCerrarSesion.addEventListener("click", mostrarModalCerrarSesion);
btnCancelarCerrarSesion.addEventListener("click", cancelarCerrarSesion);
btnReticulaNav.addEventListener("click", navegarReticula);
btnPerfilNav.addEventListener("click", navegarPerfil);
btnOpciones.addEventListener("click", monstrarMenuFlotante);
document.addEventListener("click", ocultarMenuFlotante);
