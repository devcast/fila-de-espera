;(function () {
    if ('serviceWorker' in window.navigator) {
        init()
    } else {
        notSupported()
    }

    // RIP jQuery
    const $ = document.querySelectorAll.bind(document)
    const $queue = $('.js-queue')[0]

    // Database Stuff
    const DB = firebase.database()
    const Users = DB.ref('users')
    const UsersList = Users.limitToLast(10);
    let isLoading = true

    UsersList.on('child_added', function (data) {
        const user = data.val()

        if (isLoading) {
            $queue.textContent = ''
            isLoading = false
        }

        $queue.insertAdjacentHTML('afterBegin', `<li data-key="${user.key}">${user.twitter}</li>`)
    })

    UsersList.on('child_changed', function (data) {
        Array.from($(`[data-key="${data.val().key}"]`))
            .map(function (element) {
                element.remove()
            })
    })

    function init() {
        navigator.serviceWorker.register('sw.js')
            .then(function () {
                return navigator.serviceWorker.ready
            })
            .then(function (register) {
                register.pushManager.subscribe({
                        userVisibleOnly: true
                    })
                    .then(function (subscription) {
                        localStorage.setItem('subscription_id', subscription.endpoint)

                        const token = localStorage.subscription_id.split('send/')[1]
                    })
            })
            .catch(function (error) {
                console.error(error)
            })
    }

    function saveUser(twitter, subscription_id) {
        if (!twitter || !subscription_id) {
            throw new Error('Right params: twitter, subscription_id must be String')
        }

        let user = {
            twitter: twitter,
            subscription_id: subscription_id
        }

        const key = Users.push().key

        var updates = {}

        updates['users/' + key] = user

        return DB.ref().update(updates)
    }

    function notSupported() {
        document.body.innerHTML = '<h1>Desculpe, seu navegador ainda não suporta Service Workers, reclame para @DevCastBrasil no Twitter</h1>'
    }

    window.saveUser = saveUser
}())