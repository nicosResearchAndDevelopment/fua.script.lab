// test

const
    _key_1_9              = "123456789",
    _key_1_0              = "1234567890",
    _key_a_z              = "abcdefghijklmnopqrstuvwxyz",
    _key_A_Z              = "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    _key_extra            = "#@&!?",
    //
    stair_chars_pos       = 0,
    stair_char_length_pos = 1,
    char_pos              = 2
;

function shuffleString(str) {
    let
        position,
        result = ""
    ;
    while (str.length > 1) {
        position = Math.floor(Math.random() * str.length);
        result   = result + str.substr(position, 1);
        str      = (str.substr(0, position) + str.substr((position + 1), str.length));
    } // while()
    result = result + str;
    return result;
}

//let grunz = shuffleString(_key_a_z);

function lit_index({
                       'pre':   pre = "",
                       'base':  base = _key_a_z,
                       'upper': upper = undefined,
                       'set':   set
                       //'ids':   ids
                   }) {

    upper = (upper || base);

    let
        base_length  = base.length,
        upper_length = upper.length,
        stair        = [[base, (base_length), /** char pos */ -1]],
        top_step     = (stair.length - 1),
        id_chars     = new Array(1),
        ids          = []
    ; // let

    const getNewId = () => {
              let
                  go_base = true
              ;
              stair[top_step][char_pos]++;
              if (stair[top_step][char_pos] < stair[top_step][stair_char_length_pos]) {
                  id_chars[top_step] = stair[top_step][stair_chars_pos][stair[top_step][char_pos]];
              } else {

                  for (let i = (stair.length - 1); ((i > 0) && go_base); i--) {
                      stair[i][char_pos]++;
                      if (stair[i][char_pos] < stair[i][stair_char_length_pos]) {
                          id_chars[i] = stair[i][stair_chars_pos][stair[i][char_pos]];
                          go_base     = false;
                      } else {
                          stair[i][char_pos] = 0;
                          id_chars[i]        = stair[i][stair_chars_pos][0];
                      } // if()
                  } // for (i)

                  if (go_base) {
                      stair[0][char_pos]++;
                      if (stair[0][char_pos] < stair[0][stair_char_length_pos]) {
                          id_chars[0]               = stair[0][stair_chars_pos][stair[0][char_pos]];
                          stair[top_step][char_pos] = 0;
                          id_chars[top_step]        = stair[top_step][stair_chars_pos][0];
                      } else {
                          stair[0][char_pos] = 0;
                          id_chars[0]        = stair[0][stair_chars_pos][0];
                          stair.push([upper, upper_length, 0]);
                          id_chars.push(upper[0]);
                          top_step = (stair.length - 1);
                      } // if()
                  } else {
                      stair[top_step][char_pos] = 0;
                      id_chars[top_step]        = stair[top_step][stair_chars_pos][0];
                  } // if()

              } // if()
              return pre + id_chars.join("");
          } // getNewId
    ;

    return (IRI) => {
        let
            i = set.indexOf(IRI),
            result
        ;
        if (i < 0) {
            set.push(IRI);
            result = getNewId();
            ids.push(result);
        } else {
            result = ids[i];
        } // if()
        return result;
    }; // return (IRI)

} // lit_index()

let lit_index_fn = lit_index({
    'pre':   "",
    'base':  "123",
    'upper': "abc",
    'set':   []
    //'ids':   ids
});

let grunz = lit_index_fn("Mahlzeit");
grunz     = lit_index_fn("grunz");
grunz     = lit_index_fn("hui"); // 3
grunz     = lit_index_fn("fumble"); // 1a
grunz     = lit_index_fn("snort"); // 1b
grunz     = lit_index_fn("Gnuliebe"); // 1c
grunz     = lit_index_fn("Hossa"); // 2a
grunz     = lit_index_fn("Freiheit"); // 2b
grunz     = lit_index_fn("pisepampel"); // 2c
grunz     = lit_index_fn("3a"); // 3a
grunz     = lit_index_fn("3b");
grunz     = lit_index_fn("3c");
grunz     = lit_index_fn("1aa");
grunz     = lit_index_fn("1ab");
grunz     = lit_index_fn("1ac");
grunz     = lit_index_fn("snort"); // 1b
grunz     = "";

//function _index_int_as_string(set) {
//    let proxy = _index_as_int(set);
//    return (key) => {
//        return `${proxy(key)}`;
//    };
//} // _index_int_as_string()
//
//function _index_as_int(set) {
//
//    return (key) => {
//    };
//} // _index_as_int()

function getSet({'indexer': indexer = _indexer, 'size_literal': size_literal = "size"}) {

    let set = [];

    Object.defineProperties(set, {
        'index':        {value: (indexer(set) || _index_int_as_string(set))},
        [size_literal]: {
            get: () => {
                return set.length;
            }
        }
    });
    return set;
} // getSet

function SRDF({
                  'entities_base':           entities_base = _key_1_9,
                  'entities_upper':          entities_upper = (_key_1_0 + _key_a_z + _key_A_Z + _key_extra),
                  'object_properties_base':  object_properties_base = _key_A_Z,
                  'object_properties_upper': object_properties_upper = (_key_A_Z + _key_a_z + _key_1_0 + _key_extra),
                  'data_properties_base':    data_properties_base = _key_a_z,
                  'data_properties_upper':   data_properties_upper = (_key_a_z + _key_A_Z + _key_1_9 + _key_extra),
                  //
                  'context':                 context,
                  'graph':                   graph
              }) {
    return new Promise((resolve, reject) => {
        try {
            let
                result = {
                    'Entities':          {
                        '1': ["http://...URI", 1],
                        '5': ["http://...#Thing", 1]
                    },
                    'Entity_properties': {
                        'A': "http://#type"
                    },
                    'Value_properties':  {
                        'a': ["http://...name", "xsd:string"]
                    },
                    'Literal_values':    {},
                    'SRDFS':             {
                        '1': [
                            [
                                ['A', '5']
                            ],
                            [
                                ['a', '_1'],
                                ['b', '_2']
                            ]
                        ]
                    }
                }
            ;
            resolve(result);
        } catch (jex) {
            reject(jex);
        } // try
    }); // rnP
} // SRDF ()

Object.defineProperties(SRDF, {
    'deserialize': {
        value: ({'srdf': srdf}) => {
            return new Promise((resolve, reject) => {
                try {
                    let
                        result = {}
                    ;
                    resolve(result);
                } catch (jex) {
                    reject(jex);
                } // try
            }); // rnP
        }
    },
    'key_1_9':     {value: _key_1_9},
    'key_1_0':     {value: _key_1_0},
    'key_a_z':     {value: _key_a_z},
    'key_A_Z':     {value: _key_A_Z},
    'key_extra':   {value: _key_extra}
});

SRDF({
    'entities_base':           SRDF.key_1_9,
    'entities_upper':          (SRDF.key_1_0 + SRDF.key_a_z + SRDF.key_A_Z + SRDF.key_extra),
    'object_properties_base':  SRDF.key_A_Z,
    'object_properties_upper': (SRDF.key_A_Z + SRDF.key_a_z + SRDF.key_1_0 + SRDF.key_extra),
    'data_properties_base':    SRDF.key_a_z,
    'data_properties_upper':   (SRDF.key_a_z + SRDF.key_A_Z + SRDF.key_1_9 + SRDF.key_extra),
    //
    'context':                 undefined,
    'graph':                   undefined
}).then((result) => {
    result;
}).catch((err) => {
    err;
});