const versionCache = "3";
const verdionBD = 3;
const CACHE_NAME = `cacheV${versionCache}`;
const DB_NAME = "reticulaDB";



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
    "/assets/iconos/no-acreditada.png",
    "/assets/iconos/download.svg",
    "/assets/iconos/user.svg",
    "/assets/iconos/logout.svg",
    "/scripts/main.js",
    "/scripts/html2Pdf.js",
    "/scripts/perfil.js",
    "/scripts/ReticulaScript.js",
    "/assets/fonts/Montserrat-Bold.ttf",
    "/assets/fonts/Montserrat-Regular.ttf",
    "/login",
    "/"
];

async function precache() {
    const cache = await caches.open(CACHE_NAME);

    urls.forEach(async (url) => {

        try {

            await cache.add(url);
        }
        catch (error) {
            console.log("No se pudo agregar el recurso al caché: " + url);
        }

    });


}

const borrarCache = async (key) => {
    await caches.delete(key);
};

const borrarCacheAntiguo = async () => {
    const cacheKeys = await caches.keys();
    const cacheToDelete = cacheKeys.filter((key) => key !== CACHE_NAME);
    await Promise.all(cacheToDelete.map(borrarCache));
};

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
        return new Response("Error fetching the resource: " + req.url, {
            status: 500,
        });
    }
}

async function networkOnly(req) {
    try {
        let response = await fetch(req);
        if (response.ok) {
            return response;
        } else {
            return new Response("Error al obtener la respuesta de la red", {
                status: 500,
            });
        }
    } catch (error) {
        console.log(error);
        return new Response("Error al acceder a la red", { status: 500 });
    }
}

async function networkFirst(request) {
    let cache = await caches.open(CACHE_NAME);
    try {
        let respuesta = await fetch(request, { mode: 'cors', credentials: 'omit' });

        if (respuesta.ok) {
            cache.put(request, respuesta.clone());
        }
        return respuesta;
    } catch (error) {
        let response = await cache.match(request);
        return (
            response ||
            new Response("Recurso no disponible en caché ni en la red", {
                status: 503,
            })
        );
    }
}

const channel = new BroadcastChannel("Cambios_Channel");
async function staleThenRevalidate(request) {
    try {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);

        if (!cachedResponse) return networkFirst(request);

        fetch(request, { mode: 'cors', credentials: 'omit' })
            .then(async (networkResponse) => {
                if (!networkResponse.ok) return; // No fue existosa la respuesta de la red

                //const cacheResponseCloneText = await cachedResponse.clone().text();
                //const responseNetworkCloneText = await networkResponse.clone().text();

                //if (cacheResponseCloneText === responseNetworkCloneText) return; // No hay cambios en la respuesta

                await cache.put(request, networkResponse.clone());

                //AVISAR CAMBIOS

            })
            .catch((err) => {
                console.error(
                    `Error al obtener la respuesta de la red: ${err} url ${request.url}`
                );
            });

        return cachedResponse.clone();


    } catch (error) {
        console.error(`Error en staleThenRevalidate: ${error}, url ${request.url}`);
        return new Response("Error interno", { status: 500 });
    }
}

async function loginPerssistente(request) {

    const cache = await caches.open(CACHE_NAME);

    const credenciales = await getUsuarios();
    console.log("LOGIN " + credenciales);
    const isAutenticado = (credenciales && credenciales.length > 0) ? true : false;

    if (isAutenticado) {

        return await staleThenRevalidate(request);
    }
    else {

        const loginCache = await cache.match("/login");

        return loginCache || await networkFirst("/login");
    }
}


self.addEventListener("install", (event) => {
    event.waitUntil(precache());
    createDB();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(borrarCacheAntiguo());
});




self.addEventListener("fetch", (event) => {

    const isOnline = self.navigator.onLine;
    const url = new URL(event.request.url);
    const isImage =
        url.pathname.includes('.png') ||
        url.pathname.includes('.jpeg') ||
        url.pathname.includes('.svg') ||
        url.pathname.endsWith('.jpg');


    const url2 = event.request.url;

    const isViewPerfil = url2.includes("/perfil");


    if (event.request.url == `${url.origin}/` || event.request.url == url.origin || event.request.url.includes("/perfil")) {
        event.respondWith(loginPerssistente(event.request));
    }

    else if (event.request.url.includes("api") || event.request.method === "POST") {
        event.respondWith(networkOnly(event.request));
    }
    else if (event.request.url.includes("https://intertec.tec-carbonifera.edu.mx/fotos")) {
        return;
    }
    else if (isImage) {
        event.respondWith(cacheFirst(event.request));
    }
    else {
        event.respondWith(staleThenRevalidate(event.request));
    }

});



var baseDatos;
async function createDB() {

    const request = indexedDB.open(DB_NAME, verdionBD);

    request.onupgradeneeded = function (event) {
        baseDatos = event.target.result;
        var objectStore = baseDatos.createObjectStore("credenciales", { autoIncrement: true });
        objectStore.createIndex("numeroControl", "numeroControl", { unique: true });
        objectStore.createIndex("password", "password", { unique: false });


    };

    request.onsuccess = function (event) {
        baseDatos = request.result;
    };

    request.onerror = function (event) {
        console.error("ERROR AL CREAR LA BASE DE DATOS INDEXDB " + event.target.errorCode);
    };
}

const UsuarioChannel = new BroadcastChannel("USUARIO_CHANNEL");



function addToDatabaseCredenciales(obj) {

    const transaction = baseDatos.transaction(["credenciales"], "readwrite");
    const objectStore = transaction.objectStore("credenciales");
    const resultado = objectStore.add(obj);

    resultado.onsuccess = function () {
        console.log(`AGREGADA ${obj.numeroControl}`);
    };
    resultado.onerror = function () {
        console.log(`ERROR AL AGREGAR ${obj.numeroControl}`);
    };

}

function getUsuarios() {
    return new Promise((resolve, reject) => {
        var transaction = baseDatos.transaction(["credenciales"]);
        var objectStore = transaction.objectStore("credenciales");

        const usuarios = [];
        var request = objectStore.openCursor(); // Obtiene todos los registros

        request.onsuccess = function (event) {
            var cursor = event.target.result;

            if (cursor) {

                usuarios.push({
                    numeroControl: cursor.value.numeroControl,
                    password: cursor.value.password
                });
                cursor.continue();
            }
        };

        request.onerror = function (event) {
            console.error("Error al obtener los elementos:", event.target.error);
            return [];
        };


        transaction.oncomplete = function () {
            console.log("Se obtuvieron los usuarios");
            resolve(usuarios);
        }
    });
}

function eliminarUsuario() {
    var request = baseDatos
        .transaction(["credenciales"], "readwrite")
        .objectStore("credenciales")
        .clear();
    request.onsuccess = function (event) {
        console.log("SE ELIMINARON TODOS LOS USUARIOS");
    };
}



UsuarioChannel.onmessage = (event) => {

    const mensaje = event.data;

    if (mensaje.operacion === "AGREGAR") {

        addToDatabaseCredenciales(mensaje.credencial);
    }
    else if (mensaje.operacion === "ELIMINAR") {
        eliminarUsuario();
    }

}
