
const
    {SRDF} = require(`../lab.SRDF`)
;

//console.warn(`${SRDF.shuffleString(SRDF.key_a_z + SRDF.key_1_0 + SRDF.key_A_Z + SRDF.key_extra)}`);

let
    {graph}        = require(`./test.lab.graph`)
;
SRDF({
    'entities_base':           SRDF.key_1_9,
    'entities_upper':          (SRDF.key_1_0 + SRDF.key_a_z + SRDF.key_A_Z + SRDF.key_extra),
    'object_properties_base':  SRDF.key_A_Z,
    'object_properties_upper': (SRDF.key_A_Z + SRDF.key_a_z + SRDF.key_1_0 + SRDF.key_extra),
    'data_properties_base':    SRDF.key_a_z,
    'data_properties_upper':   (SRDF.key_a_z + SRDF.key_A_Z + SRDF.key_1_9 + SRDF.key_extra),
    //
    'context':                 undefined,
    'graph':                   graph
}).then((result) => {
    result;
}).catch((err) => {
    err;
});