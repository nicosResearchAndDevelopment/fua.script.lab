const
    EventEmitter = require('events'),
    tls          = require('tls'),
    //
    util         = require('@nrd/fua.core.util'),
    uuid         = require("@nrd/fua.core.uuid"),
    //
    {fsm, wait}  = require(`./ids.idscp.fsm`),
    {Session}    = require(`./ids.idscp.session`),
    idscpVersion = "2"
;

class Client extends EventEmitter {

    #id;
    #DAT;
    #proto;
    #socket;
    #session;

    constructor({
                    id:           id,
                    DAT:          DAT,
                    options:      options,
                    proto:        proto,
                    authenticate: authenticate,
                    //
                    timeout_WAIT_FOR_HELLO = 10
                }) {

        super(); // REM EventEmitter

        this.#id    = id;
        this.#DAT   = DAT;
        this.#proto = proto;

        let client = this;

        Object.defineProperties(client, {
            id:           {
                value: client.#id, enumerable: true
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
                value:         (callback) => {

                    let
                        error = null,
                        data
                    ;

                    try {

                        // REM : https://nodejs.org/api/tls.html#tlsconnectoptions-callback
                        client.#socket = tls.connect(options.socket, callback);

                        //client.#socket.setEncoding('utf8');

                        client.#socket.on('connect', (that) => {

                            client.#socket.on('end', (that) => {
                                //debugger;
                                client.emit('end', that);
                            });
                            client.#socket.on('close', (that) => {
                                debugger;
                                client.emit('close', that);
                            });

                            client.#session = new Session({
                                id:           `${client.#id}session/${uuid.v1()}`,
                                DAT:          client.#DAT,
                                proto:        client.#proto,
                                fsm:          fsm,
                                socket:       client.#socket,
                                authenticate: authenticate,
                                //
                                timeout_WAIT_FOR_HELLO: timeout_WAIT_FOR_HELLO
                            });

                            let
                                message = proto.IdscpHello.create({
                                    version:               idscpVersion,
                                    dynamicAttributeToken: {token: Buffer.from(client.#DAT, 'utf-8')},
                                    supportedRaSuite:      [],
                                    expectedRaSuite:       []
                                }),
                                encoded = proto.IdscpHello.encode(message).finish()
                                //, decoded = proto.IdscpHello.decode(encoded)
                            ;
                            client.#socket.write(encoded);

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
                        error = jex;
                    } // try {
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