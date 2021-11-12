const
    fs                        = require("fs"),
    path                      = require('path'),
    crypto                    = require("crypto"),
    EventEmitter              = require('events'),
    tls                       = require('tls'),
    //
    util                      = require('@nrd/fua.core.util'),
    uuid                      = require("@nrd/fua.core.uuid"),
    //
    {fsm, wait, idscpVersion} = require(`./ids.idscp.fsm`)
;

//region fn

function sha256(data) {
    return crypto.createHash("sha256").update(data, "binary").digest("base64");
    //                                               ------  binary: hash the byte string
}

//function IdscpAck(socket) {
//    socket.write(message);
//}

//endregion fn

class Session extends EventEmitter {

    #id;
    #sid = null; // REM : !!!
    #proto;
    #state;
    #DAT;
    #socket;

    constructor({
                    id:           id,
                    sid:          sid = null, // REM : !!!
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

        session.#id  = id;
        session.#sid = sid;

        session.#state = {
            type:    fsm.state.STATE_WAIT_FOR_HELLO,
            timeout: wait(timeout_WAIT_FOR_HELLO /** seconds */, () => {
                if (session.#socket)
                    session.#socket.end();
                session.#socket = null;
            })
        };

        session.#proto  = proto;
        session.#DAT    = DAT;
        session.#socket = socket;

        Object.defineProperties(session, {
            id:    {
                value: session.#id, enumerable: true
            },
            sid:   {
                get:           () => {
                    return session.#sid;
                }, enumerable: true
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
                //console.log(`${session.id} : data <${data.toString()}>`);
                let
                    is_client = false,
                    error = null
                ;

                switch (session.#state.type) {

                    case fsm.state.STATE_WAIT_FOR_HELLO:

                        let
                            timeout
                        ;
                        const
                            proto_message = session.#proto.IdscpMessage,
                            decoded       = proto_message.decode(data)
                        ;

                        if (decoded.idscpHello) {
                            let
                                _token  = decoded.idscpHello.dynamicAttributeToken.token.toString('utf-8'),
                                peerDAT = await authenticate(_token)
                            ;
                            if (peerDAT) {
                                if (!session.#sid && decoded.idscpHello.sid)
                                    session.#sid = decoded.idscpHello.sid;
                                session.#state.timeout(/** default */ -1); // REM : kills given timeout for 'STATE_WAIT_FOR_HELLO'
                                // TODO : DAT.exp? internal session-timeout?
                                timeout        = undefined; // timeout_SESSION;
                                session.#state = {
                                    type: fsm.state.STATE_ESTABLISHED
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
                debugger;
                throw(jex);
            } // try
        }); // session.#socket.on('data')

        const
            proto_message = proto.IdscpMessage,
            message       = proto_message.create({
                idscpHello: {
                    sid:                   session.#sid,
                    version:               idscpVersion,
                    dynamicAttributeToken: {token: Buffer.from(session.#DAT, 'utf-8')},
                    //dynamicAttributeToken: {token: Buffer.from("abc.123.def", 'utf-8')},
                    supportedRaSuite: [],
                    expectedRaSuite:  []
                }
            }),
            encoded       = proto_message.encode(message).finish()
            //, decoded = proto_message.decode(encoded)
        ; // const

        session.#socket.write(encoded);

        return session; // REM : this

    } // constructor

} // Session

exports.Session = Session;

// EOF