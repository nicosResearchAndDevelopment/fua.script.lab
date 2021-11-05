const
    fs           = require("fs"),
    path         = require('path'),
    EventEmitter = require('events'),
    tls          = require('tls'),
    //
    util         = require('@nrd/fua.core.util'),
    uuid         = require("@nrd/fua.core.uuid"),
    //
    {fsm, idscpVersion}  = require(`./ids.idscp.fsm`),
    {Session}    = require(`./ids.idscp.session`)
; // const

class Server extends EventEmitter {

    #id;
    #DAT;
    #port;
    #tlsServer = null;
    #proto;

    constructor({
                    id:           id,
                    DAT:          DAT,
                    port:         port = 8080,
                    options:      options = null,
                    proto:        proto = null,
                    authenticate: authenticate,
                    //

                    timeout_SESSION:        timeout_SESSION = 10,
                    timeout_WAIT_FOR_HELLO: timeout_WAIT_FOR_HELLO = 10
                }) {

        super(); // REM EventEmitter

        const
            timeouts = new Map(),
            sessions = new Map()
        ;

        this.#id    = id;
        this.#DAT   = DAT;
        this.#port  = port;
        this.#proto = proto;

        let server = this;

        // REM : https://nodejs.org/api/tls.html#tlscreateserveroptions-secureconnectionlistener
        this.#tlsServer = tls.createServer(options.tls, (socket) => {

            server.emit('event', {
                id:        `${this.#id}event/${uuid.v1()}`,
                timestamp: util.timestamp(),
                prov:      `${this.#id}listen/}`,
                step:      "tls-this.on.connect",
                event:     fsm.event.UPPER_START_HANDSHAKE
            });

            const
                session = new Session({
                    id:           `${this.#id}session/${uuid.v1()}`,
                    DAT:          this.#DAT,
                    proto:        this.#proto,
                    fsm:          fsm,
                    socket:       socket,
                    authenticate: authenticate,
                    startedAt:    util.timestamp(),
                    state:        {type: fsm.state.STATE_CLOSED_UNLOCKED},
                    //
                    reconnect:              false, // REM : default, Server doesn't reconnect!
                    timeout_WAIT_FOR_HELLO: timeout_WAIT_FOR_HELLO,
                    timeout_SESSION:        timeout_SESSION
                }) // session
            ; // const

            session.on('event', (event) => {
                server.emit('event', event);
            });

            // REM : fired ONLY, if it's running under <fsm.state.STATE_ESTABLISHED>
            session.on(fsm.state.STATE_ESTABLISHED, () => {
                session.on('data', (data) => {
                    server.emit('data', session, data);
                });
            });
            sessions.set(session.id, {session: session});
            server.emit('connection', session);

        }); // tls.createServer(options.tls)

        this.#tlsServer.on('error', (error) => {
            debugger;
            error;
        });

        Object.defineProperties(server, {
            id:           {
                value: server.#id, enumerable: true
            },
            DAT:          {
                set: (dat) => {
                    server.#DAT = dat;
                },
                get: () => {
                    return server.#DAT;
                }
            },
            listen:       {
                value:      (
                                callback = () => {
                                }
                            ) => {
                    try {
                        let error = null;
                        server.emit('event', {
                            id:        `${server.#id}event/${uuid.v1()}`,
                            timestamp: util.timestamp(),
                            prov:      `${server.#id}listen/}`,
                            step:      "before tls-server listens"
                        });
                        server.#tlsServer.listen(server.#port, callback);
                        //return;
                    } catch (jex) {
                        debugger;
                        throw(jex);
                    } // try
                }, // value
                enumerable: false
            },   // listen
            port:         {
                value: server.#port, enumerable: true
            },
            idscpVersion: {
                value: idscpVersion, enumerable: true
            }
        }); // Object.defineProperties()

        return server;

    } // constructor

} // Server

exports.Server = Server;

// EOF