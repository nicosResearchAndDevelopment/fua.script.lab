const
    fs                                = require("fs"),
    //
    protobuf                          = require("protobufjs"),
    proto_loader                      = require('@grpc/proto-loader'),
    //
    {Server, fsm, wait, idscpVersion} = require(`../src/2/ids.idscp`)
;

(async () => {
    try {
        const
            proto                   = await protobuf.load("../src/2/proto/ids.idscp.proto"),
            proto_loaded            = proto_loader.loadSync("../src/2/proto/ids.idscp.proto",
                {
                    keepCase: true,
                    defaults: true,
                    enums:    String
                }
            ),
            server_tls_certificates = require(`./cert/server/tls-server/server.js`),
            connector_certificates  = require(`./cert/server/connector/client.js`),

            //region DAPS
            dapsUrl                 = "http://localhost:4567",
            dapsTokenPath           = "/token",
            dapsJwksPath            = "/.well-known/jwks.json",
            dapsVcPath              = "/vc",
            //endregion DAPS

            server                  = new Server({
                id:      "idscp://alice.nicos-rd.com/",
                host:    "alice.nicos-rd.com",
                port:    8080,
                DAT:     "ALICE.42424242424242424.abc",
                options: {
                    tls:  {
                        key:                server_tls_certificates.key,
                        cert:               server_tls_certificates.cert,
                        ca:                 [server_tls_certificates.ca],
                        requestCert:        true,
                        rejectUnauthorized: false
                    },
                    cert: connector_certificates
                },
                //region DAPS
                dapsUrl:       dapsUrl,
                dapsTokenPath: dapsTokenPath,
                dapsJwksPath:  dapsJwksPath,
                dapsVcPath:    dapsVcPath,
                //endregion DAPS
                proto:        proto,
                proto_loaded: proto_loaded,
                authenticate: async (token) => {
                    let DAT = {
                        requestToken: token
                    };
                    return DAT;
                }, // authenticate,
                //
                timeout_WAIT_FOR_HELLO: 60,
                timeout_SESSION:        60
            }),
            APP                     = require('./test.idscp.app.js')({
                server:       server,
                proto:        proto,
                proto_loaded: proto_loaded,
                grpc_port:    50051,
                //region client (bob)
                client_server_tls_certificates: require(`./cert/server/tls-server/server.js`),
                client_tls_certificates:        require(`./cert/client/tls-server/server.js`),
                client_connector_certificates:  require(`./cert/client/connector/client.js`),
                client_request_cert:            false,
                client_reject_unauthorized:     false,
                client_daps_host:               "alice.nicos-rd.com",
                client_daps_port:               8080,
                client_reconnect:               true
                //endregion client (bob)
            })
        ; // const
    } catch (jex) {
        debugger;
        throw (jex);
    } // try
})().catch(console.error);

// EOF