;
(function () {
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
    let isLoading = true
    let isEmpty = false
    let initialDataLoaded = false

    isScheduled()

    Users.limitToLast(5).once('value', function (data) {
        const users = data.val()
        const userKey = localStorage.getItem('user-key')

        // Não está mais carregando
        if (isLoading) {
            $queue.textContent = ''
            isLoading = false
        }

        // Não há pessoas na fila
        if (!users) {
            $queue.insertAdjacentHTML('afterBegin', `
                <div class="demo-card-wide mdl-card mdl-shadow--2dp" data-key="empty">
                    Nenhuma pessoa na fila
                </div>
            `)

            isEmpty = true
            localStorage.removeItem('user-key')
            isScheduled()

            return
        }

        initialDataLoaded = true

        // Coloca lista de pessoas na tela
        Object.keys(users).map(function (key) {
            $queue.insertAdjacentHTML('afterBegin', `
                <div class="demo-card-wide mdl-card mdl-shadow--2dp" data-key="${key}" data-ami="${userKey}">
                    <div class="mdl-card__title">
                        <h2 class="mdl-card__title-text">${users[key].twitter}</h2>
                    </div>
                </div>
            `)
        })
    })

    // Quando um elemento é alterado'
    Users.on('child_changed', function (data) {
        // console.log('child_changed: ', data.val())

        const user = data.val()

        if ($(`[data-key="${user.key}"]`).length) {
            Array.from($(`[data-key="${user.key}"]`))
                .map(function (element) {
                    element.remove()
                })

            if ($('[data-key]').length === 0) {
                isEmpty = true
                isScheduled(false)
            }
        } else {
            $queue.insertAdjacentHTML('afterBegin', `
                <div class="demo-card-wide mdl-card mdl-shadow--2dp" data-key="${user.key}">
                    <div class="mdl-card__title">
                        <h2 class="mdl-card__title-text">${user.twitter}</h2>
                    </div>
                </div>
            `)
        }

        if (isEmpty && $('[data-key="empty"]').length) {
            $('[data-key="empty"]')[0].remove()
            isEmpty = false
        }
    })

    // Quando um elemento é alterado'
    Users.on('child_removed', function (data) {
        // console.log('child_removed: ', data.val())

        const user = data.val()
        const element = $(`[data-key="${user.key}"]`)[0] 

        if (element) {
            element.remove()
            localStorage.removeItem('user-key')
        }

        if ($('[data-key]').length === 0) {
            isEmpty = true
            isScheduled(false)
        }
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
                            // console.log('subscription', form.twitter)
                            saveUser(form.twitter, form.subscription_id)
                        })
                })
            })
            .catch(function (error) {
                // console.error(error)
            })
    }

    function saveUser(twitter, subscription_id) {
        if (!twitter || !subscription_id) {
            throw new Error('Right params: twitter, subscription_id must be String')
        }

        let user = {
            twitter: twitter,
            subscription_id: subscription_id,
            key: Users.push().key,
            startAt: firebase.database.ServerValue.TIMESTAMP
        }

        const updates = {}
        updates['users/' + user.key] = user

        localStorage.setItem('user-key', user.key)
        isScheduled()

        return DB.ref().update(updates)
    }

    function notSupported() {
        document.body.innerHTML = '<h1>Desculpe, seu navegador ainda não suporta Service Workers, reclame para @DevCastBrasil no Twitter</h1>'
    }

    function isScheduled(state) {
        // console.log(!!localStorage.getItem('user-key'), !state)

        if (!!localStorage.getItem('user-key') || !!state) {
            $('.summary')[0].textContent = 'Você está na fila'
            $form.classList.add('is-hidden')
        } else {
            $form.classList.remove('is-hidden')
            localStorage.removeItem('user-key')

            $('.summary')[0].textContent = 'Entre na fila'
        }
    }

    window.saveUser = saveUser
}())