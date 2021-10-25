const
    fs           = require("fs"),
    path         = require('path'),
    EventEmitter = require('events'),
    tls          = require('tls'),

    //protobuf         = require('my-protos'),
    //
    //uuid             = require(path.join(process.env.FUA_JS_LIB, 'core.uuid/src/core.uuid.js')),
    //util             = require(path.join(process.env.FUA_JS_LIB, 'core.util/src/core.util.js')),
    util         = require('@nrd/fua.core.util'),
    uuid         = require("@nrd/fua.core.uuid"),
    //
    {fsm}        = require(`./ids.idscp.fsm`),
    idscpVersion = "2"
;

class Session extends EventEmitter {

    #id;
    #DAT;
    #socket;

    constructor({
                    id:     id,
                    DAT:    DAT,
                    fsm:    fsm,
                    proto:  proto,
                    socket: socket
                }) {

        super(); // REM : EventEmitter

        this.#id     = id;
        this.#DAT    = DAT;
        this.#socket = socket;

        let client = this;

        Object.defineProperties(client, {
            id:   {
                value: client.#id, enumerable: true
            },
            DAT:  {
                get:           () => {
                    return client.#DAT;
                }, enumerable: true
            },
            send: {
                value:         (data) => {
                    if (client.#socket)
                        client.#socket.write(data);
                }, enumerable: false
            }, // send
            quit: {
                value:         () => {
                    if (client.#socket)
                        client.#socket.end;
                }, enumerable: false
            } // quit
        }); // Object.defineProperties()

        let message = proto.IdscpHello.create({});
        this.#socket.write(fsm);
        this.#socket.on('data', (data) => {
            client.emit('data', data)
        });

        return client;

    } // constructor

} // Session

function timeout(id, clients, emit, seconds) {

    // TODO : emitted by timeout
    //emit({
    //    id: id
    //});
    return () => {

    };
}

class Server extends EventEmitter {

    #id;
    #port;
    #tlsServer = null;
    #proto;

    constructor({
                    id:      id,
                    port:    port = 8080,
                    options: options = null,
                    proto:   proto = null
                }) {

        super(); // REM EventEmitter

        const
            timeouts = new Map(),
            sessions = new Map()
        ;

        this.#id    = id;
        this.#port  = port;
        this.#proto = proto;

        let server = this;

        // REM : https://nodejs.org/api/tls.html#tlscreateserveroptions-secureconnectionlistener
        this.#tlsServer = tls.createServer(options.tls, (socket) => {

            this.emit('event', {
                id:        `${this.#id}event/${uuid.v1()}`,
                timestamp: util.timestamp(),
                prov:      `${this.#id}listen/}`,
                step:      "tls-this.on.connect"
            });

            // TODO : thsi should happen at the end fsm-run...
            const session = new Session({
                id:     `${this.#id}client/${uuid.v1()}`,
                proto:  this.#proto,
                fsm:    fsm,
                socket: socket
            });
            session.on('event', (event) => {
                this.emit('event', event);
            });
            sessions.set(session.id, {
                // TODO : timeout >>> DAT.exp
                timeout: timeout(
                    session.id,
                    clients,
                    (client) => {
                        this.emit('clientTimeout', client);
                    },
                    /** seconds */ 60),
                session:  session
            });
            this.emit('connection', session);
        });

        //this.#tlsServer.on('connect', (socket) => {
        //
        //});
        this.#tlsServer.on('error', (error) => {
            //debugger;
            error;
        });

        Object.defineProperties(server, {
            id:           {
                value: this.#id, enumerable: true
            },
            listen:       {
                value:      (
                                callback = () => {
                                }
                            ) => {
                    try {
                        let error = null;
                        this.emit('event', {
                            id:        `${this.#id}event/${uuid.v1()}`,
                            timestamp: util.timestamp(),
                            prov:      `${this.#id}listen/}`,
                            step:      "before tls-server listens"
                        });
                        this.#tlsServer.listen(this.#port, callback);
                        //return;
                    } catch (jex) {
                        debugger;
                        throw(jex);
                    } // try
                }, // value
                enumerable: false
            },   // listen
            port:         {
                value: this.#port, enumerable: true
            },
            idscpVersion: {
                value: idscpVersion, enumerable: true
            }
        }); // Object.defineProperties()

        return server;

    } // constructor

} // Server

exports.Server = Server;