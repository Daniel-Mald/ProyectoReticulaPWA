const CACHE_NAME = "cachev1";
const urls = [
    "/",
    "/perfil",
    "/login",
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
    "/scripts/main.js"
];


async function precache() {
    let cache = await caches.open(CACHE_NAME);

    //urls.forEach(async (url) => {

    //    try {
    //        await cache.add(url);
    //    }
    //    catch (error) {
    //        console.error("error ", url)
    //    }
    //});

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
        }
        else {

            let respuestaNetwork = await fetch(req);

            if (respuestaNetwork.ok) { // Verificar si la respuesta es válida
                cache.put(req, respuestaNetwork.clone());
            }

            return respuestaNetwork;
        }
    } catch (error) {
        console.log(error);
        return new Response("Error fetching the resource: " + req.url, { status: 500 });
    }
}


async function networkOnly(req) {
    try {
        let response = await fetch(req);
        if (response.ok) {
            return response;
        } else {
            return new Response("Error al obtener la respuesta de la red", { status: 500 });
        }
    } catch (error) {
        console.log(error);
        return new Response("Error al acceder a la red", { status: 500 });
    }
}

async function networkFirst(req) {
    let cache = await caches.open(CACHE_NAME);
    try {

        let respuesta = await fetch(req);

        if (respuesta.ok) {
            cache.put(req, respuesta.clone());
        }
        return respuesta;

    } catch (error) {
        let response = await cache.match(req);
        return response || new Response("Recurso no disponible en caché ni en la red", { status: 503 });
    }
}
async function staleThenRevalidate(req) {
    try {
        let cache = await caches.open(CACHE_NAME);
        let cachedResponse = await cache.match(req);

        if (cachedResponse) {

            fetch(req).then(async (networkResponse) => {
                if (!networkResponse.ok) return; // No fue existosa la respuesta de la red

                let cacheData = await cachedResponse.clone().text();
                let networkData = await networkResponse.clone().text();

                if (cacheData === networkData) return; // No hay cambios en la respuesta

                await cache.put(req, networkResponse.clone());

                //channel.postMessage({
                //    url: req.url,
                //    data: networkData
                //});

            }).catch(err => {
                console.error(`Error al obtener la respuesta de la red: ${err} url ${req.url}`);
            });

            return cachedResponse.clone();
        } else {
            return networkFirst(req);
        }

    } catch (error) {
        console.error(`Error en staleThenRevalidate: ${error}, url ${req.url}`);
        return new Response("Error interno", { status: 500 });
    }
}





self.addEventListener("install", (event) => {
    console.log("Service Worker Instalado");
    event.waitUntil(precache());
});


self.addEventListener("activate", (event) => {
    console.log("Service Worker Activo");
    event.waitUntil(borrarCacheAntiguo());
});


self.addEventListener('fetch', (event) => {

    if (event.request.url.includes("png") || event.request.url.includes("jpg") || event.request.url.includes("svg")) {
        event.respondWith(cacheFirst(event.request));
    }
    else if (event.request.url.includes("api/reticula")) {
        event.respondWith(networkOnly(event.request));
    }
    else {
        event.respondWith(staleThenRevalidate(event.request));
    }
});

