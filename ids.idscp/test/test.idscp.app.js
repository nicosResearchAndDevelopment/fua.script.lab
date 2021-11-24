const
    crypto                   = require('crypto'),
    protobuf                 = require("protobufjs"),
    http                     = require('https'),
    //
    fetch                    = require('node-fetch'),
    express                  = require('express'),
    bodyParser               = require('body-parser'),
    //region WebSocket
    WebSocketServer          = require('websocket').server,
    WebSocketClient          = require('websocket').client,
    WebSocketConnection      = require('websocket').connection,
    //endregion WebSocket
    //region gRPC
    grpc                     = require('@grpc/grpc-js'),
    proto_loader             = require('@grpc/proto-loader'),
    //endregion gRPC
    //
    util                     = require('@nrd/fua.core.util'),
    uuid                     = require("@nrd/fua.core.uuid"),
    //
    {Client, fsm, idscpUtil} = require(`../src/2/ids.idscp`)
;

module.exports = async ({
                            server:       idscp_server,
                            proto:        proto,
                            proto_loaded: proto_loaded,
                            grpc_port:    grpc_port,
                            //region http
                            http_port: http_port = "8042",
                            //endregion http
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

    let http_server = null;

    // TODO : shield by config
    if (true) {
        const
            user_symbol = Symbol("user"),
            app         = express()
        ;
        http_server     = http.createServer({
            key:                idscp_server.tls_options.key,
            cert:               idscp_server.tls_options.cert,
            ca:                 idscp_server.tls_options.ca,
            requestCert:        idscp_server.tls_options.requestCert,
            rejectUnauthorized: idscp_server.tls_options.rejectUnauthorized
        }, app);

        http_server.on('connection', (socket) => {
            //debugger;
        });
        app.use(async (request, response, next) => {
            // TODO : this is the point to log the most....
            const user = idscp_server.getUser(request.headers.sid);
            if (user) { // REM : core-level of access-control
                request[user_symbol] = user;
                next();
            } else {
                // TODO : wend error or whatever...
                response.end();
            } // if ()
        });
        app.get('/heartbeat', async (request, response, next) => {
            if (await hasAccess({user: request[user_symbol], resource: `https://${idscp_server.host}${request.url}`})) {
                const payload = JSON.stringify(a_heartbeat(42));
                response.setHeader('Content-Type', 'application/json');
                response.setHeader('Date', (new Date).toUTCString());
                response.setHeader('Content-Length', `${`${Buffer.from(payload, 'utf-8').length}`}`);
                response.write(payload);
                response.end();
            } else {
                response.end();
            } // if
        }); // app.get('/heartbeat')

        if (/** WebSocket */ true) {

            //region fn
            function originIsAllowed(origin) {
                // put logic here to detect whether the specified origin is allowed.
                return true;
            }

            //endregion fn
            const ws_server = new WebSocketServer({
                httpServer: http_server,
                // You should not use autoAcceptConnections for production
                // applications, as it defeats all standard cross-origin protection
                // facilities built into the protocol and the browser.  You should
                // *always* verify the connection's origin and decide whether or not
                // to accept it.
                autoAcceptConnections: false
            });

            ws_server.on('request', function (ws_request) {

                let ws_connection;

                if (!originIsAllowed(ws_request.origin)) {
                    // Make sure we only accept requests from an allowed origin
                    console.log(`ALICE : ws : connection from origin <${ws_request.origin}> rejected.`);
                    ws_request.reject();
                    return;
                } // if ()

                const
                    headers = (ws_request?.httpRequest?.headers || {}),
                    user    = idscp_server.getUser(headers.sid)
                    ///** BAD sid */ user = idscp_server.getUser(headers.sid + "_42")
                ;

                ws_connection = ws_request.accept('echo-protocol', ws_request.origin)
                if (user) {
                    //debugger;
                    console.log(`ALICE : ws : connection accepted : user <${user.id}>.`);

                    ws_connection.on('message', function (message) {
                        if (message.type === 'utf8') {
                            console.log(`ALICE : ws : received message (utf-8) <${message.utf8Data}>`);
                            //debugger;
                            ws_connection.sendUTF(message.utf8Data);
                        } else if (message.type === 'binary') {
                            console.log(`ALICE : ws : received message (binary), length <${message.binaryData.length}> bytes.`);
                            //debugger;
                            ws_connection.sendBytes(message.binaryData);
                        } // if ()
                    }); // ws_connection.on('message')
                } else {
                    ws_connection.close(WebSocketConnection.CLOSE_REASON_GOING_AWAY, `nix da!!!`);
                } // if ()
                ws_connection.on('close', function (reasonCode, description) {
                    console.log(`ALICE : ws : peer <${ws_connection.remoteAddress}> disconnected.`);
                    debugger;
                });

            }); // ws_server.on('request')

        } // if (WebSocket shield)

    } // if (shield)

    //region fn

    //region fn : top-level
    async function hasAccess({
                                 user:     user,
                                 resource: resource
                             }) {
        let
            error  = null,
            result = false
        ;
        try {

            let access = true;
            if (access) { // REM : core-level of access-control
                result = true;
            } else {
                error = {code: -1}
            } // if()
        } catch (jex) {
            throw(jex);
        } // try
        if (error)
            throw(error);
        return result;
    } // hasAccess()

    //endregion fn : top-level

    function a_heartbeat(timeout) {
        return {
            id:        `${idscp_server.id}heartbeat/${uuid.v4()}`,
            type:      "urn:idscp:idscp_server:heartbeat",
            timestamp: util.timestamp(),
            timeout:   timeout
        };
    }

    function heartbeat(timeout = 1, callback) {
        setTimeout(() => {
            callback(a_heartbeat(timeout));
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

    idscp_server.on('event', (event) => {
        //console.log(JSON.stringify(event, "", "\t"));
    });

    idscp_server.on('error', (error) => {
        debugger;
        console.log(JSON.stringify(error, "", "\t"));
    });

    idscp_server.on('connection', (session) => {
        // REM : at this point client comes to application level
        //debugger;
        //client.on('data', (data) => {
        //    debugger;
        //});
        clients.set(session.sid, session);
    }); // idscp_server.on('connect')

    idscp_server.on('clientTimeout', (client) => {
        // REM : at this point client comes to application level
        debugger;
        client.on('data', (data) => {
            debugger;
        });
        clients.set(client.id, client);
    }); // idscp_server.on('clientTimeout')

    idscp_server.on(fsm.state.STATE_ESTABLISHED, (session) => {
        // REM : at this point client comes to application level
        //debugger;
        let payload = {
                upgrade: {
                    application: [
                        {
                            applicationType: "grpc",
                            version:         "42",
                            port:            `${grpc_port}`,
                            service:         [
                                {
                                    name: "heartbeat"
                                },
                                {
                                    name: "random"
                                }
                            ] // service
                        }

                    ] // application
                } // upgrade
            } //
        ; // let

        // TODO : access-control to http-server
        if (http_server) {
            payload.upgrade.application.push({
                applicationType: "https",
                port:            `${http_port}`,
                version:         "424242",
                service:         [] // service
            });
        } // if ()

        const
            proto_message = proto.IdscpMessage,
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
                    payload: Buffer.from(JSON.stringify(payload), 'utf-8')
                }
            }),
            encoded       = proto_message.encode(message).finish()
            //, decoded     = proto_message.decode(encoded)
        ; // const
        session.write(encoded);

        // TODO : here we have to find out if given user is allowed to use http
        //if (http_server)
        //    http_server.emit('connection', session.socket);

    }); // idscp_server.on(fsm.state.STATE_ESTABLISHED)

    idscp_server.on('data', async (session, data) => {

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

    }); // idscp_server.on('data')

    //let done = await idscp_server.refreshDAT("default");

    idscp_server.listen(async () => {

        console.log(`ALICE : <${idscp_server.id}> : listen on port : ${idscp_server.port}`);

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

        function heartbeat_get(call, callback) {

            const
                sid   = call.metadata.get("sid")?.[0]
            ;
            let
                error = null,
                result
            ;

            if (idscp_server.hasSession(sid)) { // REM : core-level of access-control
                result = {
                    id:        `${idscp_server.id}heartbeat/${uuid.v4()}`,
                    timestamp: util.timestamp()
                };
            } else {
                error = {code: -1}
            } // if()
            callback(error, result);

        } // heartbeat_get()

        function random_stream(call, randomRange) {

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

            if (idscp_server.hasSession(sid)) { // REM : core-level of access-control
                calculate(call.request.lower, call.request.upper, call);
            } else {
                call.end();
            } // if()

        } // random_stream()

        function calculate_add(call, callback) {
            let
                error = null,
                MetaValue
            ;
            //if (idscp_server.hasSession(sid)) { // REM : core-level of access-control
            call.on('data', function (CalculateParameter) {
                if (idscp_server.hasSession(CalculateParameter.sid)) {
                    MetaValue = {
                        id:                     `${idscp_server.id}result/${uuid.v4()}`,
                        prov:                   CalculateParameter.id,
                        timestamp:              util.timestamp(),
                        value:     /** Value */ {
                            type:  "xsd:float",
                            value: `${CalculateParameter.left + CalculateParameter.right}`
                        }
                    };
                    //callback(error, Result);
                    call.write(MetaValue);
                } else {
                    call.end();
                } // if ()
            }); // call.on('data')
        } // calculate_add()

        //region time
        function time_constraint(call, callback) {

            const
                sid   = call.metadata.get("sid")?.[0]
            ;
            let
                error = null,
                Value
            ;

            if (idscp_server.hasSession(sid)) { // REM : core-level of access-control
                Value = {
                    type:  "xsd:boolean",
                    value: "true"
                };
            } else {
                error = {code: -1}
            } // if()
            callback(error, Value);
        } // time_constraint

        function time_before(call, callback) {
            const
                sid   = call.metadata.get("sid")?.[0]
            ;
            let
                error = null,
                Value
            ;

            if (idscp_server.hasSession(sid)) { // REM : core-level of access-control
                Value = {
                    type:  "xsd:boolean",
                    value: "true"
                };
            } else {
                error = {code: -1}
            } // if()
            callback(error, Value);
        } // time_before()

        //endregion time

        function getGrpcServer() {
            let grpc_server = new grpc.Server();
            grpc_server.addService(proto_loaded.heartbeat, {
                get: heartbeat_get
            });
            grpc_server.addService(proto_loaded.random, {
                stream: random_stream
            });
            grpc_server.addService(proto_loaded.calculate, {
                add: calculate_add
            });
            grpc_server.addService(proto_loaded.time, {
                constraint: time_constraint,
                before:     time_before
            });
            return grpc_server;
        } // getGrpcServer()

        //endregion fn

        const grpc_server = getGrpcServer();

        grpc_server.bindAsync(`${idscp_server.host}:${grpc_port}`, grpc.ServerCredentials.createInsecure(), () => {
            grpc_server.start();
        });

        //debugger;

        //region http

        // TODO : DELETE : idscp_server.http_server = http_server;

        if (http_server) {
            http_server.listen(http_port, () => {
                console.log(`ALICE : http server listening on port <${http_port}>`);
                //debugger;
            });
        } // if ()
        //endregion http

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
                                //host: `${idscp_server.schema}://${idscp_server.host}`,
                                host: idscp_server.host,
                                port: idscp_server.port
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
                        payload       = undefined,
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
                                payload: payload
                            }
                        }),
                        encoded       = proto_message.encode(message).finish()
                        //, decoded     = proto_message.decode(encoded)
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

                                    const
                                        message_header  = idscpUtil.getProtoHeader(decoded[decoded.message].header),
                                        grpc_server_url = `${idscp_server.host}:${grpc_port}`,
                                        grpc_meta_data  = new grpc.Metadata()
                                    ;
                                    let message_payload;

                                    if (decoded[decoded.message].payload) {
                                        // TODO : Content-Typing...
                                        message_payload = JSON.parse(decoded[decoded.message].payload.toString());
                                        // TODO : fetch gRPC-port
                                        //debugger;
                                    } // if ()

                                    if (message_header.sid)
                                        if (bob.peerDAT?.custom && bob.peerDAT.custom.sid_hash_alg) {
                                            bob.sid = crypto.createHash(bob.peerDAT.custom.sid_hash_alg.toLowerCase()).update(((bob.peerDAT.custom.sid_hash_salt) ? `${message_header.sid}${bob.peerDAT.custom.sid_hash_salt}` : message_header.sid), 'utf8').digest('hex');
                                        } else {
                                            bob.sid = message_header.sid;
                                        } // if ()

                                    //region https (bob as http-client)
                                    if (/** https client */ false) {
                                        const
                                            http_request_agent = new http.Agent({
                                                key:                client_tls_certificates.key, // options.socket.key,
                                                cert:               client_tls_certificates.cert,
                                                ca:                 client_server_tls_certificates.ca, // /** REM : !!!!!!!!!!!!!!!!!!!!!! */ client_server_tls_certificates.ca],
                                                requestCert:        client_tls_certificates.requestCert,
                                                rejectUnauthorized: client_tls_certificates.rejectUnauthorized
                                            }),
                                            http_server_url    = `https://${idscp_server.host}:${http_port}`,
                                            response_raw       = await fetch(`${http_server_url}/heartbeat`, {
                                                agent:   http_request_agent,
                                                method:  'GET',
                                                headers: {
                                                    'sid': bob.sid
                                                } // headers
                                            }),
                                            response_json      = await response_raw.json()
                                        ; // const
                                        console.log(`BOB : http <${http_server_url}> GET : heartbeat : <${JSON.stringify(response_json)}>`);

                                        //debugger;
                                    } // if (/** https client */ false)
                                    //endregion https (bob as http-client)

                                    //region WebSocket client (bob as WebSocketClient)
                                    const
                                        ws_agent           = new http.Agent({
                                            key:                client_tls_certificates.key, // options.socket.key,
                                            cert:               client_tls_certificates.cert,
                                            ca:                 client_server_tls_certificates.ca, // /** REM : !!!!!!!!!!!!!!!!!!!!!! */ client_server_tls_certificates.ca],
                                            requestCert:        client_tls_certificates.requestCert,
                                            rejectUnauthorized: client_tls_certificates.rejectUnauthorized
                                        }),
                                        ws_client          = new WebSocketClient(),
                                        ws_server_url      = `ws://${idscp_server.host}:${http_port}`,
                                        ws_http_server_url = `https://${idscp_server.host}:${http_port}`
                                    ; // const

                                    ws_client.on('connectFailed', function (error) {
                                        console.log(`BOB : ws : connect error : <${error.toString()}>`);
                                        debugger;
                                    });

                                    ws_client.on('connect', function (ws_connection) {

                                        console.log(`BOB : ws : websocket client connected.`);

                                        ws_connection.on('message', function (message) {
                                            if (message.type === 'utf8') {
                                                console.log(`BOB : ws : received (utf-8) <${message.utf8Data}>`);
                                            } else {
                                                debugger;
                                            } // if ()
                                        });
                                        ws_connection.on('error', function (error) {
                                            console.log(`BOB : ws : connection error : <${error.toString()}>`);
                                            debugger;
                                        });
                                        ws_connection.on('close', function () {
                                            console.log(`BOB : ws : connection closed 'echo-protocol'`);
                                            debugger;
                                        });

                                        function sendNumber() {
                                            if (ws_connection.connected) {
                                                let number = Math.round(Math.random() * 0xFFFFFF);
                                                ws_connection.sendUTF(number.toString());
                                                setTimeout(sendNumber, 1000);
                                            } // if ()
                                        } // sendNumber()
                                        sendNumber();
                                    });

                                    //ws_client.connect(ws_server_url, 'echo-protocol');
                                    ws_client.connect(ws_server_url, 'echo-protocol', ws_http_server_url,
                                        /** headers */  {
                                            sid: bob.sid
                                        },
                                        /** requestOptions */ {
                                            protocol: "https:",
                                            host:     idscp_server.host,
                                            port:     http_port,
                                            agent:    ws_agent
                                        }
                                    ); // ws_client.connect()

                                    //endregion WebSocket client  (bob as WebSocketClient)

                                    //region grpc (bob as grpc-client)

                                    grpc_meta_data.add('sid', bob.sid);

                                    const loaded_package = grpc.loadPackageDefinition(proto_loaded);

                                    //const heartbeat = grpc.loadPackageDefinition(proto_loaded).heartbeat;
                                    //const heartbeat_stub      = new heartbeat(grpc_server_url, grpc.credentials.createInsecure());
                                    //let heartbeat_result       = await heartbeat_stub.get({}, grpc_meta_data, (error, result) => {
                                    //    if (error)
                                    //        throw(error);
                                    //    console.log(`BOB : gRPC.heartbeat.get : result : ${JSON.stringify(result)}`);
                                    //});

                                    const
                                        random             = loaded_package.random,
                                        random_stub        = new random(grpc_server_url, grpc.credentials.createInsecure()),
                                        random_stream_call = await random_stub.stream({
                                            lower: 0.01,
                                            upper: 1.0
                                        }, grpc_meta_data)
                                    ;

                                    random_stream_call.on('error', (error) => {
                                        debugger;
                                        console.log(`BOB : gRPC : random.stream <${grpc_server_url}> : on : error : <${JSON.stringify(error)}>`);
                                    });
                                    random_stream_call.on('end', () => {
                                        console.log(`BOB : gRPC : random.stream <${grpc_server_url}> : on : end`);
                                    });
                                    random_stream_call.on('status', (status) => {
                                        console.log(`BOB : gRPC : random.stream <${grpc_server_url}> : on : status : <${JSON.stringify(status)}>`);
                                    });

                                    const
                                        calculate            = loaded_package.calculate,
                                        calculate_stub       = new calculate(grpc_server_url, grpc.credentials.createInsecure())
                                        , calculate_add_call = await calculate_stub.add((error, Result) => {
                                            console.log(`BOB : calculate.add :: callback <${grpc_server_url}> : Result : <${JSON.stringify(Result)}>`);
                                        }, grpc_meta_data)
                                    ;
                                    calculate_add_call.on('data', (MetaValue) => {
                                        console.log(`BOB : gRPC : calculate.add <${grpc_server_url}> : on : data : <${JSON.stringify(MetaValue)}>`);
                                    });
                                    random_stream_call.on('data', (Random) => {
                                        console.log(`BOB : gRPC : random.stream <${grpc_server_url}> : on : data : <${JSON.stringify(Random)}>`);
                                        calculate_add_call.write({ // CalculateParameter
                                            id:    `${bob.id}calculate/add/${uuid.v4()}`,
                                            sid:   bob.sid,
                                            left:  1,
                                            right: Random.value
                                        }, grpc_meta_data);
                                    });

                                    const
                                        time                   = loaded_package.time,
                                        timeConstraint         = loaded_package.TimeConstraint,
                                        timeConstraintOperator = loaded_package.TimeConstraintOperator,
                                        time_stub              = new time(grpc_server_url, grpc.credentials.createInsecure()),
                                        time_constraint_call   = await time_stub.constraint( /** TimeConstraint */ {
                                            leftOperand:  {
                                                type:  "xsd:dateTimeString",
                                                value: "2021-11-15T13:05:47.432Z"
                                            },
                                            operator:     "BEFORE",
                                            rightOperand: {
                                                type:  "xsd:dateTimeString",
                                                value: "2042-11-15T13:05:47.432Z"
                                            }
                                        }, grpc_meta_data, (error, Value) => {
                                            console.log(`BOB: gRPC : time_constraint_call: result : <${JSON.stringify(Value)}>`);
                                            //debugger;
                                        }),
                                        time_before_call       = await time_stub.before( /** TimeOperands */ {
                                            leftOperand:  {
                                                type:  "xsd:dateTimestamp",
                                                value: "2021-11-15T13:05:47.432Z"
                                            },
                                            rightOperand: {
                                                type:  "xsd:dateTimestamp",
                                                value: "2042-11-15T13:05:47.432Z"
                                            }
                                        }, grpc_meta_data, (error, Value) => {
                                            console.log(`BOB: gRPC : time_before_call: result : <${JSON.stringify(Value)}>`);
                                            //debugger;
                                        })
                                    ; // const

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
                            debugger;
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

                bob.connect((that) => {
                    //debugger;
                });
                bob.on('error', (error) => {
                    debugger;
                });
                bob.on('end', () => {
                    // TODO : here we have to stop all activities on WebSocket/ gRPC / http / MQTT / etc.
                    debugger;
                });

            } catch (jex) {
                debugger;
                throw(jex);
            } // try
        } // if (shield::BOB)
        //endregion client BOB

    }); // idscp_server.listen

};

// EOF