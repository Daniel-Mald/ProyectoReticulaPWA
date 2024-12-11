const btnIngresar = document.getElementById("btnIngresar");
const nombretxt = document.getElementById("numControltxt");
const passwordtxt = document.getElementById("passwordtxt");
const erroresLbl = document.querySelector(".form__errores");
const loading = document.getElementById("loader");

const perfilChannel = new BroadcastChannel("Perfil_Channel");
const reticulaChannel = new BroadcastChannel("Reticula_Channel");
const usuarioChannel = new BroadcastChannel("USUARIO_CHANNEL");

function validarUsuario(usuario) {
    const errores = [];

    if (usuario.numControl === "") {
        errores.push("El número de control no puede estar vacío.");
    }
    if (usuario.password === "") {
        errores.push("La contraseña no puede estar vacía.");
    }

    return errores;
}

async function ingresar(event) {
    try {
        erroresLbl.innerHTML = "";

        loading.style.display = "block";

        const numControl = nombretxt.value.toUpperCase();
        const password = passwordtxt.value;

        const credenciales = {
            numControl,
            password,
        };

        const errores = validarUsuario(credenciales);

        if (errores.length > 0) {
            let erroresAcumulados = "";

            errores.forEach((error) => {
                erroresAcumulados += `${error}</br>`;
            });

            erroresLbl.innerHTML = erroresAcumulados;

            loading.style.display = "none";
            return;
        }

        if (!navigator.onLine) {
            erroresLbl.textContent = "No tienes conexión a internet";
            loading.style.display = "none";
            return;
        }
        const response = await fetch("/api/Reticula/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
                
            },
            body: JSON.stringify(credenciales)
        });

        if (response.ok) {

            const requestPerfil = await fetch("api/reticula/perfil");

            if (!requestPerfil.ok)
                return console.error("Error al obtener perfil");

            const perfil = await requestPerfil.json();

            localStorage.setItem("perfil", JSON.stringify(perfil));

            window.location.replace("/");

        } else if (response.status >= 500) {
            erroresLbl.textContent =
                "Problemas con el servidor, Por favor inténtelo mas tarde.";
        } else {
            erroresLbl.textContent =
                "El número de control o la contraseña son incorrectas";
        }

        loading.style.display = "none";
    } catch (error) {
        erroresLbl.textContent =
            "Problemas con el servidor, Por favor inténtelo mas tarde.";
        loading.style.display = "none";
        console.error(error);
    }
}

btnIngresar.addEventListener("click", ingresar);
