const
    fs                                = require("fs"),
    //
    protobuf                          = require("protobufjs"),
    //
    {Server, fsm, wait, idscpVersion} = require(`../src/2/ids.idscp`)
;

(async () => {
    try {
        const
            proto                   = await protobuf.load("../src/2/proto/ids.idscp.proto"),
            server_tls_certificates = require(`./cert/server/tls-server/server.js`),
            connector_certificates  = require(`./cert/server/connector/client.js`),
            server                  = new Server({
                id:           "tls://alice.nicos-rd.com/",
                DAT:          "ALICE.42424242424242424.abc",
                port:         8080,
                options:      {
                    tls:  {
                        key:                server_tls_certificates.key,
                        cert:               server_tls_certificates.cert,
                        ca:                 [server_tls_certificates.ca],
                        requestCert:        true,
                        rejectUnauthorized: false
                    },
                    cert: connector_certificates
                },
                proto:        proto,
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
            APP                     = require('./test.app.js')({
                server: server,
                proto:  proto
            })
        ; // const
    } catch (jex) {
        debugger;
        throw (jex);
    } // try
})().catch(console.error);

// EOF