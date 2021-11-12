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
    #dapsClient = null;
    #proto;
    #socket;
    #session;
    //#daps_register;

    constructor({
                    id:      id,
                    DAT:     DAT,
                    options: options,
                    proto:   proto,
                    //authenticate: authenticate,
                    //region clientDAPS
                    daps_register: daps_register,
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

        let client = this;

        client.#id            = id;
        client.#DAT           = DAT;
        client.#proto         = proto;
        //client.#daps_register = daps_register;

        client.#dapsClient = new DAPSClient({
            daps_register: daps_register,
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
                    client.#DAT = dat;
                },
                get: () => {
                    return client.#DAT;
                }
            }, // DAT
            connect:      {
                value:         async (callback) => {

                    let
                        error = null,
                        data
                    ;

                    try {

                        client.#DAT = await client.#dapsClient.getDat();

                        // REM : https://nodejs.org/api/tls.html#tlsconnectoptions-callback
                        client.#socket = tls.connect(options.socket, callback);

                        client.#socket.on('connect', (that) => {

                            client.#socket.on('error', (error) => {
                                debugger;
                                client.emit('error', error);
                            });
                            client.#socket.on('end', () => {
                                //debugger;
                                client.emit('end');
                            });
                            client.#socket.on('close', (that) => {
                                //debugger;
                                client.emit('close', that);
                            });

                            client.#session = new Session({
                                id:           `${client.#id}session/${uuid.v1()}`,
                                DAT:          client.#DAT,
                                proto:        client.#proto,
                                fsm:          fsm,
                                socket:       client.#socket,
                                authenticate: async (token) => {
                                    try {
                                        let DAT = undefined;
                                        DAT     = await client.#dapsClient.validateDat(token);
                                        return DAT;
                                    } catch (jex) {
                                        throw(jex);
                                    } // try
                                }, // authenticate
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