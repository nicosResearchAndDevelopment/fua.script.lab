const
    fs           = require("fs"),
    path         = require('path'),
    EventEmitter = require('events'),
    tls          = require('tls'),
    //
    util         = require('@nrd/fua.core.util'),
    uuid         = require("@nrd/fua.core.uuid"),
    //
    {fsm, wait, idscpVersion}  = require(`./ids.idscp.fsm`)
;

class Session extends EventEmitter {

    #id;
    #state;
    #DAT;
    #socket;

    constructor({
                    id:           id,
                    DAT:          DAT,
                    fsm:          fsm,
                    proto:        proto,
                    socket:       socket,
                    authenticate: authenticate,
                    reconnect:    reconnect = false,                                // TODO : implementation
                    // REM : seconds
                    timeout_WAIT_FOR_HELLO = 5,
                    timeout_SESSION = 5 /** seconds */
                }) {

        super(); // REM : EventEmitter

        let session = this;

        session.#id    = id;
        session.#state = {
            type:    fsm.state.STATE_WAIT_FOR_HELLO,
            timeout: wait(timeout_WAIT_FOR_HELLO /** seconds */, () => {
                if (session.#socket)
                    session.#socket.end();
                session.#socket = null;
            })
        };

        session.#DAT    = DAT;
        session.#socket = socket;

        Object.defineProperties(session, {
            id:    {
                value: session.#id, enumerable: true
            },
            state: {
                get:           () => {
                    return session.#state;
                }, enumerable: true
            },
            DAT:   {
                get:           () => {
                    return session.#DAT;
                }, enumerable: true
            },
            write: {
                value:         async (data) => {
                    if (session.#socket)
                        session.#socket.write(data);
                }, enumerable: false
            }, // write
            quit:  {
                value:         () => {
                    if (session.#socket)
                        session.#socket.end();
                }, enumerable: false
            } // quit
        }); // Object.defineProperties()

        session.#socket.on('data', async (data) => {
            try {
                let
                    error = null
                ;

                switch (session.#state.type) {

                    case fsm.state.STATE_WAIT_FOR_HELLO:

                        let
                            timeout
                        ;
                        const
                            proto_message = proto.IdscpMessage,
                            decoded       = proto_message.decode(data)
                        ;

                        if (decoded.idscpHello) {
                            let
                                _token  = decoded.idscpHello.dynamicAttributeToken.token.toString('utf-8'),
                                peerDAT = await authenticate(_token)
                            ;
                            if (peerDAT) {
                                session.#state.timeout(/** default */ -1); // REM : kills given timeout for 'STATE_WAIT_FOR_HELLO'
                                // TODO : DAT.exp? internal session-timeout?
                                timeout        = undefined; // timeout_SESSION;
                                session.#state = {
                                    type:    fsm.state.STATE_ESTABLISHED
                                };
                                if (timeout)
                                    session.#state.timeout = wait(timeout /** seconds */, () => {
                                        session.#state.type = fsm.state.STATE_CLOSED_LOCKED;
                                        session.#socket.end();
                                        session.#socket = null;
                                    });
                                session.emit(fsm.state.STATE_ESTABLISHED, session);
                            } // if()
                        } // if()
                        break; // fsm.state.STATE_WAIT_FOR_HELLO
                    case fsm.state.STATE_ESTABLISHED:
                        // REM : present it the main "application-layer" as real payload...
                        session.emit('data', data);
                        break;
                    default:
                        debugger;
                        break; // default
                } // switch(session.#state)

            } catch (jex) {
                throw(jex);
            } // try
        }); // session.#socket.on('data')

        let
            proto_message = proto.IdscpMessage,
            message       = proto_message.create({
                idscpHello: {
                    version:               idscpVersion,
                    dynamicAttributeToken: {token: Buffer.from(session.#DAT, 'utf-8')},
                    supportedRaSuite:      [],
                    expectedRaSuite:       []
                }
            }),
            encoded       = proto_message.encode(message).finish()
        ; // let

        session.#socket.write(encoded);

        return session; // REM : this

    } // constructor

} // Session

exports.Session = Session;

// EOF