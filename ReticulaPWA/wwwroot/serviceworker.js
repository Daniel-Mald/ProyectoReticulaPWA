
let urls = [
    "/",
    "/Index",
    "/estilos.css",
    "/assets/logos/Logo144x144.png",
    "/assets/logos/Logo192x192.png",
    "/assets/logos/Logo512x512.png",
    "/assets/main.js?v=2"
];

let cacheName = "laFuckingCache";
let channel = new BroadcastChannel("refreshChannel")

async function precache() {
    let cache = await caches.open(cacheName);
    await cache.addAll(urls);
}
self.addEventListener("install", function (e) {
    e.waitUntil(precache());

});


self.addEventListener('fetch', event => {
    event.respondWith(staleWhileRevalidate(event.request));
});

async function staleWhileRevalidate(url) {
    try {
        let cache = await caches.open(cacheName);
        let response = await cache.match(url);
        let response = await cache.match(new Request(url));

        let fetchPromise = fetch(url).then(async networkResponse => {
            if (networkResponse.ok) {
                await cache.put(url, networkResponse.clone());
            }
            return networkResponse;
        }).catch(err => {
            console.log("Error fetching from network:", err);
        });

        return response || fetchPromise;
    } catch (x) {
        console.log("Error en staleWhileRevalidate:", x);
        return new Response("Error interno", { status: 500 });
    }
}
