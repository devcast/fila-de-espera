var cacheName = 'cache-name-1234567'
var cacheFiles = [
    './',
    './index.html',
    './main.js'
    // 'https://www.gstatic.com/firebasejs/3.5.1/firebase.js',
    // 'https://code.getmdl.io/1.2.1/material.min.js',
    // 'https://fonts.googleapis.com/icon?family=Material+Icons',
    // 'https://code.getmdl.io/1.2.1/material.indigo-pink.min.css'
]

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches
            .open(cacheName)
            .then(function (cache) {
                return cache.addAll(cacheFiles)
            })
            .then(function () {
                return self.skipWaiting()
            })
    )
})

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches
            .keys()
            .then(function (keyList) {
                console.log(keyList)
                return Promise.all(keyList.map(function (key) {
                    console.log(key)
                    if (key !== cacheName) return caches.delete(key)
                }))
            })
    )

    return self.clients.claim()
})

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request)
            .then(function (response) {
                return response || fetch(event.request, { include: 'CORS' })
            })
    )
})

self.addEventListener('push', function (event) {
    event.waitUntil(
        self.registration.showNotification('Compareça ao stand da iMasters em 5 minutos', {
            'body': 'The Message',
            'icon': 'imasters-cubo.png'
        })
    )
    console.log(event);
})

self.addEventListener('notificationclick', function(event) {
    console.log('notificationClick: ', event.notification)

    event.notification.close();

    const url = location.hostname !== 'devcast.github.io'
                ? 'http://'+location.hostname+':8080/'
                : 'https://'+location.hostname+'/fila-de-espera/'

    event.waitUntil(
        clients.matchAll({
            type: 'window'
        })
        .then(function(windowClients) {
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];

                // executado para cada janela do site aberta no browser
                // console.dir(client)

                if (client.url === url && 'focus' in client && client.visibilityState === 'hidden') {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    )
})