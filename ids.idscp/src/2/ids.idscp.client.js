const
    EventEmitter = require('events'),
    tls          = require('tls'),
    //
    util         = require('@nrd/fua.core.util'),
    uuid         = require("@nrd/fua.core.uuid"),
    //
    {fsm}        = require(`./ids.idscp.fsm`),
    idscpVersion = "2"
;

class Client extends EventEmitter {

    #id;
    #proto;
    #socket;

    constructor({
                    id:      id,
                    options: options,
                    proto:   proto
                }) {

        super(); // REM EventEmitter

        this.#id    = id;
        this.#proto = proto;

        let client = this;

        Object.defineProperties(client, {
            id:           {
                value: client.#id, enumerable: true
            },
            connect:      {
                value:         (callback) => {
                    try {
                        // REM : https://nodejs.org/api/tls.html#tlsconnectoptions-callback
                        client.#socket = tls.connect(options.socket, callback);
                        client.#socket.setEncoding('utf8');
                        client.#socket.on('data', (data) => {
                            console.log(data);
                        });
                        client.#socket.on('error', (error) => {
                            console.log(error);
                        });
                        client.#socket.on('end', () => {
                            console.log('server ends connection');
                        });
                    } catch (jex) {
                        throw(jex);
                    } // try
                }, enumerable: false
            }, // connect
            idscpVersion: {
                value: idscpVersion, enumerable: true
            }
        });
        //})();
        return client;
    } // constructor

} // Client

exports.Client = Client;