const btnIngresar = document.getElementById("btnIngresar");
const numerotxt = document.getElementById("numControltxt");
const passwordtxt = document.getElementById("passwordtxt");
const erroresLbl = document.querySelector(".form__errores");
const loading = document.getElementById("loader");
const form = document.querySelector(".login__form");

const perfilChannel = new BroadcastChannel("Perfil_Channel");
const reticulaChannel = new BroadcastChannel("Reticula_Channel");
const usuarioChannel = new BroadcastChannel("USUARIO_CHANNEL");

function validarUsuario(usuario) {
    const errores = [];

    if (usuario.numControl === "") {
        numerotxt.classList.add("input-error");
        errores.push("El número de control no puede estar vacío.");
    }
    if (usuario.password === "") {
        passwordtxt.classList.add("input-error");
        errores.push("La contraseña no puede estar vacía.");
    }

    if (errores.length > 0) {

        let erroresAcumulados = "";

        errores.forEach((error) => {
            erroresAcumulados += `${error}</br>`;
        });

        erroresLbl.innerHTML = erroresAcumulados;
        return false;
    }

    if (!navigator.onLine) {
        erroresLbl.textContent = "No tienes conexión a internet";
        return false;
    }


    return true;
}


const limpiarErrores = () => {

    erroresLbl.innerHTML = "";
    loading.style.display = "none";
}

const mostrarErroresServidor = (error) => {
    erroresLbl.textContent = error;
    loading.style.display = "none";
}


const guardarPerfilLocalStorage = (perfil) => {

    localStorage.setItem("perfil", JSON.stringify({
        nombreDelAlumno: perfil.nombreDelAlumno,
        numeroControl: perfil.numeroControl,
        carrera: perfil.carrera,
        especialidad: perfil.especialidad
    }));

}


const eliminarClaseInput = (event) => {

    let input = event.target;
    input.classList.remove("input-error");

    limpiarErrores();
}


async function ingresar(event) {
    try {

        event.preventDefault();
        btnIngresar.disable = true;

        limpiarErrores();

        loading.style.display = "block";

        const numControl = numerotxt.value.toUpperCase();
        const password = passwordtxt.value;

        const credenciales = {
            numControl,
            password,
        };


        if (!validarUsuario(credenciales)) {
            loading.style.display = "none";
            return;
        };


        const response = await fetch("/api/Reticula/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"

            },
            body: JSON.stringify(credenciales)
        });


        if (response.status === 404) {
            mostrarErroresServidor("Número de control o contraseña incorrectos.");
            return;
        }

        if (!response.ok) {
            mostrarErroresServidor("Problemas con el servidor, Por favor inténtelo mas tarde.");
            return;
        }

        const requestPerfil = await fetch("api/reticula/perfil");
        const requestReticula = await fetch("api/reticula/reticula");

        const perfil = await requestPerfil.json();

        guardarPerfilLocalStorage(perfil);

        loading.style.display = "none";
        window.location.replace("/");

        btnIngresar.disable = false;


    } catch (error) {
        erroresLbl.textContent = "Problemas con el servidor, Por favor inténtelo mas tarde.";
        loading.style.display = "none";
        btnIngresar.disable = false;

    }
}


btnIngresar.addEventListener("click", ingresar);
form.addEventListener("input", eliminarClaseInput);



