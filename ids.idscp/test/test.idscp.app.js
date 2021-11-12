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
                            client_daps_register:           client_daps_register,
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

    server.on(fsm.state.STATE_ESTABLISHED, (session) => {
        // REM : at this point client comes to application level
        //debugger;
        const
            proto_message = proto.IdscpMessage,
            payload       = Buffer.from(JSON.stringify({
                upgrade: {
                    application: [{
                        applicationType: "grpc",
                        version:         "42",
                        service:         [
                            {
                                name: "heartbeat { rpc get(noParameter) returns (FuaHeartbeat) {} }"
                            },
                            {
                                name: "random { rpc stream(RandomRange) returns (stream Random) }"
                            }
                        ] // service
                    }] // application
                } // upgrade
            }), 'utf-8'),
            message       = proto_message.create({
                idscpAppWelcome: {
                    header:  [
                        {name: "idscpVersion", value: session.idscpVersion},
                        {name: "sid", value: session.sid},
                        //
                        {name: "Date", value: (new Date).toUTCString()},
                        {name: "Content-Type", value: "application/json"},
                        {name: "Content-Length", value: `${payload.byteLength}`}
                    ],
                    payload: payload,
                    upgrade: {
                        application: [{
                            applicationType: "grpc",
                            version:         "42",
                            function:        [{
                                name: "heartbeat.get"
                            }]
                        }]
                    }
                }
            }),
            encoded       = proto_message.encode(message).finish()
            //, decoded     = proto_message.decode(encoded)
        ; // const
        session.write(encoded);
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
            switch (decoded.message) {

                case "idscpAppWelcome":
                    console.log(`ALICE : idscpAppWelcome : by <${session.DAT.referringConnector}>, <${JSON.stringify(decoded[decoded.message], "", "\t")}>`);
                    break; // idscpWelcome

                case "idscpData":
                    debugger;
                    break; // idscpData

                //region custom
                case "fuaMessage":
                    console.log(`ALICE : fuaMessage : from <${session.DAT.referringConnector}>, <${JSON.stringify(decoded[decoded.message], "", "\t")}>`);
                    debugger;
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
                    break; // fuaMessage
                //region custom

                default:
                    debugger;
                    break; // default
            } // switch(decoded.message)

        } catch (jex) {
            throw(jex);
        } // try

    }); // server.on('data')

    //let done = await server.refreshDAT("default");

    server.listen(async () => {

        console.log(`ALICE : <${server.id}> : listen on port : ${server.port}`);

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

        function randomStream(call, randomRange) {

            const sid = call.metadata.get("sid")?.[0];
            let error = null;

            function calculate(lower, upper, call) {
                let
                    timeout = (Math.random() * (upper - lower)) + lower,
                    sem     = setTimeout(() => {
                        call.write(/** Random */ {
                            timestamp: util.timestamp(),
                            value:     timeout
                        });
                        calculate(lower, upper, call);
                    }, Math.trunc(timeout * 1000))
                ; // let
            } // calculate()

            if (server.hasSession(sid)) { // REM : core-level of access-control
                calculate(call.request.lower, call.request.upper, call);
            } else {
                call.end();
            } // if()

        } // randomStream()

        function calculateAdd(call, callback) {
            let
                error = null,
                Result
            ;
            call.on('data', function (Values) {
                Result = {type: "xsd:float", value: `${Values.left + Values.right}`};
                //callback(error, Result);
                call.write(Result);
            });
            //call.on('end', function () {
            //    callback(error, Result);
            //});
        }

        function getGrpcServer() {
            let grpc_server = new grpc.Server();
            grpc_server.addService(proto_loaded.heartbeat, {
                get: getHeartbeat
            });
            grpc_server.addService(proto_loaded.random, {
                stream: randomStream
            });
            grpc_server.addService(proto_loaded.calculate, {
                add: calculateAdd
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
        if (true) {
            try {

                let result;

                const
                    bob_acks = new Map(),
                    bob      = new Client({
                        id:      "idscp://bob.nicos-rd.com/",
                        DAT:     "BOB.123.abc",
                        options: {
                            cert:   client_connector_certificates,
                            socket: {
                                key:                client_tls_certificates.key,
                                cert:               client_tls_certificates.cert,
                                ca:                 [/** REM : !!!!!!!!!!!!!!!!!!!!!! */ client_server_tls_certificates.ca],
                                requestCert:        client_request_cert,
                                rejectUnauthorized: client_reject_unauthorized,
                                //
                                //host: `${server.schema}://${server.host}`,
                                host: server.host,
                                port: server.port
                            }
                        }, // options
                        proto:   proto,
                        //authenticate: async (token) => {
                        //    let DAT = {requestToken: token};
                        //    return DAT;
                        //}, // authenticate,

                        //region clientDAPS
                        daps_register: client_daps_register,
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

                    const
                        proto_message = proto.IdscpMessage,
                        //payload       = Buffer.from(JSON.stringify({
                        //    upgrade: {
                        //        application: [{
                        //            applicationType: "grpc",
                        //            version:         "42",
                        //            service:         [
                        //                {
                        //                    name: "heartbeat { rpc get(noParameter) returns (FuaHeartbeat) {} }"
                        //                },
                        //                {
                        //                    name: "random { rpc stream(RandomRange) returns (stream Random) }"
                        //                }
                        //            ] // service
                        //        }] // application
                        //    } // upgrade
                        //}), 'utf-8'),
                        message       = proto_message.create({
                            idscpAppWelcome: {
                                header:  [
                                    {name: "idscpVersion", value: bob.idscpVersion},
                                    //{name: "sid", value: session.sid},
                                    //
                                    {name: "Date", value: (new Date).toUTCString()},
                                    //{name: "Content-Type", value: "application/json"},
                                    {name: "Content-Length", value: `${0}`}
                                ],
                                payload: undefined,
                                //upgrade: {
                                //    application: [{
                                //        applicationType: "grpc",
                                //        version:         "42",
                                //        function:        [{
                                //            name: "heartbeat.get"
                                //        }]
                                //    }]
                                //}
                            }
                        }),
                        encoded       = proto_message.encode(message).finish()
                        , decoded     = proto_message.decode(encoded)
                    ; // const

                    bob.write(encoded);

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

                            switch (decoded.message) {

                                case "idscpAppWelcome":

                                    console.log(`BOB : idscpAppWelcome by <${bob.peerDAT.referringConnector}>, <${JSON.stringify(decoded[decoded.message], "", "\t")}>`);

                                    //region grpc (bob as grpc-client)

                                    const
                                        grpc_server_url = `${server.host}:${grpc_port}`,
                                        grpc_meta_data  = new grpc.Metadata()
                                    ;

                                    grpc_meta_data.add('sid', bob.sid);
                                    //grpc_meta_data.add('DAT', bob.DAT);

                                    const loaded_package = grpc.loadPackageDefinition(proto_loaded);

                                    //const heartbeat = grpc.loadPackageDefinition(proto_loaded).heartbeat;
                                    //const heartbeat_stub      = new heartbeat(grpc_server_url, grpc.credentials.createInsecure());
                                    //let heartbeat_result       = await heartbeat_stub.get({}, grpc_meta_data, (error, result) => {
                                    //    if (error)
                                    //        throw(error);
                                    //    console.log(`BOB : gRPC.heartbeat.get : result : ${JSON.stringify(result)}`);
                                    //});

                                    const
                                        random             = grpc.loadPackageDefinition(proto_loaded).random,
                                        random_stub        = new random(grpc_server_url, grpc.credentials.createInsecure()),
                                        random_stream_call = await random_stub.stream({lower: 0.01, upper: 1.0}, grpc_meta_data)
                                    ;

                                    random_stream_call.on('error', (error) => {
                                        debugger;
                                        console.log(`BOB : random.stream <${grpc_server_url}> : on : error : <${JSON.stringify(error)}>`);
                                    });
                                    random_stream_call.on('end', () => {
                                        console.log(`BOB : random.stream <${grpc_server_url}> : on : end`);
                                    });
                                    random_stream_call.on('status', (status) => {
                                        console.log(`BOB : random.stream <${grpc_server_url}> : on : status : <${JSON.stringify(status)}>`);
                                    });

                                    const
                                        calculate            = grpc.loadPackageDefinition(proto_loaded).calculate,
                                        calculate_stub       = new calculate(grpc_server_url, grpc.credentials.createInsecure())
                                        , calculate_add_call = await calculate_stub.add((error, Result) => {
                                            console.log(`BOB : calculate.add :: callback <${grpc_server_url}> : Result : <${JSON.stringify(Result)}>`);
                                        })
                                    ;
                                    calculate_add_call.on('data', (Result) => {
                                        console.log(`BOB : calculate.add <${grpc_server_url}> : on : data : <${JSON.stringify(Result)}>`);
                                    });
                                    random_stream_call.on('data', (Random) => {
                                        console.log(`BOB : random.stream <${grpc_server_url}> : on : data : <${JSON.stringify(Random)}>`);
                                        //calculate_add_call.write({left: -1, right: Random.value}, (error, Result) => {
                                        //    debugger;
                                        //});
                                        calculate_add_call.write({left: 1, right: Random.value});
                                    });

                                    //debugger;
                                    //endregion grpc (bob as grpc-client)
                                    break; // idscpWelcome

                                //region custom

                                case "fuaMessage":
                                    console.log(`BOB : fuaMessage from <${bob.peerDAT.referringConnector}>, <${JSON.stringify(decoded[decoded.message], "", "\t")}>`);

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
                                        content_type = result.header['Content-Type'];
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
                                    debugger;
                                    break; // fuaMessage

                                //endregion custom

                                default:
                                    break; // default

                            } // switch (decoded['$type'].name

                            //console.log(JSON.stringify(decoded.dynamicAttributeToken.token, "", "\t"));

                        } catch (jex) {
                            throw(jex);
                        } // try

                    }); // bob.on('data')

                    if (false) {

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
                    } // if (shield :: subscribe)

                }); // bob.on(fsm.state.STATE_ESTABLISHED)

                bob.connect(() => {
                    //debugger;
                });
                bob.on('error', (error) => {
                    debugger;
                });
                bob.on('end', () => {
                    debugger;
                });

            } catch (jex) {
                debugger;
                throw(jex);
            } // try
        } // if (shield::BOB)
        //endregion client BOB

    }); // server.listen

};

// EOF