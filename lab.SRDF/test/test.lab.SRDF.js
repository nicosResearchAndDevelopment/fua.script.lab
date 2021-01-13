async function main() {
    const
        protobuf   = require("protobufjs"),
        proto_root = await protobuf.load("./protobuf/srdf.proto"),
        proto      = {
            'Message': proto_root.lookup("srdf.Message"),
            'Header':  proto_root.lookup("srdf.Header"),
            'SRDF':    proto_root.lookup("srdf.SRDF")
            //'Message':   proto_idscp_root.lookup("idscp.store.Message"),
            //'Dataset':   proto_idscp_root.lookup("idscp.store.Dataset"),
            //'Subject':   proto_idscp_root.lookup("idscp.store.Subject"),
            //'Predicate': proto_idscp_root.lookup("idscp.store.Predicate"),
            //'Object':    proto_idscp_root.lookup("idscp.store.Object"),
            ////'Triple':  proto_idscp_root.lookup("idscp.store.Triple"),
            //'Store': proto_idscp_root.lookup("idscp.store.Store")
        },
        {SRDF}     = require(`../lab.SRDF`)
    ;

    //console.warn(`${SRDF.shuffleString(SRDF.key_a_z + SRDF.key_1_0 + SRDF.key_A_Z + SRDF.key_extra)}`);

    let
        {graph} = require(`./test.lab.graph`)
    ;

    SRDF({
        'entities_base':           SRDF.key_1_9,
        'entities_upper':          (SRDF.key_1_0 + SRDF.key_a_z + SRDF.key_A_Z + SRDF.key_extra),
        'object_properties_base':  SRDF.key_A_Z,
        'object_properties_upper': (SRDF.key_A_Z + SRDF.key_a_z + SRDF.key_1_0 + SRDF.key_extra),
        'data_properties_base':    SRDF.key_a_z,
        'data_properties_upper':   (SRDF.key_a_z + SRDF.key_A_Z + SRDF.key_1_9 + SRDF.key_extra),
        //
        'context': undefined,
        'graph':   graph

        //}).then((result) => {
        //    console.warn(JSON.stringify(result, "", "\t"));
        //    SRDF['toArray'](result).then((toArray_result) => {
        //        console.warn(JSON.stringify(toArray_result, "", "\t"));
        //    }).catch((toArray_err) => {
        //        toArray_err;
        //    });
        //}).catch((err) => {
        //    err;
        //});

    //}).then(SRDF['toArray']).then((result) => {
    }).then(SRDF['toSrdfProto']).then((result) => {
        console.warn(JSON.stringify(result, "", "\t"));
        let
            message = proto.Message.create({
                'header': [{'name': "issuedAt", 'value': (new Date).toISOString()}],
                'srdf':  result
            }),
            encoded = proto.Message.encode(message).finish()
        ;

        message = proto.Message.decode(encoded);

        console.log(JSON.stringify(message, "", "\t"));
        proto;

    });
} // main

main();