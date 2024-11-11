const CACHE_NAME = "cachev1";
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
    "/Index",
    "/",
    "/Shared/_Layout",
    "/Login",
    "/Perfil"
];

async function precache() {
    const cache = await caches.open(CACHE_NAME);
    return cache.addAll(urls);
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

        if (response) {
            return response;
        } else {
            let respuestaNetwork = await fetch(req);

            if (respuestaNetwork.ok) {
                // Verificar si la respuesta es válida
                cache.put(req, respuestaNetwork.clone());
            }

            return respuestaNetwork;
        }
    } catch (error) {
        console.log(error);
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
        let respuesta = await fetch(request);

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

        if (cachedResponse) {
            fetch(request)
                .then(async (networkResponse) => {
                    if (!networkResponse.ok) return; // No fue existosa la respuesta de la red

                    const cacheResponseCloneText = await cachedResponse.clone().text();
                    const responseNetworkCloneText = await networkResponse.clone().text();

                    if (cacheResponseCloneText === responseNetworkCloneText) return; // No hay cambios en la respuesta

                    await cache.put(request, networkResponse.clone());

                    console.log("SON DIFERENTES");

                    channel.postMessage({
                        message: "Cambios en la retícula",
                        url: request.url,
                    });
                })
                .catch((err) => {
                    console.error(
                        `Error al obtener la respuesta de la red: ${err} url ${request.url}`
                    );
                });

            return cachedResponse.clone();
        } else {
            return networkFirst(request);
        }
    } catch (error) {
        console.error(`Error en staleThenRevalidate: ${error}, url ${request.url}`);
        return new Response("Error interno", { status: 500 });
    }
}




async function fuckCache(request) {

    try {
        const cache = await caches.open(CACHE_NAME);
        const response = await cache.match(req);

        if (response) return response;

        const respuestaNetwork = await fetch(req);

        if (respuestaNetwork.ok) {
            cache.put(req, respuestaNetwork.clone());
        }

        return respuestaNetwork;

    } catch (error) {
        console.log(error);
        return new Response("Error fetching the resource: " + req.url, {
            status: 500,
        });
    }

}






self.addEventListener("install", (event) => {
    event.waitUntil(precache());
});

self.addEventListener("activate", (event) => {
    console.log("Service Worker Activo");
    event.waitUntil(borrarCacheAntiguo());
});

self.addEventListener("fetch", (event) => {

    event.respondWith(networkOnly(event.request));
});
