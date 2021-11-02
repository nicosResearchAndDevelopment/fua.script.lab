const
    protobuf = require("protobufjs"),
    //
    {fsm}    = require(`../src/2/ids.idscp.fsm.js`)
;

module.exports = async ({
                            server: server,
                            proto:  proto
                        }) => {

    const
        ids_proto              = await protobuf.load("../src/2/proto/ids.idscp.proto"),
        {Client, idscpVersion} = require(`../src/2/ids.idscp`)
    ;

    const
        APP = null
    ;

    const clients = new Map();

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

    server.on('data', (session, data) => {
        //debugger;
        let decoded = ids_proto.IdscpData.decode(data);
        //let decoded = ids_proto.IdscpHello.decode(data);
        console.log(JSON.stringify(decoded, "", "\t"));
        // REM : here we have to do all this application-stuff:
        // - understand, what consumer request.
        // - authorization on given assets
    });

    //server.on(fsm.state.STATE_ESTABLISHED, (session) => {
    //    debugger;
    //    // REM : this will ONLY be triggered AFTER sucessfull initial handshake and will work on "real" data, only...
    //    //session.on('data', (data) => {
    //    //    debugger;
    //    //});
    //});

    const
        server_tls_certificates       = require(`./cert/server/tls-server/server.js`),
        client_tls_certificates       = require(`./cert/client/tls-server/server.js`),
        client_connector_certificates = require(`./cert/client/connector/client.js`)
    ;

    server.listen(async () => {

        try {
            let result;
            //region client
            const
                bob = new Client({
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
                    timeout_WAIT_FOR_HELLO: 60
                })
            ; // const

            //bob.on('STATE_ESTABLISHED', async (event) => {
            bob.on('event', async (event) => {
                console.log(JSON.stringify(event, "", "\t"));

                //if (event.step === "STATE_ESTABLISHED") {
                //    //debugger;
                //    //let message_ = proto.IdscpData.create({
                //    //        data:            Buffer.from("genauso", 'utf-8'),
                //    //        alternating_bit: false
                //    //    }),
                //    //    encoded_ = await proto.IdscpData.encode(message_).finish()
                //    //    , _decoded = await proto.IdscpData.decode(encoded_)
                //    //;
                //    //let result   = await bob.write(encoded_);
                //    //
                //    let flat   = JSON.stringify({mahl: "zeit"});
                //    let result = await bob.write(Buffer.from(flat));
                //} // if ()
            });
            bob.on(fsm.state.STATE_ESTABLISHED, async (client) => {

                // REM : this will ONLY be triggered AFTER sucessfull initial handshake and will work on "real" data, only...
                bob.on('data', (data) => {
                    debugger;
                });

                let flat   = JSON.stringify({mahl: "zeit"});
                let result = await bob.write(Buffer.from(flat));

            });
            bob.connect((error, data) => {
                //debugger;
            });
            bob.on('error', (error) => {
                debugger;
            });
            // REM : this will ONLY be triggered AFTER sucessfull initial handshake and will work on "real" data, only...
            //bob.on('data', (data) => {
            //    debugger;
            //});
            bob.on('end', (that) => {
                debugger;
            });
            bob.on('error', (error) => {
                debugger;
            });

            //return;
        } catch (jex) {
            throw(jex);
        } // try

        //endregion client

    }); // listen

};

// EOF