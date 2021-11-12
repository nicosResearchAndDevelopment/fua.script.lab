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
;const http             = require("https");

//region fn
function sha256(data) {
    return crypto.createHash("sha256").update(data, "binary").digest("base64");
    //                                               ------  binary: hash the byte string
}

//endregion fn
class Server extends EventEmitter {

    #id;
    #schema     = "idscp";
    #host;
    #port;
    #DAT;
    //#daps_register;
    #sessions   = new Map();
    #timeouts   = new Map();
    #dapsClient = null;
    #tlsServer  = null;
    #proto;

    //#proto_loaded;

    constructor({
                    id:      id,
                    schema:  schema = "idscp",
                    host:    host,
                    port:    port = 8080,
                    DAT:     DAT,
                    options: options = null,
                    //region DAPS
                    daps_register: daps_register,
                    dapsUrl:       dapsUrl,
                    dapsTokenPath: dapsTokenPath,
                    dapsJwksPath:  dapsJwksPath,
                    dapsVcPath:    dapsVcPath,
                    //endregion DAPS
                    proto: proto = null,
                    //proto_loaded: proto_loaded = null,
                    //authenticate: authenticate,
                    //
                    timeout_SESSION:        timeout_SESSION = 10,
                    timeout_WAIT_FOR_HELLO: timeout_WAIT_FOR_HELLO = 10
                }) {

        super(); // REM EventEmitter

        let server = this;

        server.#id            = id;
        server.#schema        = schema;
        server.#host          = host;
        server.#port          = port;
        server.#DAT           = DAT;
        //server.#daps_register = daps_register;

        server.#dapsClient = new DAPSClient({
            daps_register: daps_register,
            dapsUrl:       dapsUrl,
            dapsTokenPath: dapsTokenPath,
            dapsJwksPath:  dapsJwksPath,
            dapsVcPath:    dapsVcPath,
            SKIAKI:        options.cert.meta.SKIAKI,
            privateKey:    options.cert.privateKey,
            requestAgent:  new http.Agent({
                key:                options.tls.key,
                cert:               options.tls.cert,
                ca:                 options.tls.ca,
                requestCert:        options.tls.requestCert,
                rejectUnauthorized: options.tls.rejectUnauthorized
            })
        });

        server.#proto = proto;

        // REM : https://nodejs.org/api/tls.html#tlscreateserveroptions-secureconnectionlistener
        server.#tlsServer = tls.createServer(options.tls, async (socket) => {

            server.emit('event', {
                id:        `${server.#id}event/${uuid.v1()}`,
                timestamp: util.timestamp(),
                prov:      `${server.#id}listen/}`,
                step:      "tls-this.on.connect",
                event:     fsm.event.UPPER_START_HANDSHAKE
            });

            const
                id      = `${server.#id}session/${uuid.v4()}`,
                session = new Session({
                    id:           id,
                    sid:          sha256(id),
                    DAT:          server.#DAT,
                    proto:        server.#proto,
                    fsm:          fsm,
                    socket:       socket,
                    authenticate: async (token) => {
                        try {
                            let DAT = undefined;
                            DAT     = await server.#dapsClient.validateDat(token);
                            return DAT;
                        } catch (jex) {
                            throw(jex);
                        } // try
                    }, // authenticate
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

                server.emit(fsm.state.STATE_ESTABLISHED, session);

                session.on('data', (data) => {
                    server.emit('data', session, data);
                });
            });
            server.#sessions.set(session.sid, {session: session});
            server.emit('connection', session);

        }); // tls.createServer(options.tls)

        server.#tlsServer.on('error', (error) => {
            debugger;
            error;
        });

        Object.defineProperties(server, {
            id:           {
                value: server.#id, enumerable: true
            },
            schema:       {
                value: server.#schema, enumerable: true
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
                set:           (dat) => {
                    server.#DAT = dat;
                },
                get:           () => {
                    return server.#DAT;
                }, enumerable: false
            },
            refreshDAT:   {
                value:         async (daps = "default") => {
                    try {
                        server.#DAT = await server.#dapsClient.getDat();
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
                value:         async (
                    callback = () => {
                    }
                ) => {
                    try {
                        let error   = null;
                        server.#DAT = await server.#dapsClient.getDat();
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