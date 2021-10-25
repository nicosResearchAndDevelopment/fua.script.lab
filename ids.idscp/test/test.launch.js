const
    fs                     = require("fs"),
    {Server, idscpVersion} = require(`../src/2/ids.idscp`),
    protobuf               = require('protocol-buffers')
;

let
    proto     = fs.readFileSync(`../src/2/proto/ids.idscp.proto`),
    ids_proto = protobuf(fs.readFileSync(`../src/2/proto/ids.idscp.proto`))
;

const
    server_tls_certificates = require(`./cert/server/tls-server/server.js`),
    connector_certificates  = require(`./cert/server/connector/client.js`),
    server                  = new Server({
        id:      "tls://alice.nicos-rd.com/",
        port:    8080,
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
        proto:   ids_proto
    }),
    APP                     = require('./test.app.js')({
        server: server,
        proto:  ids_proto
    })
; // const

// EOF