const
    protobuf      = require("protobufjs"),
    //grpc          = require("grpc"),

    //
    util          = require('@nrd/fua.core.util'),
    uuid          = require("@nrd/fua.core.uuid"),
    //
    {Client, fsm} = require(`../src/2/ids.idscp`),
    //region gRPC
    grpc          = require('@grpc/grpc-js'),
    proto_loader  = require('@grpc/proto-loader')
    //endregion gRPC
; // const

module.exports = async ({
                            server:       server,
                            proto:        proto,
                            proto_loaded: proto_loaded,
                            grpc_port:    grpc_port,
                            // client (bob)
                            client_server_tls_certificates: client_server_tls_certificates,
                            client_tls_certificates:        client_tls_certificates,
                            client_connector_certificates:  client_connector_certificates,
                            client_request_cert:            client_request_cert,
                            client_reject_unauthorized:     client_reject_unauthorized,
                            client_daps_schema:             client_daps_schema = "https",
                            client_daps_host:               client_daps_host,
                            client_daps_port:               client_daps_port,
                            client_daps_token_path:         client_daps_token_path,
                            client_daps_jwks_path:          client_daps_jwks_path,
                            client_daps_vc_path:            client_daps_vc_path,
                            client_reconnect:               client_reconnect
                        }) => {

    const
        clients = new Map(),
        rooms   = new Map()
    ; // const

    //region fn

    function heartbeat(timeout = 1, callback) {
        setTimeout(() => {
            callback({
                id:        `${server.id}heartbeat/${uuid.v4()}`,
                type:      "urn:idscp:server:heartbeat",
                timestamp: util.timestamp(),
                timeout:   timeout
            });
            heartbeat(timeout, callback);
        }, (timeout * 1000));
    } // heartbeat()

    async function constructFuaMessage(data) {
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
    } // constructFuaMessage()

    //endregion fn

    server.on('event', (event) => {
        //console.log(JSON.stringify(event, "", "\t"));
    });

    server.on('error', (error) => {
        debugger;
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

        // REM : here we have to do all this application-stuff
        // REM : at this point idscp is up an running, so, 'fsm.state.STATE_ESTABLISHED' is established...
        // - understand, what consumer request.
        // - authorization on given assets

        try {

            let
                proto_message = proto.IdscpMessage,
                decoded       = proto_message.decode(data),
                result
            ;

            if (decoded.fuaMessage) {

                let
                    method,
                    accept,
                    target,
                    ack
                ;
                result = await constructFuaMessage(decoded.fuaMessage);

                if (result.header) {
                    method = result.header.method; // TODO : make those "registered" methods...
                    target = result.header.target; // REM : the requested resource
                    accept = (result.header.accept || "applications/json");
                    ack    = result.header.ack;
                } // if ()

                console.log(`ALICE : on : data : method <${method}> : target <${target}>`);

                switch (method) {
                    case "subscribe":
                        switch (target) {
                            case "urn:idscp:server:heartbeat":
                                // TODO : Access-Control (DACL)
                                let audience = rooms.get(target);
                                if (audience) {
                                    audience.set(session, {
                                        ack:    ack,
                                        accept: accept
                                    });
                                } // if ()
                                break; // urn:idscp:server:heartbeat
                            default:
                                break; // default
                        } // switch(target)
                        break; // subscription
                    default:
                        break; // default
                } // switch(method)

            } else if (decoded.idscpData) {
                debugger;
            } // if()

        } catch (jex) {
            throw(jex);
        } // try

    }); // server.on('data')

    //let done = await server.refreshDAT("default");

    server.listen(async () => {

        heartbeat(1, (data) => {
            //console.log(JSON.stringify(data, "", "\t"));
            let
                audience = rooms.get("urn:idscp:server:heartbeat")
            ;
            if (audience && audience.size > 0) {
                audience.forEach(async (steer, session, map) => {
                    let
                        proto_message = proto.IdscpMessage,
                        message       = proto_message.create({
                            fuaMessage: {
                                header:  [
                                    {name: "Method", value: "publish"},
                                    {name: "Content-Type", value: steer.accept},
                                    {name: "ACK", value: steer.ack}
                                ],
                                payload: Buffer.from(JSON.stringify({error: null, data: data}), 'utf-8')
                            } // fuaMessage
                        }), // message
                        encoded       = proto_message.encode(message).finish(),
                        //decoded     = proto_message.decode(encoded),
                        result        = await session.write(encoded)
                    ; // let
                }); // audience.forEach()
            } // if ()
        }); // heartbeat()
        rooms.set("urn:idscp:server:heartbeat", new Map());

        //region gRPC

        //region fn
        function getHeartbeat(call, callback) {

            const
                sid   = call.metadata.get("sid")?.[0]
            ;
            let
                error = null,
                result
            ;

            if (server.hasSession(sid)) { // REM : core-level of access-control
                result = {
                    id:        `${server.id}heartbeat/${uuid.v4()}`,
                    timestamp: util.timestamp()
                };
            } else {
                error = {code: 404}
            } // if()
            callback(error, result);
        } // getHeartbeat

        function getGrpcServer() {
            let grpc_server = new grpc.Server();
            grpc_server.addService(proto_loaded.heartbeat, {
                get: getHeartbeat
            });
            return grpc_server;
        } // getGrpcServer
        //endregion fn

        const grpc_server = getGrpcServer();

        grpc_server.bindAsync(`${server.host}:${grpc_port}`, grpc.ServerCredentials.createInsecure(), () => {
            grpc_server.start();
        });

        //debugger;
        //endregion gRPC

        //region client BOB
        try {

            let result;

            const
                bob_acks = new Map(),
                bob      = new Client({
                    id:           "idscp://bob.nicos-rd.com/",
                    DAT:          "BOB.123.abc",
                    options:      {
                        cert:   client_connector_certificates,
                        socket: {
                            key:                client_tls_certificates.key,
                            cert:               client_tls_certificates.cert,
                            ca:                 [/** REM : !!!!!!!!!!!!!!!!!!!!!! */ client_server_tls_certificates.ca],
                            requestCert:        client_request_cert,
                            rejectUnauthorized: client_reject_unauthorized,
                            //
                            host: client_daps_host,
                            port: client_daps_port
                        }
                    }, // options
                    proto:        proto,
                    authenticate: async (token) => {
                        let DAT = {requestToken: token};
                        return DAT;
                    }, // authenticate,

                    //region clientDAPS
                    dapsUrl:       `${client_daps_schema}://${client_daps_host}:${client_daps_port}`,
                    dapsTokenPath: client_daps_token_path,
                    dapsJwksPath:  client_daps_jwks_path,
                    dapsVcPath:    client_daps_vc_path,
                    SKIAKI:        client_connector_certificates.meta.SKIAKI,
                    privateKey:    client_connector_certificates.privateKey,
                    //endregion clientDAPS

                    reconnect:              client_reconnect,                                // TODO : implemntation
                    timeout_SESSION:        timeout_SESSION = 10,   // TODO : implemntation
                    timeout_WAIT_FOR_HELLO: 60
                }) // bob = new Client()
            ; // const

            bob.on('event', async (event) => {
                console.log(JSON.stringify(event, "", "\t"));
            });

            bob.on(fsm.state.STATE_ESTABLISHED, async () => {

                bob.on('data', async (data) => {

                    // REM : here we have to do all this application-stuff:
                    // REM : this will ONLY be triggered AFTER successful initial handshake and will work on "real" data, only...
                    // - understand, what consumer request.
                    // - authorization on given assets

                    try {
                        let
                            proto_message = proto.IdscpMessage,
                            decoded       = proto_message.decode(data),
                            result
                        ;

                        if (decoded.fuaMessage) {

                            let
                                method,
                                accept,
                                content_type,
                                target,
                                ack
                            ;
                            result = await constructFuaMessage(decoded.fuaMessage);

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
                            //console.log(JSON.stringify(result, "", "\t"));
                        } else if (decoded.idscpData) {

                        } // if()

                        //console.log(JSON.stringify(decoded.dynamicAttributeToken.token, "", "\t"));

                    } catch (jex) {
                        throw(jex);
                    } // try

                });

                let
                    proto_message            = proto.IdscpMessage,
                    method                   = "subscribe",
                    target                   = "urn:idscp:server:heartbeat",
                    accept                   = "application/json",
                    ack                      = `${bob.id}ack/${uuid.v4()}`,
                    server_heartbeat_message = proto_message.create({
                        fuaMessage: {
                            header: [
                                {name: "Method", value: "subscribe"},
                                {name: "Target", value: "urn:idscp:server:heartbeat"},
                                {name: "Accept", value: "application/json"},
                                {name: "ACK", value: ack}
                            ]
                        }
                    }), // server_heartbeat_message
                    encoded                  = proto_message.encode(server_heartbeat_message).finish(),
                    //decoded     = proto_message.decode(encoded),
                    result                   = await bob.write(encoded)
                ; // let

                console.log(`BOB : request : method <${method}>, target: <${target}>, accept <${accept}>`);

                bob_acks.set(ack, {
                    timeout:  undefined,
                    callback: (error, data) => {
                        //debugger;
                        if (error) {
                            console.log(`BOB : callback : reached : error : <${JSON.stringify(error)}>`);
                            throw(error);
                        }
                        console.log(`BOB : callback : reached : data : <${JSON.stringify(data)}>`);
                    } // callback
                });

                //region grpc (bob as grpc-client)
                const grpc_meta_data = new grpc.Metadata();

                grpc_meta_data.add('sid', bob.sid);
                //grpc_meta_data.add('DAT', bob.DAT);

                const loaded_package = grpc.loadPackageDefinition(proto_loaded);
                const heartbeat_stub = grpc.loadPackageDefinition(proto_loaded).heartbeat;
                const grpc_stub      = new heartbeat_stub(`${server.host}:${grpc_port}`, grpc.credentials.createInsecure());
                let get_result       = await grpc_stub.get({}, grpc_meta_data, (error, result) => {
                    if (error)
                        throw(error);
                    console.log(`BOB : heartbeat.get : result : ${JSON.stringify(result)}`);
                });
                //endregion grpc (bob as grpc-client)

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
            debugger;
            throw(jex);
        } // try
        //endregion client BOB

    }); // server.listen

};

// EOF