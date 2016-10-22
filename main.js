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

    Users.limitToLast(100).once('value', function (data) {
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
                <li class="mdl-list__item mdl-list__item--two-line"  data-key="empty">
                    <i class="material-icons">new_releases</i>

                    Nenhuma pessoa na fila
                </li>
            `)

            isEmpty = true
            localStorage.removeItem('user-key')
            isScheduled(false)

            return
        }

        initialDataLoaded = true

        // Coloca lista de pessoas na tela
        Object.keys(users).map(function (key) {

            const user = users[key]
            const timeWaiting = Math.round((Date.now() - user.startAt) / 1000 / 60)

            $queue.insertAdjacentHTML('afterBegin', `
                <li class="mdl-list__item mdl-list__item--two-line" data-key="${key}" data-ami="${userKey}">
                    <span class="mdl-list__item-primary-content">
                        <i class="material-icons mdl-list__item-avatar">person</i>
                        <span>${users[key].twitter}</span>
                        <span class="mdl-list__item-sub-title" data>${timeWaiting}min esperando</span>
                    </span>
                    ${isUserKey(user.key, userKey)}
                </li>
            `)
        })
    })

    // Quando um elemento é alterado'
    Users.on('child_changed', function (data) {
        // console.log('child_changed: ', data.val())

        const user = data.val()
        const userKey = localStorage.getItem('user-key')

        if ($(`[data-key="${user.key}"]`).length) {
            Array.from($(`[data-key="${user.key}"]`))
                .map(function (element) {
                    element.remove()
                })

                if (user.key === userKey) {
                    isScheduled(false)
                }

            // if ($('[data-key]').length === 0) {
            //     isEmpty = true

            
            // }
        } else {
            $queue.insertAdjacentHTML('afterBegin', `
                <li class="mdl-list__item mdl-list__item--two-line" data-key="${user.key}">
                    <span class="mdl-list__item-primary-content">
                        <i class="material-icons mdl-list__item-avatar">person</i>
                        <span>${user.twitter}</span>
                        <span class="mdl-list__item-sub-title" data>Agora</span>
                    </span>
                    ${isUserKey(user.key, userKey)}
                </li>
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
        const userKey = localStorage.getItem('user-key')
        const element = $(`[data-key="${user.key}"]`)[0]

        if (element) {
            element.remove()

            if (user.key === userKey) {
                localStorage.removeItem('user-key')
                isScheduled(false)
            } 
        }

        if ($('[data-key]').length === 0) {
            isEmpty = true
            
            if (user.key === userKey) {
                isScheduled(false)
            } 
        }
    })

    function init() {
        checkNotificationComplete()

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

    function isUserKey(key, storageKey) {
        if (key === storageKey) {
            return `
                    <span class="mdl-list__item-secondary-content">
                        <a class="mdl-list__item-secondary-action" href="#"><i class="material-icons">star</i></a>
                    </span>
                `
        } else {
            return ''
        }
    }

    function checkNotificationComplete() {        
        if (location.search === '?me' && localStorage.getItem('user-key')) {
            DB.ref('users').child(localStorage.getItem('user-key')).remove()

            console.log('uauau')

            setTimeout(function () {
                location.href = location.pathname
            }, 1500)
        } else if (!localStorage.getItem('user-key') && location.search !== '') {
            location.href = location.pathname
        }
    }

    window.saveUser = saveUser
}())

// Share it http://j.mp/fila-de-espera