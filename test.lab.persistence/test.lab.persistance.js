//module.exports = ({
//                      'root': root = "1/"
//                  }) => {

const
    root   = "1/",
    secret = "Mahlzeit"
;

const
    Helmut      = require("C:\\fua\\DEVL\\js\\better\\public\\fua_lib\\agent.Helmut\\src\\agent.Helmut.js")({})['Helmut'],
    redis       = require("redis"),
    client      = redis.createClient(),
    subscriber  = redis.createClient(),
    publisher   = redis.createClient(),
    persistance = {},
    map         = new Map(),
    remover     = new Map()
;
let
    node
;

Helmut.secret = secret;

client.on("error", function (error) {
    console.error(error);
});

subscriber['on']("subscribe", function (channel, count) {
}); // subscriber['on']("subscribe")

subscriber['on']("message", function (channel, message) {
    switch (channel) {
        case "gbx":
            persistance.get(message, /** hash */ true).then((node) => {
                //REM: get only those, whoi are in the house...
                if (map.get(node['@id'])) {
                    map.set(node['@id'], node);
                } // if ()
            }).catch((err) => {
                err;
            });
            break; // gbx
        default:
            break; // default
    } // switch(channel)
}); // subscriber['on']("message")

subscriber['subscribe']("gbx");

Object.defineProperties(persistance, {
    'set': {
        /** interface */
        value: async (node, hash_id = true, encrypt_value = true) => {
            node = ((Array.isArray(node)) ? node : [node]);
            return new Promise((resolve, reject) => {
                try {
                    Promise.all(node.map((n) => {
                        //return () => {
                        return new Promise((_resolve, _reject) => {
                            if (!n['@id'])
                                _reject(new Error(`node misses '@id'`));
                            let hash = ((hash_id) ? Helmut.hash({'value': n['@id']}) : n['@id']);
                            //Object.keys(n).forEach((key) => {
                            //    //if ((key !== "@id") && (key !== "@type"))
                            //    if (key !== "@id")
                            //        //client.hset(`${hash}_hset`, key, `${JSON.stringify(n[key])}`, function (err, reply) {
                            //        client.hset(`${hash}_hset`, key, n[key], function (err, reply) {
                            //        //client.hset(hash, key, JSON.stringify(n[key]), function (err, reply) {
                            //        //client.hset(`${hash}_hset`, key, key, function (err, reply) {
                            //            key;
                            //            n;
                            //            if (err)
                            //                reject(err);
                            //        });
                            //});
                            client.set(hash, ((encrypt_value) ? Helmut.encrypt(JSON.stringify(n)): JSON.stringify(n)), (err, result) => {
                                if (err)
                                    reject(err);
                                //publisher['publish']("gbx", hash);
                                _resolve(n['@id']);
                            });
                        }); // return
                    })).then(resolve).catch(reject); // Promise.all()
                    //}));
                    //return await promise_all;
                } catch (jex) {
                    reject(jex);
                } // try
            }); // return P
        } // va lue
    }, // set
    'get': {
        /** interface */
        value: async (id, hash) => {
            let array_request = Array.isArray(id);
            id                = ((array_request) ? id : [id]);
            return new Promise((resolve, reject) => {
                try {
                    Promise.all(id.map((_id) => {
                        return new Promise((_resolve, _reject) => {
                            client.get(((hash) ? _id : Helmut.hash({'value': _id})), function (err, reply) {
                                if (err)
                                    reject(err)
                                Helmut.decrypt(reply).then((value) => {
                                    _resolve(JSON.parse(value));
                                }).catch(reject);
                            });
                        }); // return
                    })).then((result) => {
                        if (array_request)
                            resolve(result);
                        resolve(result[0]);
                    }).catch(reject); // Promise.all()
                } catch (jex) {
                    reject(jex);
                } // try
            }); // return P
        } // value
    } // get
}); // Object.defineProperties(persistance)

function _remover(id, timeout = (50 * 5 * 1000)) {

    let _removable = remover.get(id);
    if (_removable && _removable['timeout'])
        clearTimeout(_removable['timeout']);

    remover.set(id, {
        'ts':      ((new Date()).valueOf() / 1000),
        'timeout': setTimeout(() => {
            console.warn(`${(new Date()).toISOString()} : remove ${id}`);
            map.delete(id);
            remover.delete(id);
        }, timeout)
    });
} // function _remover

node = {
    '@id': `${root}heinzelmann`
};

let nodes = [{
    '@id':        `${root}data`,
    '@type':      `ldp:BasicContainer`,
    'rdfs:label': `data`,
    'contains':   []
}];
map.set(nodes[0]['@id'], nodes[0]);
for (let i = 1; i < 40; i++) {
    nodes.push({
        '@id':        `${root}heinzelmann_${i}`,
        '@type':      `rdfs:Resource`,
        'rdfs:label': `heinzelmann_${i}`
    });
    _remover(nodes[(nodes.length - 1)]['@id'], Math.floor(Math.random() * 60000));
    nodes[0]['contains']['push'](`${root}heinzelmann_${i}`);
} // for (i)
map.set(nodes[(nodes.length - 1)]['@id'], nodes[(nodes.length - 1)]);

//_remover(nodes[(nodes.length - 1)]['@id'], 5000);

persistance.set(nodes).then((result) => {
    persistance['get'](result).then((result) => {
        result;
    }).catch((err) => {
        err;
    });
}).catch((err) => {
    err;
});

//throw new Error();
//};
