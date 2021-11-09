const
    fs                  = require("fs"),
    path                = require('path'),
    crypto              = require("crypto"),
    EventEmitter        = require('events'),
    tls                 = require('tls'),
    //
    util                = require('@nrd/fua.core.util'),
    uuid                = require("@nrd/fua.core.uuid"),
    //
    {fsm, idscpVersion} = require(`./ids.idscp.fsm`),
    DAPSClient          = require('@nrd/fua.ids.client.daps'),
    {Session}           = require(`./ids.idscp.session`)
;

//region fn
function sha256(data) {
    return crypto.createHash("sha256").update(data, "binary").digest("base64");
    //                                               ------  binary: hash the byte string
}

//endregion fn
class Server extends EventEmitter {

    #id;
    #host;
    #DAT;
    #port;
    #sessions   = new Map();
    #timeouts   = new Map();
    #dapsClient = null;
    #tlsServer  = null;
    #proto;

    //#proto_loaded;

    constructor({
                    id:      id,
                    host:    host,
                    port:    port = 8080,
                    DAT:     DAT,
                    options: options = null,
                    //region DAPS
                    dapsUrl:       dapsUrl,
                    dapsTokenPath: dapsTokenPath,
                    dapsJwksPath:  dapsJwksPath,
                    dapsVcPath:    dapsVcPath,
                    //endregion DAPS
                    proto: proto = null,
                    //proto_loaded: proto_loaded = null,
                    authenticate: authenticate,
                    //

                    timeout_SESSION:        timeout_SESSION = 10,
                    timeout_WAIT_FOR_HELLO: timeout_WAIT_FOR_HELLO = 10
                }) {

        super(); // REM EventEmitter

        //const
        //    timeouts = new Map()
        //    //sessions = new Map()
        //;

        this.#id   = id;
        this.#host = host;
        this.#DAT  = DAT;
        this.#port = port;

        this.#dapsClient = new DAPSClient({
            dapsUrl:       dapsUrl,
            dapsTokenPath: dapsTokenPath,
            dapsJwksPath:  dapsJwksPath,
            dapsVcPath:    dapsVcPath,
            SKIAKI:        options.cert.meta.SKIAKI,
            privateKey:    options.cert.privateKey
        });

        this.#proto = proto;
        //this.#proto_loaded = proto_loaded;

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
                id      = `${this.#id}session/${uuid.v4()}`,
                session = new Session({
                    id:    id,
                    sid:   sha256(id),
                    DAT:   this.#DAT,
                    proto: this.#proto,
                    //proto_loaded: this.#proto_loaded,
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
            this.#sessions.set(session.sid, {session: session});
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
            host:         {
                value: server.#host, enumerable: true
            },
            port:         {
                value: server.#port, enumerable: true
            },
            idscpVersion: {
                value: idscpVersion, enumerable: true
            },
            DAT:          {
                set: (dat) => {
                    server.#DAT = dat;
                },
                get: () => {
                    return server.#DAT;
                }, enumerable: false
            },
            refreshDAT:   {
                value:         async (daps = "default") => {
                    try {
                        server.#DAT = await this.#dapsClient.getDat();
                        return !!server.#DAT;
                    } catch (jex) {
                        throw (jex);
                    } // try
                }, enumerable: false
            }, //refreshDAT
            hasSession:   {
                value:         (sid) => {
                    return server.#sessions.has(sid);
                }, enumerable: false
            },
            listen:       {
                value:         (
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
                }, enumerable: false
            }   // listen
        }); // Object.defineProperties()

        return server;

    } // constructor

} // Server

exports.Server = Server;

// EOF