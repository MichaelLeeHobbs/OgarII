module.exports = (server) => {
    // unprotected routes
    require('./ping')(server)
    require('./register')(server)
    require('./login')(server)

    // protected routes
    require('./whoami')(server)
    require('./home')(server)
    require('./admin')(server)
    require('./settings')(server)
}