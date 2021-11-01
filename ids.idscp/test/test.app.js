module.exports = ({
                      server: server,
                      proto:  proto
                  }) => {

    const
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
    });
    server.on('clientTimeout', (client) => {
        // REM : at this point client comes to application level
        debugger;
        client.on('data', (data) => {
            debugger;
        });
        clients.set(client.id, client);
    });

    server.on('data', (session, data) => {
        debugger;
        // REM : here we have to do all this application-stuff:
        // - understand, what consumer request.
        // - authorization on given assets
    });

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
                        let DAT = {};
                        return DAT;
                    }, // authenticate,
                    //
                    timeout_WAIT_FOR_HELLO: 60
                })
            ; // const
            bob.on('event', async (event) => {
                console.log(JSON.stringify(event, "", "\t"));
                if (event.step === "STATE_ESTABLISHED") {
                    //debugger;
                    let result = await bob.write(Buffer.from(JSON.stringify({mahl: "zeit"}), 'utf-8'));
                } // if ()
            });

            bob.connect((error, data) => {
                //debugger;
            });
            bob.on('error', (error) => {
                debugger;
            });
            // REM : this will ONLY be triggered AFTER sucessfull initial handshake and will work on "real" data, only...
            bob.on('data', (data) => {
                debugger;
            });
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