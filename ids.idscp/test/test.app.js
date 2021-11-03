const
    protobuf = require("protobufjs"),
    //
    util     = require('@nrd/fua.core.util'),
    uuid     = require("@nrd/fua.core.uuid"),
    //
    {Client, fsm} = require(`../src/2/ids.idscp`)
; // const

module.exports = async ({
                            server: server,
                            proto:  proto
                        }) => {

    const
        clients                = new Map(),
        rooms                  = new Map()
    ; // const

    //region fn

    function heartbeat(timeout = 1, callback) {
        let semaphore;
        semaphore = setTimeout(() => {
            callback({
                id:        `${server.id}heartbeat/${uuid.v4()}`,
                type:      "urn:idscp:server:heartbeat",
                timestamp: util.timestamp(),
                timeout:   timeout
            });
            heartbeat(timeout, callback);
        }, (timeout * 1000));
    } // heartbeat()

    async function constructIdscpFuaData(data) {
        let
            payload = data.payload,
            result  = {header: {}}
        ;
        try {
            if (data.header && data.header.length > 0) {
                data.header.forEach((entry) => {
                    let name = entry.name.toLowerCase();
                    if (result.header[name])
                        throw(new Error(``));
                    result.header[name] = entry.value;
                }); // data.header.forEach((entry))
            } // if ()
            switch (result.header['content-type']) {
                case "application/json":
                case "application/json+ld":
                    if (payload)
                        result.payload = JSON.parse(payload.toString())
                    break; //
                default:
                    result.payload = data.payload;
                    break; // default
            } // switch (content-type)
            return result;
        } catch (jex) {
            throw (jex);
        } // try
    } // constructIdscpFuaData

    //endregion fn

    server.on('event', (event) => {
        console.log(JSON.stringify(event, "", "\t"));
    });

    server.on('error', (error) => {
        console.log(JSON.stringify(error, "", "\t"));
    });

    server.on('connect', (client) => {
        // REM : at this point client comes to application level
        debugger;
        client.on('data', (data) => {
            debugger;
        });
        clients.set(client.id, client);
    }); // server.on('connect')

    server.on('clientTimeout', (client) => {
        // REM : at this point client comes to application level
        debugger;
        client.on('data', (data) => {
            debugger;
        });
        clients.set(client.id, client);
    }); // server.on('clientTimeout')

    server.on('data', async (session, data) => {

        try {
            let
                proto_message = proto.IdscpMessage,
                decoded       = proto_message.decode(data),
                result
            ;

            if (decoded.idscpFuaData) {

                let
                    method,
                    accept,
                    target,
                    ack
                ;
                result = await constructIdscpFuaData(decoded.idscpFuaData);

                if (result.header) {
                    method = result.header.method;
                    target = result.header.target;
                    accept = (result.header.accept || "applications/json");
                    ack    = result.header.ack;
                } // if ()

                switch (method) {
                    case "subscribe":
                        switch (target) {
                            case "urn:server:heartbeat":
                                // TODO : Access-Control (DACL)
                                let audience = rooms.get(target);
                                if (audience) {
                                    audience.set(session, {
                                        ack:    ack,
                                        accept: accept
                                    });
                                } // if ()
                                break; // urn:server:heartbeat
                            default:
                                break; // default
                        } // switch(target)
                        break; // subscription
                    default:
                        break; // default
                } // switch(method)

                console.log(JSON.stringify(result, "", "\t"));
            } else if (decoded.idscpData) {

            } // if()

            // REM : here we have to do all this application-stuff:
            // - understand, what consumer request.
            // - authorization on given assets

        } catch (jex) {
            throw(jex);
        } // try

    }); // server.on('data')

    const
        server_tls_certificates       = require(`./cert/server/tls-server/server.js`),
        client_tls_certificates       = require(`./cert/client/tls-server/server.js`),
        client_connector_certificates = require(`./cert/client/connector/client.js`)
    ;

    server.listen(async () => {

        heartbeat(1, (data) => {
            console.log(JSON.stringify(data, "", "\t"));
            let
                audience = rooms.get("urn:server:heartbeat")
            ;
            if (audience && audience.size > 0) {
                audience.forEach(async (steer, session, map) => {
                    //debugger;
                    let
                        proto_message = proto.IdscpMessage,
                        message       = proto_message.create({
                            idscpFuaData: {
                                header:  [
                                    {name: "Method", value: "publish"},
                                    {name: "Content-Type", value: steer.accept},
                                    {name: "ACK", value: steer.ack}
                                ],
                                payload: Buffer.from(JSON.stringify({error: null, data: data}), 'utf-8')
                            }
                        }),
                        encoded       = proto_message.encode(message).finish(),
                        //decoded     = proto_message.decode(encoded),
                        result        = await session.write(encoded)
                    ;
                })
                ;
            } // if ()
        });

        rooms.set("urn:server:heartbeat", new Map());

        //region client BOB
        try {

            let result;

            const
                bob_acks = new Map(),
                bob      = new Client({
                    id:           "tls://bob.nicos-rd.com/",
                    DAT:          "BOB.123.abc",
                    options:      {
                        cert:   client_connector_certificates,
                        socket: {
                            key:                client_tls_certificates.key,
                            cert:               client_tls_certificates.cert,
                            ca:                 [/** REM : !!!!!!!!!!!!!!!!!!!!!! */ server_tls_certificates.ca],
                            requestCert:        false,
                            rejectUnauthorized: false,
                            //
                            host: "alice.nicos-rd.com",
                            port: 8080
                        }
                    }, // options
                    proto:        proto,
                    authenticate: async (token) => {
                        let DAT = {requestToken: token};
                        return DAT;
                    }, // authenticate,
                    //
                    reconnect:              true,                                // TODO : implemntation
                    timeout_SESSION:        timeout_SESSION = 10,   // TODO : implemntation
                    timeout_WAIT_FOR_HELLO: 60
                })
            ; // const

            bob.on('event', async (event) => {
                console.log(JSON.stringify(event, "", "\t"));
            });

            bob.on(fsm.state.STATE_ESTABLISHED, async () => {

                // REM : this will ONLY be triggered AFTER successful initial handshake and will work on "real" data, only...
                bob.on('data', async (data) => {

                    try {
                        let
                            proto_message = proto.IdscpMessage,
                            decoded       = proto_message.decode(data),
                            result
                        ;

                        if (decoded.idscpFuaData) {

                            let
                                method,
                                accept,
                                content_type,
                                target,
                                ack
                            ;
                            result = await constructIdscpFuaData(decoded.idscpFuaData);

                            if (result.header) {
                                method       = result.header.method;
                                target       = result.header.target;
                                accept       = (result.header.accept || "applications/json");
                                content_type = result.header['content-type'];
                                ack          = result.header.ack;
                            } // if ()

                            switch (method) {
                                case "publish":
                                    let _ack = bob_acks.get(ack);
                                    if (_ack) {
                                        _ack.callback(result.payload.error, result.payload.data);
                                    } // if ()
                                    break; // publish
                                default:
                                    break; // default
                            } // switch(method)

                            console.log(JSON.stringify(result, "", "\t"));
                        } else if (decoded.idscpData) {

                        }// if()

                        //console.log(JSON.stringify(decoded.dynamicAttributeToken.token, "", "\t"));
                        // REM : here we have to do all this application-stuff:
                        // - understand, what consumer request.
                        // - authorization on given assets
                    } catch (jex) {
                        throw(jex);
                    } // try

                });

                let
                    proto_message            = proto.IdscpMessage,
                    message                  = proto_message.create({
                        idscpFuaData: {
                            header:  [{name: "Content-Type", value: "application/json"}],
                            payload: Buffer.from(JSON.stringify({ge: "nau"}), 'utf-8')
                        }
                    }),
                    ack                      = `${bob.id}ack/${uuid.v4()}`,
                    server_heartbeat_message = proto_message.create({
                        idscpFuaData: {
                            header: [
                                {name: "Method", value: "subscribe"},
                                {name: "target", value: "urn:server:heartbeat"},
                                {name: "Accept", value: "application/json"},
                                {name: "ACK", value: ack}
                            ]
                        }
                    }),
                    encoded                  = proto_message.encode(server_heartbeat_message).finish(),
                    //decoded     = proto_message.decode(encoded),
                    result                   = await bob.write(encoded)
                ;
                bob_acks.set(ack, {
                    timeout:  undefined,
                    callback: (error, data) => {
                        //debugger;
                        if (error)
                            throw(error);
                        console.log(JSON.stringify(data));
                    } // callback
                });
                //debugger;
            }); // bob.on(fsm.state.STATE_ESTABLISHED)
            bob.connect((error, data) => {
                //debugger;
            });
            bob.on('error', (error) => {
                debugger;
            });
            bob.on('end', async (that) => {
                debugger;
            });
            bob.on('error', (error) => {
                debugger;
            });

        } catch (jex) {
            throw(jex);
        } // try
        //endregion client BOB

    }); // server.listen

};

// EOF