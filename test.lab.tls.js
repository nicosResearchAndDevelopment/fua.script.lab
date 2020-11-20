const test_name = "test.lab.tls";

const date     = () => new Date().toISOString();
let hint       = ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ";
//hint           = "";

module.exports = (parameter) => {

    console.log(`${hint}${test_name} : start`);

    /*
In the node.js intro tutorial (http://nodejs.org/), they show a basic tcp
server, but for some reason omit a client connecting to it.  I added an
example at the bottom.
Save the following server in example.js:
*/

    const
        tls    = require('tls'),
        server = tls.createServer((socket) => {
            console.log(`${hint}${test_name} : tls : createServer : callback : reached`);
            socket.write('Echo server : ');
            socket.pipe(socket);
        });

    server.listen(1337, '127.0.0.1', () => {

        console.log(`${hint}${test_name} : server : listen : reached`);

        const
            client = new tls.Socket()
        ;

        client.connect(1337, '127.0.0.1', () => {
            console.log(`${hint}${test_name} : client : connect : callback : reached`);
            client.write('Hello, server! Love, Client.');
        });

        client.on('data', function (data) {
            //console.log('Received: ' + data);
            console.log(`${hint}${test_name} : client : on : data <${data}>`);
            client.destroy(); // kill client after server's response
        });

        client.on('close', () => {
            console.log(`${hint}${test_name} : client : on : close : reached (connection closed!)`);
        });
    });

    /*
    And connect with a tcp client from the command line using netcat, the *nix
    utility for reading and writing across tcp/udp network connections.  I've only
    used it for debugging myself.
    $ netcat 127.0.0.1 1337
    You should see:
    > Echo server
    */

    /* Or use this example tcp client written in node.js.  (Originated with
    example code from
    http://www.hacksparrow.com/tcp-socket-programming-in-node-js.html.) */

    //var tls = require('tls');

    return undefined;
};