const test_name = "test.lab.ftp";

const date = () => new Date().toISOString();
let hint   = ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ";
//hint           = "";

// https://github.com/trs/ftp-srv#readme

module.exports = (parameter) => {

    console.log(`${hint}${test_name} : start`);

    const
        {FtpSrv, FileSystem} = require('ftp-srv'),
        ftpServer            = new FtpSrv({
            //'log':         bunyan.createLogger({name: 'test', level: 'trace'}),
            'url':         "ftp://127.0.0.1:42",
            //'anonymous':   true, // 'sillyrabbit'
            'file_format': "ep",
            'blacklist':   [],
            'whitelist':   [],
            'timeout':     0, // REM default === 0
            'greeting':    ['Welcome', 'to', 'the', 'gbx.ftp!']
        })
    ;

    //const server = new FtpServer({
    //    log:         bunyan.createLogger({name: 'test', level: 'trace'}),
    //    url:         'ftp://127.0.0.1:8880',
    //    pasv_url:    '192.168.1.1',
    //    pasv_min:    8881,
    //    greeting:    ['Welcome', 'to', 'the', 'jungle!'],
    //    tls:         {
    //        key:  fs.readFileSync(`${process.cwd()}/test/cert/server.key`),
    //        cert: fs.readFileSync(`${process.cwd()}/test/cert/server.crt`),
    //        ca:   fs.readFileSync(`${process.cwd()}/test/cert/server.csr`)
    //    },
    //    file_format: 'ep',
    //    anonymous:   'sillyrabbit'
    //});

    ftpServer
        .on('login', ({connection, username, password}, resolve, reject) => {
            try {
                if (username === 'test' && password === 'test' || username === 'anonymous') {
                    //resolve({'root': require('os').homedir()});
                    //resolve({'root': `C:\\tmp\\gbx\\ftp\\root`});
                    resolve({'root': `C:\\fua\\DEVL\\js\\better\\app\\TEST\\data\\gbx`});
                } else reject('Bad username or password');
            } catch (jex) {
                reject(jex);
            } // try
        }) // on(login)
        .on('client-error', ({connection, context, error}) => {
            error;
            //try {
            //    resolve();
            //} catch (jex) {
            //    reject(jex);
            //} // try
        }) // on(client-error)
    ; // ftpServer.on(...)

    ftpServer.listen().then((result) => {
        result;
    }).catch((err)=> {
        err;
    });

    //    ftpServer.on('login', (data, resolve, reject) => { ...
    //    });
    //...
    //
    //    ftpServer.listen()
    //        .then(() => { ...
    //        });

    //class MyFileSystem extends FileSystem {
    //
    //    constructor() {
    //        super(...arguments);
    //    } // constructor
    //
    //    get(fileName) {
    //        return undefined;
    //    }
    //} // MyFileSystem

    return undefined;
};