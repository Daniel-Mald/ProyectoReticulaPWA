const btnIngresar = document.getElementById("btnIngresar");
const nombretxt = document.getElementById("numControltxt");
const passwordtxt = document.getElementById("passwordtxt");
const erroresLbl = document.querySelector(".form__errores");
const loading = document.getElementById("loader");

const perfilChannel = new BroadcastChannel("Perfil_Channel");
const reticulaChannel = new BroadcastChannel("Reticula_Channel");
const usuarioChannel = new BroadcastChannel("USUARIO_CHANNEL");

function validarUsuario({ numeroControl, password }) {
    const errores = [];

    if (numeroControl === "") {
        errores.push("El número de control no puede estar vacío.");
    }
    if (password === "") {
        errores.push("La contraseña no puede estar vacía.");
    }

    return errores;
}

async function ingresar(event) {
    try {
        erroresLbl.innerHTML = "";

        loading.style.display = "block";

        const numeroControl = nombretxt.value.toUpperCase();
        const password = passwordtxt.value;

        const errores = validarUsuario({
            numeroControl: numeroControl,
            password: password,
        });

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

        const response = await fetch("/api/Reticula/Login3", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
                
            },
            body: JSON.stringify({
                numControl: numeroControl,
                password: password
            })
        });

        if (response.ok) {
            //const data = await response.json();

            const credenciales = {
                numControl: numeroControl,
                password: password,
            };


            //data.informacionGeneral.numeroControl = numeroControl;
            //Se hacen los fetch de los distintos elementos
            //semestres
            const responseSemestres = await fetch("/api/Reticula/Reticula", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"

                },
                body: JSON.stringify({
                    numControl: numeroControl,
                    password: password
                })
            });
            //perfil
            const responseInformacionGeneral = await fetch("/api/Reticula/InformacionGeneral", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"

                },
                body: JSON.stringify({
                    numControl: numeroControl,
                    password: password
                })
            });

            let dataInfoGeneral = await responseInformacionGeneral.json()
            let dataSemestres = await responseSemestres.json();


            perfilChannel.postMessage(dataInfoGeneral);

            localStorage.setItem("semestres", JSON.stringify(dataSemestres));
            localStorage.setItem("perfil", JSON.stringify(dataInfoGeneral));
            localStorage.setItem("credenciales", JSON.stringify(credenciales));

            usuarioChannel.postMessage({
                operacion: "AGREGAR",
                credencial: credenciales,
            });

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
