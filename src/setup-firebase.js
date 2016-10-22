;(function () {
    firebase.initializeApp({
        apiKey: "AIzaSyCBjoejXOvMm03QO8Ne2x9XGLsG3nWtuIE",
        authDomain: "fila-de-espera.firebaseapp.com",
        databaseURL: "https://fila-de-espera.firebaseio.com",
        storageBucket: "fila-de-espera.appspot.com",
        messagingSenderId: "835679819714"
    })

    window.DB = firebase.database() 
}())