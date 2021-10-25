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

    const
        server_tls_certificates       = require(`./cert/server/tls-server/server.js`),
        client_tls_certificates       = require(`./cert/client/tls-server/server.js`),
        client_connector_certificates = require(`./cert/client/connector/client.js`)
    ;
    server.listen(() => {

        try {
            //region client
            const
                client = new Client({
                    id:      "tls://bob.nicos-rd.com/",
                    options: {
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
                    proto:   proto
                })
            ; // const
            client.on('event', (event) => {
                console.log(JSON.stringify(event, "", "\t"));
            });

            client.connect((that) => {

            });
            //return;
        } catch (jex) {
            throw(jex);
        } // try
        //endregion client

    }); // listen

};

// EOF