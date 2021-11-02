const
    fs           = require("fs"),
    path         = require('path'),
    EventEmitter = require('events'),
    tls          = require('tls'),
    //
    //protobuf     = require("protobufjs"),
    //
    util         = require('@nrd/fua.core.util'),
    uuid         = require("@nrd/fua.core.uuid"),
    //
    {fsm, wait}  = require(`./ids.idscp.fsm`),
    idscpVersion = 2
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
                //debugger;
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
                            timeout,
                            _message = proto.IdscpHello.decode(data),
                            _token   = _message.dynamicAttributeToken.token.toString('utf-8'),
                            peerDAT  = await authenticate(_token)
                        ;

                        if (peerDAT) {
                            session.#state.timeout(/** default */ -1);

                            let message_ = proto.IdscpHello.create({
                                    version:               idscpVersion,
                                    dynamicAttributeToken: {token: Buffer.from(session.#DAT, 'utf-8')},
                                    //dynamicAttributeToken: {token: Buffer.from("ALICE.6969696969669.genau", 'utf-8')},
                                    supportedRaSuite: [],
                                    expectedRaSuite:  []
                                }),
                                encoded_ = await proto.IdscpHello.encode(message_).finish()
                                //, _decoded = await proto.IdscpHello.decode(encoded_)
                            ;
                            session.#socket.write(encoded_);

                            session.#DAT = peerDAT;

                            // TODO : DAT.exp? internal seesion timeout?
                            timeout        = timeout_SESSION;
                            session.#state = {
                                type:    fsm.state.STATE_ESTABLISHED,
                                timeout: wait(timeout /** seconds */, () => {
                                    //debugger;
                                    session.#state.type = fsm.state.STATE_CLOSED_LOCKED;
                                    //session.#DAT;
                                    session.#socket.end();
                                    session.#socket = null;
                                    //session.emit('event', {
                                    //    id:        `${session.#id}event/${uuid.v1()}`,
                                    //    timestamp: util.timestamp(),
                                    //    prov:      `${session.#id}session/state/timeout/}`,
                                    //    step:      "STATE_ESTABLISHED"
                                    //});
                                })
                            }; // this.#state

                            //session.emit('event', {
                            //    id:        `${session.#id}event/${uuid.v1()}`,
                            //    timestamp: util.timestamp(),
                            //    prov:      `${session.#id}listen/}`,
                            //    step:      "STATE_ESTABLISHED",
                            //    event:     fsm.state.STATE_ESTABLISHED
                            //});
                            session.emit(fsm.state.STATE_ESTABLISHED, session);

                        } // if
                        break; // fsm.state.STATE_WAIT_FOR_HELLO

                    case fsm.state.STATE_ESTABLISHED:
                        // REM : present it the main "application-layer" as real payload...
                        session.emit('data', data);
                        break; // fsm.state.STATE_ESTABLISHED

                    default:
                        debugger;
                        break; // default

                } // switch(this.#state)

            } catch (jex) {
                throw(jex);
            } // try
        }); // this.#socket.on('data')

        return session;

    } // constructor

} // Session

exports.Session = Session;