;(function () {
    if ('serviceWorker' in window.navigator) {
        init()
    } else {
        notSupported()
    }

    // RIP jQuery
    const $ = document.querySelectorAll.bind(document)
    const $queue = $('.js-queue')[0]
    const $form = $('.js-form')[0]

    // Database Stuff
    const Users = DB.ref('users')
    const UsersList = Users.limitToLast(10);
    let isLoading = true

    if (!localStorage.getItem('user-key')) {
        $form.classList.remove('is-hidden')
    }

    UsersList.on('child_added', function (data) {
        const user = data.val()

        if (isLoading) {
            $queue.textContent = ''
            isLoading = false
        }

        $queue.insertAdjacentHTML('afterBegin', `
            <div class="demo-card-wide mdl-card mdl-shadow--2dp" data-key="${user.key}">
                <div class="mdl-card__title">
                    <h2 class="mdl-card__title-text">${user.twitter}</h2>
                </div>
            </div>
        `)
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
                $form.addEventListener('submit', function (event) {
                    event.preventDefault()

                    const elements = Array.from($('[name]'))

                    const form = elements.reduce(function (form, input) {
                        if (!!input.name) {
                            form[input.name] = input.value
                        }

                        return form
                    }, {})

                    register.pushManager.subscribe({
                        userVisibleOnly: true
                    })
                    .then(function (subscription) {
                        form.subscription_id = subscription.endpoint.split('send/')[1]
                        console.log('subscription', form.twitter)
                        saveUser(form.twitter, form.subscription_id)
                    })
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
            subscription_id: subscription_id,
            key: Users.push().key
        }

        const updates = {}
        updates['users/' + user.key] = user

        localStorage.setItem('user-key', user.key)

        return DB.ref().update(updates)
    }

    function notSupported() {
        document.body.innerHTML = '<h1>Desculpe, seu navegador ainda não suporta Service Workers, reclame para @DevCastBrasil no Twitter</h1>'
    }

    window.saveUser = saveUser
}())
