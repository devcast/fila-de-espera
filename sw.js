var cacheName = 'cache-1'
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
        self.registration.showNotification('Stand iMasters', {
            'body': 'Chegou sua vez',
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
            if (clients.openWindow) {
                return clients.openWindow(url + '?me');
            }
        })
    )
})