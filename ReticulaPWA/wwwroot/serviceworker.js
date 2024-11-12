let version = "3";
const CACHE_NAME = `cacheV${version}`;
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
    "/assets/fonts/Montserrat-Regular.ttf"
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
        console.log( `${error} url: ${req.url}`);
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


self.addEventListener("install", (event) => {
    event.waitUntil(precache());
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


    if (event.request.url.includes("api") || event.request.method === "POST") {
        event.respondWith(networkOnly(event.request));
    }
    else if (event.request.url.includes("https://intertec.tec-carbonifera.edu.mx/fotos")) {
        return;
    }
    else if(isImage){
        event.respondWith(cacheFirst(event.request));
    }
    else {
        event.respondWith(staleThenRevalidate(event.request));
    }

});
