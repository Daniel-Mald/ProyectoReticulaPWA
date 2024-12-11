const versionCache = "4";
const versionBD = 3;
const CACHE_NAME = `cacheV${versionCache}`;
const DB_NAME = "reticulaDB";
const TABLA_CREDENCIALES = "credenciales";
let token = null;

const usuarioChannel = new BroadcastChannel("USUARIO_CHANNEL");
const actualizarChannel = new BroadcastChannel("ACTUALIZAR_CHANNEL");


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

        let respuestaNetwork = await fetch(req);

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

async function staleWhileRevalidate(request) {
    try {
        let cache = await caches.open(CACHE_NAME);

        let responseCache = await cache.match(request);

        let fetchPromise = fetch(request).then((networkResponse) => {

            if (networkResponse.ok) {

                const dataNetwork = await networkResponse.clone().text();
                const dataCache = await responseCache.clone().text();

                if (dataNetwork !== dataCache) {

                    actualizarChannel.postMessage({actualizar: true})

                }

                cache.put(request, networkResponse.clone());

                return networkResponse;
            }
        });

        return responseCache || fetchPromise;

    } catch (error) {
        return new Response("Error al obtener la respuesta de la red", {
            status: 500,
        });
    }
}

async function handlerLogin(request) {

    try {
        const response = await fetch(request.clone());

        if (!response.ok) {
            return new Response(JSON.stringify({ error: 'Credenciales inválidas' }), { status: 401 });
        }

        const data = await response.text();

        const db = await openDatabase();

        await actualizarElemento(db, data);

        // Redirigir automáticamente a / después del login exitoso
        return Response.redirect('/', 302);

    } catch (err) {
        return new Response(JSON.stringify({ error: 'API no disponible' }), { status: 500 });
    }
}

async function informacionProtegida(request) {

    try {

        const db = await openDatabase();
        const credenciales = await getCredenciales(db);

        if (!credenciales || credenciales.length == 0) {
            return Response.redirect('/login', 302);
        }

        const credencial = credenciales[0];

        const headers = new Headers(request.headers);

        const numControl = credencial.split('-')[0];
        const password = credencial.split('-')[1];

        headers.set('NumControl', numControl);
        headers.set('Password', password);

        return staleWhileRevalidate(new Request(request, { headers }));

    }
    catch (err) {
        return new Response(JSON.stringify({ error: 'API no disponible' }), { status: 500 });
    }
}


self.addEventListener("fetch", async (event) => {

    // FILTRAR SOLO ACEPTE PETICIONES HTTPS Y DE NUESTRO DOMINIO
    const url = new URL(event.request.url);
    const method = event.request.method;
    const mode = event.request.mode;

    const isFuenteLetra =
        url.pathname.includes('Montserrat') ||
        url.pathname.includes('fonts');

    const isFotoTec = url.pathname.includes("https://intertec.tec-carbonifera.edu.mx/fotos");

    const isMethodPOST = method === "POST";

    if (isFotoTec || isFuenteLetra) return;


    const isHorario = url.pathname.includes("/api/reticula/horario");
    const isReticula = url.pathname.includes("/api/reticula/reticula");
    const isPerfil = url.pathname.includes("/api/reticula/perfil");

    const isView = mode === "navigate";
    const isViewLogin = url.pathname.includes("/login") && isView;

    if (url.pathname.includes("/api/Reticula/login")) {
        event.respondWith(handlerLogin(event.request));
    }
    else if (isMethodPOST) {
        event.respondWith(networkOnly(event.request));
    }
    else if ((isHorario || isPerfil || isReticula || isView) && !isViewLogin) {
        event.respondWith(informacionProtegida(event.request))
    }
    else {
        event.respondWith(cacheFirst(event.request));
    }

});

self.addEventListener("install", (event) => {
    event.waitUntil(precache());
});


self.addEventListener("activate", (event) => {
    event.waitUntil(event.request);
});


usuarioChannel.onmessage = async (event) => {

    const mensaje = event.data;
    const obj = mensaje.credencial;

    if (mensaje.operacion === "ELIMINAR") {
        await deleteAll();
        console.log("Credenciales eliminadas");
    }

}

async function openDatabase() {

    var request = indexedDB.open(DB_NAME, versionBD);

    request.onupgradeneeded = (event) => {
        const db = event.target.result;
        db.createObjectStore(TABLA_CREDENCIALES, { autoIncrement: true });
    }

    return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
            resolve(event.target.result);
        }
        request.onerror = (event) => {
            reject(event.target.error);
        }
    });
}


async function actualizarElemento(db, credencial) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(TABLA_CREDENCIALES, "readwrite");
        const tabla = transaction.objectStore(TABLA_CREDENCIALES);

        // Intentar actualizar el elemento
        const request = tabla.put(credencial);

        request.onsuccess = function () {
            resolve("Elemento actualizado correctamente.");
        };

        request.onerror = function (event) {
            reject("Error al actualizar el elemento: " + event.target.error);
        };

        // Manejar errores en la transacción
        transaction.onerror = function (event) {
            reject("Error en la transacción: " + event.target.error);
        };
    });
}


async function getCredenciales(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(TABLA_CREDENCIALES, "readonly");
        const tabla = transaction.objectStore(TABLA_CREDENCIALES);

        const request = tabla.openCursor();
        const resultados = [];

        request.onsuccess = function (event) {
            const cursor = event.target.result;
            if (cursor) {
                // Agregar el elemento actual a los resultados
                resultados.push(cursor.value);
                cursor.continue(); // Continuar al siguiente elemento
            } else {
                // No hay más elementos, resolver la promesa
                resolve(resultados);
            }
        };

        request.onerror = function (event) {
            reject("Error al obtener los elementos: " + event.target.error);
        };

        transaction.onerror = function (event) {
            reject("Error en la transacción: " + event.target.error);
        };
    });
}


async function deleteAll() {
    const db = await openDatabase();

    const transaction = db.transaction(TABLA_CREDENCIALES, "readwrite");

    const tabla = transaction.objectStore(TABLA_CREDENCIALES);

    tabla.clear();

    return new Promise((resolve, reject) => {
        transaction.oncomplete = function () {
            resolve("Elementos eliminados correctamente.");
        };
        transaction.onerror = function (event) {
            reject("Error al eliminar los elementos: " + event.target.error);
        };

    });
}





