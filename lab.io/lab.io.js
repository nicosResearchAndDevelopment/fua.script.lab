const
    server = require('http').createServer(),
    io     = require('socket.io')(server, {
        path:         '/',
        serveClient:  false,
        // below are engine.IO options
        pingInterval: 10000,
        pingTimeout:  5000,
        cookie:       false
    });

//server.listen(8080);
//
//io.on('connect', (socket) => {
//    socket;
//});
//
//io.of('/mc').on('connect', (socket) => {
//    socket;
//});

//region client

const
    ioc = require("socket.io-client")
;

////_socket = _ioc.connect(`${_spoc_host}`);
//let _socket    = ioc.connect(`https://10.10.70.83:3000`, {
//let _socket    = ioc.connect(`http://localhost:3000`, {
//let _socket    = ioc.connect(`http://127.0.0.1:3000/spoc`, {
//let _socket    = ioc.connect(`https://localhost:8080/`, {
//let _socket = ioc.connect(`https://localhost:8080/inbox`, {
//let _socket = ioc.connect(`https://localhost:8080/mc`, {
let _socket = ioc.connect(`https://localhost:8080/test_suite`, {
    'reconnect':          true,
    'rejectUnauthorized': false,
    'query':              {'user': JSON.stringify({'name': "jott", 'password': "grunz"})}
});
_socket.on('connect', function () {
    _socket['emit']("message", "genau", (data) => {
        data;
    });
});
_socket.on('error', function (error) {
    error;
});
_socket.on('connect_error', function (error) {
    let that;
    _socket;
});
_socket.on('event', function (data) {
    data;
});
_socket.on('socket.mc.connected', function (data) {
    data;
});
_socket.on('disconnect', function () {
    let that;
});

//endregion client

console.log(`end : reached`);