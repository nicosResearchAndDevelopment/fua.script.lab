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
            idscp_server_schema     = "https",
            idscp_server_host       = "alice.nicos-rd.com",
            idscp_server_port       = 50050,
            grpc_server_port        = 50051,
            proto                   = await protobuf.load("../src/2/proto/ids.idscp.proto"),
            proto_loaded            = proto_loader.loadSync("../src/2/proto/ids.idscp.proto",
                {
                    keepCase: true,
                    longs:    String,
                    enums:    String,
                    defaults: true,
                    oneofs:   true
                }
            ),
            server_tls_certificates = require(`./cert/server/tls-server/server.js`),
            connector_certificates  = require(`./cert/server/connector/client.js`),

            //region DAPS
            //dapsUrl                 = "http://localhost:4567",
            daps_schema             = "https",
            daps_host               = "testbed.nicos-rd.com",
            daps_port               = 8080,
            dapsUrl                 = `${daps_schema}://${daps_host}:${daps_port}`,
            dapsTokenPath           = "/token",
            dapsJwksPath            = "/.well-known/jwks.json",
            dapsVcPath              = "/vc",
            //region DAPS custom
            // 'sha1', 'md5', 'sha256', 'sha512'
            sid_hash_alg            = "sha256",
            sid_hash_salt           = "mahlzeit",
            //endregion DAPS custom
            //endregion DAPS

            server                  = new Server({
                id:            "idscp://alice.nicos-rd.com/",
                schema:        "idscp",
                host:          "alice.nicos-rd.com",
                port:          idscp_server_port,
                DAT:           "ALICE.42424242424242424.abc",
                sid_hash_alg:  sid_hash_alg,
                sid_hash_salt: sid_hash_salt,
                dapsCustom:    {
                    sid_hash_alg:  sid_hash_alg,
                    sid_hash_salt: sid_hash_salt,
                    http_ca:       server_tls_certificates.ca.toString()
                },
                options:       {
                    tls:  {
                        key:                server_tls_certificates.key,
                        cert:               server_tls_certificates.cert,
                        ca:                 [server_tls_certificates.ca],
                        requestCert:        false,
                        rejectUnauthorized: false
                    },
                    cert: connector_certificates
                },
                //region DAPS
                daps_register: {
                    "https://testbed.nicos-rd.com:8080": {
                        default:            true,
                        http_agent_options: undefined,
                        tokenPath:          "/token",
                        jwksPath:           "/.well-known/jwks.json",
                        vcPath:             "/vc",
                        jwksStore:          "REM : set at runtime"
                    }
                },
                dapsUrl:       dapsUrl,
                dapsTokenPath: dapsTokenPath,
                dapsJwksPath:  dapsJwksPath,
                dapsVcPath:    dapsVcPath,
                //endregion DAPS
                proto: proto,
                //authenticate: async (token) => {
                //    let DAT = {
                //        requestToken: token
                //    };
                //    return DAT;
                //}, // authenticate
                //
                timeout_WAIT_FOR_HELLO: 60,
                timeout_SESSION:        60
            }),
            APP                     = require('./test.idscp.app.js')({
                server: server,
                //proto:        proto,
                proto:        proto,
                proto_loaded: proto_loaded,
                grpc_port:    grpc_server_port,
                //region client (bob)
                client_server_tls_certificates: require(`./cert/server/tls-server/server.js`),
                client_tls_certificates:        require(`./cert/client/tls-server/server.js`),
                client_connector_certificates:  require(`./cert/client/connector/client.js`),
                client_request_cert:            false,
                client_reject_unauthorized:     false,
                client_daps_register:           {
                    "https://testbed.nicos-rd.com:8080": {
                        default:            true,
                        http_agent_options: undefined,
                        tokenPath:          "/token",
                        jwksPath:           "/.well-known/jwks.json",
                        vcPath:             "/vc",
                        jwksStore:          "REM : set at runtime"
                    }
                },
                client_daps_host:               daps_host,
                client_daps_port:               daps_port,
                client_daps_token_path:         dapsTokenPath,
                client_daps_jwks_path:          dapsJwksPath,
                client_daps_vc_path:            dapsVcPath,
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