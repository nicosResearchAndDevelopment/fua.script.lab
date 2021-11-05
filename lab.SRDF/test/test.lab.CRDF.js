async function main() {

    const
        protobuf   = require("protobufjs"),
        proto_root = await protobuf.load("./protobuf/crdf.proto"),
        proto      = {
            'Message': proto_root.lookup("crdf.Crdf_Message"),
            'Header':  proto_root.lookup("crdf.Crdf_Header"),
            'CRDF':    proto_root.lookup("crdf.Crdf_CRDF")
        },
        {CRDF}     = require(`../lab.CRDF`)
    ; // const

    console.warn(
        `${CRDF.shuffleString(
            CRDF.key_a_z + CRDF.key_1_0 + CRDF.key_A_Z + CRDF.key_extra,
            /** hold_first */ true // REM : default = false
        )}`
    );

    let
        {graph} = require(`./test.lab.graph`)
    ;

    CRDF({
        entities_base:           CRDF.key_1_9,
        entities_upper:          (CRDF.key_1_0 + CRDF.key_a_z + CRDF.key_A_Z + CRDF.key_extra),
        object_properties_base:  CRDF.key_A_Z,
        object_properties_upper: (CRDF.key_A_Z + CRDF.key_a_z + CRDF.key_1_0 + CRDF.key_extra),
        value_properties_base:   CRDF.key_A_Z,
        value_properties_upper:  (CRDF.key_A_Z + CRDF.key_a_z + CRDF.key_1_0 + CRDF.key_extra),
        literal_values_base:     CRDF.key_a_z,
        literal_values_upper:    (CRDF.key_a_z + CRDF.key_A_Z + CRDF.key_1_0 + CRDF.key_extra),
        //
        context: undefined,
        graph:   graph

    }).then((result) => {
        //console.warn(JSON.stringify(result, "", "\t"));
        //CRDF['toArray'](result).then((toArray_result) => {
        //    console.warn(JSON.stringify(toArray_result, "", "\t"));
        //}).catch((toArray_err) => {
        //    throw(toArray_err);
        //});

        CRDF.toCrdfProto(result).then((result) => {

            //console.warn(JSON.stringify(result, "", "\t"));
            let
                message = proto.Message.create({
                    'header':  [{'name': "issuedAt", 'value': (new Date).toISOString()}],
                    'payload': result
                }),
                encoded = proto.Message.encode(message).finish(),
                decoded = proto.Message.decode(encoded)
            ;

            console.log(JSON.stringify(decoded, "", "\t"));
            proto;

        });

    }).catch((err) => {
        throw(err);
    });

    //}).then(CRDF['toArray']).then((result) => {

} // main

main();