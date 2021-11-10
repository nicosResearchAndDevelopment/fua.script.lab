const
    EventEmitter              = require('events'),
    tls                       = require('tls'),
    http                      = require('https'),
    //
    util                      = require('@nrd/fua.core.util'),
    uuid                      = require("@nrd/fua.core.uuid"),
    //
    {fsm, wait, idscpVersion} = require(`./ids.idscp.fsm`),
    {Session}                 = require(`./ids.idscp.session`),
    DAPSClient                = require("@nrd/fua.ids.client.daps")
    //const _client                 = require("./certs/client.js"); // const
;

class Client extends EventEmitter {

    #id;
    #sid;
    #DAT;
    #proto;
    //#proto_loaded;
    #socket;
    #session;

    constructor({
                    id:      id,
                    DAT:     DAT,
                    options: options,
                    proto:   proto,
                    //proto_loaded: proto_loaded,
                    authenticate: authenticate,
                    //region clientDAPS
                    dapsUrl:       dapsUrl,
                    dapsTokenPath: dapsTokenPath,
                    dapsJwksPath:  dapsJwksPath,
                    dapsVcPath:    dapsVcPath,
                    SKIAKI:        SKIAKI,
                    privateKey:    privateKey,
                    //endregion clientDAPS
                    //
                    reconnect:       reconnect,
                    timeout_SESSION: timeout_SESSION = 10,
                    timeout_WAIT_FOR_HELLO = 10
                }) {

        super(); // REM EventEmitter

        this.#id    = id;
        this.#DAT   = DAT;
        this.#proto = proto;
        //this.#proto_loaded = proto_loaded;

        const dapsClient = new DAPSClient({
            dapsUrl:       dapsUrl,
            dapsTokenPath: dapsTokenPath,
            dapsJwksPath:  dapsJwksPath,
            dapsVcPath:    dapsVcPath,
            SKIAKI:        SKIAKI,
            privateKey:    privateKey,
            requestAgent:  new http.Agent({
                key:                options.socket.key,
                cert:               options.socket.cert,
                ca:                 options.socket.ca,
                requestCert:        options.socket.requestCert,
                rejectUnauthorized: options.socket.rejectUnauthorized
            })
        });

        let client = this;

        Object.defineProperties(client, {
            id:           {
                value: client.#id, enumerable: true
            },
            sid:          {
                get:           () => {
                    return client.#session.sid;
                }, enumerable: true
            },
            DAT:          {
                set: (dat) => {
                    this.#DAT = dat;
                },
                get: () => {
                    return this.#DAT;
                }
            }, // DAT
            connect:      {
                value:         async (callback) => {

                    let
                        error = null,
                        data
                    ;

                    try {
                        this.#DAT      = await dapsClient.getDat();
                        // REM : https://nodejs.org/api/tls.html#tlsconnectoptions-callback
                        client.#socket = tls.connect(options.socket, callback);

                        client.#socket.on('connect', (that) => {

                            client.#socket.on('end', (that) => {
                                //debugger;
                                client.emit('end', that);
                            });
                            client.#socket.on('close', (that) => {
                                //debugger;
                                client.emit('close', that);
                            });

                            client.#session = new Session({
                                id:    `${client.#id}session/${uuid.v1()}`,
                                DAT:   client.#DAT,
                                proto: client.#proto,
                                //proto_loaded: client.#proto_loaded,
                                fsm:          fsm,
                                socket:       client.#socket,
                                authenticate: authenticate,
                                startedAt:    util.timestamp(),
                                state:        {type: fsm.state.STATE_CLOSED_UNLOCKED},
                                //
                                timeout_WAIT_FOR_HELLO: timeout_WAIT_FOR_HELLO,
                                timeout_SESSION:        timeout_SESSION
                            });

                            client.#session.on('data', (data) => {
                                client.emit('data', data);
                            });
                            client.#session.on('event', (event) => {
                                client.emit('event', event);
                            });
                            client.#session.on(fsm.state.STATE_ESTABLISHED, (event) => {
                                client.emit(fsm.state.STATE_ESTABLISHED);
                            });

                        }); //  client.#socket.on('connect')

                    } catch (jex) {
                        debugger;
                        error = jex;
                    } // try
                    if (error)
                        throw(error);
                }, enumerable: false
            }, // connect
            write:        {
                value:         async (data) => {
                    try {
                        client.#socket.write(data);
                    } catch (jex) {
                        throw(jex);
                    } // try
                }, enumerable: false
            }, // write
            idscpVersion: {
                value: idscpVersion, enumerable: true
            }
        }); // Object.defineProperties(client)

        return client;

    } // constructor

} // Client

exports.Client = Client;

// EOF