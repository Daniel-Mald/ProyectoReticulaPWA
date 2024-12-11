const versionCache = "3";
const versionBD = 3;
const CACHE_NAME = `cacheV${versionCache}`;
const DB_NAME = "reticulaDB";
const TABLA_CREDENCIALES = "credenciales";
let token = null;   

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


async function loginPersistente(request) {
    try {

        if (request.url.includes("/login")) {
            return cacheFirst(request);
        }
        token = "ss";
        if (token == null) {

            return Response.redirect('/login', 301);
        }

        return cacheFirst(request);
    }
    catch (error) {
        console.log(error);
        return new Response("Error al verificar la autenticación", { status: 500 });
    }
}



self.addEventListener("install", (event) => {
    event.waitUntil(precache());
});


self.addEventListener("activate", (event) => {
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

    const isCss = url.pathname.includes(".css");

    if (isFotoTec || isFuenteLetra) return;


    if (mode === "navigate" && url.origin === location.origin) {

        event.respondWith(loginPersistente(event.request));
    }
    else if (url.pathname.includes("Reticula/login") || isMethodPOST) {

        event.respondWith(networkOnly(event.request));
    }
    else if (url.pathname.includes("api/")) {

    }
    else {
        event.respondWith(cacheFirst(event.request));
    }

});




usuarioChannel.onmessage = async (event) => {

    const mensaje = event.data;
    const obj = mensaje.credencial;

    if (mensaje.operacion === "AGREGAR") {
        token = "TOKEN";
    }
    else if (mensaje.operacion === "ELIMINAR") {

        console.log("ELIMINAR USUARIO MENSAJE");
        token = null;
    }

}
