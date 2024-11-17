const versionCache = "3";
const versionBD = 3;
const CACHE_NAME = `cacheV${versionCache}`;
const DB_NAME = "reticulaDB";
const TABLA_CREDENCIALES = "credenciales";

let isAutenticado = true;
const usuarioChannel = new BroadcastChannel("USUARIO_CHANNEL");


const urls = [
    "/css/estilos.css",
    "/assets/logos/icon.png",
    "/assets/logos/Logo144x144.png",
    "/assets/logos/Logo192x192.png",
    "/assets/logos/Logo512x512.png",
    "/assets/img/logo1.jpg",
    "/assets/img/logo2.png",
    "/assets/img/logo-png.png",
    "/assets/img/foto.jpg",
    "/assets/iconos/acreditada.png",
    "/assets/iconos/card-info.png",
    "/assets/iconos/cursando.png",
    "/assets/iconos/opciones.svg",
    "/assets/iconos/reticula.svg",
    "/assets/iconos/horario.png",
    "/assets/iconos/no-acreditada.png",
    "/assets/iconos/download.svg",
    "/assets/iconos/user.svg",
    "/assets/iconos/logout.svg",
    "/scripts/main.js",
    "/scripts/html2Pdf.js",
    "/scripts/perfil.js",
    "/scripts/ReticulaScript.js",
    "/login",
    "/",
    "/perfil",
];

async function precache() {
    const cache = await caches.open(CACHE_NAME);
    return cache.addAll(urls);
}

async function cacheFirst(req) {
    try {
        let cache = await caches.open(CACHE_NAME);
        let response = await cache.match(req);

        if (response) return response;

        let respuestaNetwork = await fetch(req, { mode: 'cors', credentials: 'omit' });

        if (respuestaNetwork.ok) {
            cache.put(req, respuestaNetwork.clone());
        }

        return respuestaNetwork;

    } catch (error) {
        console.log(`${error} url: ${req.url}`);
        return new Response("Error cache firts: " + req.url, {
            status: 500,
        });
    }
}

async function networkOnly(req) {
    try {

        let response = await fetch(req);

        if (response.ok) return response;

        return new Response("Error al obtener la respuesta de la red", {
            status: 500,
        });

    } catch (error) {
        return new Response("Error al acceder a la red", { status: 500 });
    }
}

async function networkFirst(request) {
    try {
        let cache = await caches.open(CACHE_NAME);
        let respuesta = await fetch(request);

        if (respuesta.ok) {
            cache.put(request, respuesta.clone());
        }

        return respuesta;

    } catch (error) {
        let response = await cache.match(request);

        return response ||
            new Response("Recurso no disponible en caché ni en la red", {
                status: 503,
            });
    }
}


self.addEventListener("install", (event) => {
    event.waitUntil(precache());
    createDB();
});


self.addEventListener("activate", (event) => {
    isAutenticado = usuarioAutenticado();
    event.waitUntil(event.request);
});



self.addEventListener("fetch", async (event) => {

    // FILTRAR SOLO ACEPTE PETICIONES HTTPS Y DE NUESTRO DOMINIO
    const url = new URL(event.request.url);
    const method = event.request.method;
    const mode = event.request.mode;

    const isImage =
        url.pathname.includes('.png') ||
        url.pathname.includes('.jpeg') ||
        url.pathname.includes('.svg') ||
        url.pathname.endsWith('.jpg');

    const isFuenteLetra =
        url.pathname.includes('Montserrat') ||
        url.pathname.includes('fonts');

    const isFotoTec = url.pathname.includes("https://intertec.tec-carbonifera.edu.mx/fotos");

    const isMethodPOST = method === "POST";

    const isHttps =
        url.protocol.includes("https") ||
        url.protocol.includes("HTTPS");

    const isCss = url.pathname.includes(".css");

    const isLogin = url.pathname.includes("/login");

    if (!isHttps) return;

    if (isFotoTec || isFuenteLetra) return;

    console.log(isAutenticado);

    if (!isAutenticado && !isLogin && mode === "navigate" && url.origin === location.origin) {

        event.respondWith(Response.redirect('/login', 301));
    }
    else if (url.pathname.includes("api") || isMethodPOST) {

        event.respondWith(networkOnly(event.request));
    }
    else if (isImage && isCss) {

        event.respondWith(cacheFirst(event.request));
    }
    else {
        event.respondWith(networkFirst(event.request));
    }

});



var baseDatos;

async function createDB() {

    const request = indexedDB.open(DB_NAME, versionBD);

    request.onupgradeneeded = function (event) {
        baseDatos = event.target.result;
        var objectStore = baseDatos.createObjectStore("credenciales", { autoIncrement: true });
    };

    request.onsuccess = function (event) {
        baseDatos = request.result;
    };

    request.onerror = function (event) {
        console.error("ERROR AL CREAR LA BASE DE DATOS INDEXDB " + event.target.errorCode);
    };
}



function verificarExisteBaseDatos() {

    if (baseDatos === undefined) {

        const request = indexedDB.open(DB_NAME, verdionBD);

        request.onsuccess = (event) => {
            baseDatos = event.target.result;
        }
    }
}



function addToDatabaseCredenciales(obj) {

    const resultado = baseDatos
        .transaction([TABLA_CREDENCIALES], "readwrite")
        .objectStore(TABLA_CREDENCIALES)
        .add(obj);


    resultado.onsuccess = () => isAutenticado = true;
    resultado.onerror = () => isAutenticado = false;

}

function usuarioAutenticado() {

    const request = baseDatos
        .transaction(TABLA_CREDENCIALES)
        .objectStore(TABLA_CREDENCIALES)
        .openCursor();

    request.onsuccess = (event) => {
        const cursor = event.target.result;
        return (cursor) ? true : false;

    };

    request.onerror = () => false;

    return false;
}

function eliminarUsuario() {

    var request = baseDatos
        .transaction([TABLA_CREDENCIALES], "readwrite")
        .objectStore(TABLA_CREDENCIALES)
        .clear();

    request.onsuccess = function (event) {
        console.log("SE ELIMINARON TODOS LOS USUARIOS");
        isAutenticado = false;
    };
}



usuarioChannel.onmessage = (event) => {

    const mensaje = event.data;

    if (mensaje.operacion === "AGREGAR") {
        console.log("AGREGAR USUARIO MENSAJE");
        addToDatabaseCredenciales(mensaje.credencial);
    }
    else if (mensaje.operacion === "ELIMINAR") {
        console.log("ELIMINAR USUARIO MENSAJE");
        eliminarUsuario();
    }

}
