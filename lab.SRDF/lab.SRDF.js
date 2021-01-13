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
//
//let lit_index_fn = lit_index({
//    'pre':   "",
//    'base':  "123",
//    'upper': "abc",
//    'set':   []
//    //'ids':   ids
//});
//
//let grunz = lit_index_fn("Mahlzeit");
//grunz     = lit_index_fn("grunz");
//grunz     = lit_index_fn("hui"); // 3
//grunz     = lit_index_fn("fumble"); // 1a
//grunz     = lit_index_fn("snort"); // 1b
//grunz     = lit_index_fn("Gnuliebe"); // 1c
//grunz     = lit_index_fn("Hossa"); // 2a
//grunz     = lit_index_fn("Freiheit"); // 2b
//grunz     = lit_index_fn("pisepampel"); // 2c
//grunz     = lit_index_fn("3a"); // 3a
//grunz     = lit_index_fn("3b");
//grunz     = lit_index_fn("3c");
//grunz     = lit_index_fn("1aa");
//grunz     = lit_index_fn("1ab");
//grunz     = lit_index_fn("1ac");
//grunz     = lit_index_fn("snort"); // 1b
//grunz     = "";

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

function SRDF({
                  'entities_base':           entities_base = _key_1_9,
                  'entities_upper':          entities_upper = (_key_1_0 + _key_a_z + _key_A_Z + _key_extra),
                  'entity_properties_base':  entity_properties_base = _key_A_Z,
                  'entity_properties_upper': entity_properties_upper = (_key_A_Z + _key_a_z + _key_1_0 + _key_extra),
                  'value_properties_base':   value_properties_base = _key_a_z,
                  'value_properties_upper':  value_properties_upper = (_key_a_z + _key_A_Z + _key_1_9 + _key_extra),
                  'literal_values_base':     literal_values_base = _key_1_9,
                  'literal_values_upper':    literal_values_upper = (_key_1_0 + _key_a_z + _key_A_Z + _key_extra),
                  //
                  'context': context,
                  'graph':   graph
              }) {

    return new Promise((resolve, reject) => {
        try {
            const
                __type__     = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                __language__ = "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString"
            ;
            let
                result       = {
                    'SRDFV': {
                        'Entities':          {
                            //'1': ["http://...URI", 1],
                            //'5': ["http://...#Thing", 1]
                        },
                        'Entity_properties': {
                            //'A': "http://#type"
                        },
                        'Value_properties':  {
                            //'a': ["http://...name", "xsd:string"]
                        },
                        'Literal_values':    {
                            //'_1': ["Mahlzeit", "en"],
                            //'_2': "'Mahlzeit'^^en"
                        }
                    },
                    'SRDFS': {}
                }
            ;

            let
                lit_index_entities_fn          = lit_index({
                    'base':  entities_base,
                    'upper': entities_upper,
                    'set':   []
                }),
                lit_index_entity_properties_fn = lit_index({
                    'base':  entity_properties_base,
                    'upper': entity_properties_upper,
                    'set':   []
                }),
                lit_index_value_properties_fn  = lit_index({
                    'base':  value_properties_base,
                    'upper': value_properties_upper,
                    'set':   []
                }),
                lit_index_literal_values_fn    = lit_index({
                    'pre':   "_",
                    'base':  literal_values_base,
                    'upper': literal_values_upper,
                    'set':   []
                })
            ;

            const
                __type_id__ = lit_index_entity_properties_fn(__type__)
                //__language_id__ = lit_index_entity_properties_fn(__language__)
            ;

            //REM: make "a" and "b" really shining ;-)
            result['SRDFV']['Entity_properties'][__type_id__] = __type__;
            //result['SRDFV']['Entity_properties'][__language_id__] = __language__;

            graph.forEach((resource) => {
                let
                    i,
                    j,
                    id = (resource['@id'] || `_:b${(blank_node_index++)}`),
                    subject,
                    type,
                    type_index,
                    value,
                    language,
                    typeof_obj,
                    entity_index,
                    predicate_index,
                    obj_index,
                    o,
                    o_i
                ; // let

                if (id) {

                    i = lit_index_entities_fn(id);

                    if (!result['SRDFV']['Entities'][i]) {

                        result['SRDFV']['Entities'][i] = [id, "???"];
                        result['SRDFS'][i]             = [/** entity_property-entity */ [], /** value_property-value */ []];
                        subject                        = result['SRDFS'][i];

                        for (const [predicate, obj] of Object.entries(resource)) {

                            if (predicate !== "@id") {

                                typeof_obj = (typeof obj);

                                switch (predicate) {

                                    case __type__:
                                    case "rdf:type":
                                    case "@type":
                                        //type_id = lit_index_entity_properties_fn(__type__);
                                        if (typeof_obj === "string") {
                                            entity_index = lit_index_entities_fn(obj);
                                            if (!result['SRDFV']['Entities'][entity_index]) {
                                                result['SRDFV']['Entities'][entity_index] = [obj, "???"];
                                            } // if ()
                                            result['SRDFS'][i][0].push([__type_id__, entity_index]);
                                        } else {
                                            throw new Error(``);
                                        } // if ()
                                        break; // @type

                                    default:

                                        switch (typeof_obj) {
                                            case "string":
                                                type            = "xsd:string";
                                                predicate_index = lit_index_value_properties_fn(predicate);
                                                if (!result['SRDFV']['Value_properties'][predicate_index]) {
                                                    result['SRDFV']['Value_properties'][predicate_index] = [predicate, type];
                                                } // if ()
                                                obj_index = lit_index_literal_values_fn(obj);
                                                if (!result['SRDFV']['Literal_values'][obj_index]) {
                                                    result['SRDFV']['Literal_values'][obj_index] = obj;
                                                } // if ()
                                                result['SRDFS'][i][1].push([predicate_index, obj_index]);
                                                break; // string
                                            case "object":
                                                if (Array.isArray(obj)) {
                                                    //    obj.forEach((item) => {
                                                    //        switch (typeof item) {
                                                    //            case "string":
                                                    //                o.push({});
                                                    //                o_i              = (o.length - 1);
                                                    //                o[o_i][index_id] = dataset.index(item);
                                                    //                o[o_i]['id']     = o[o_i][index_id];
                                                    //                o_i++;
                                                    //                break; // string
                                                    //            case "number":
                                                    //                o.push({});
                                                    //                o_i               = (o.length - 1);
                                                    //                o[o_i][index_lex] = dataset.index(item);
                                                    //                o[o_i]['lex']     = o[o_i][index_lex];
                                                    //                o_i++;
                                                    //                break; // string
                                                    //        } // switch()
                                                    //    });
                                                } else {

                                                    predicate_index = lit_index_value_properties_fn(predicate);

                                                    value = obj['@value'];

                                                    if (value) {

                                                        language = obj['@language'];    // TODO: get from script-type

                                                        if (!language) {
                                                            type = (obj['@type'] || "xsd:string");    // TODO: get from script-type
                                                        } else {
                                                            type = "xsd:string";
                                                        } // if ()

                                                        //region REM: NOT S-RDF-conform
                                                        type_index = lit_index_entities_fn(type);
                                                        if (!result['SRDFV']['Entities'][type_index])
                                                            result['SRDFV']['Entities'][type_index] = [type, "???"];
                                                        //endregion REM: NOT S-RDF-conform

                                                        if (!result['SRDFV']['Value_properties'][predicate_index]) {

                                                            //result['SRDFV']['Value_properties'][predicate_index] = [predicate, type];

                                                            //region REM: NOT S-RDF-conform
                                                            result['SRDFV']['Value_properties'][predicate_index] = [predicate, type_index];
                                                            //endregion REM: NOT S-RDF-conform

                                                        } // if ()obj_index = lit_index_literal_values_fn(obj);

                                                        obj_index = lit_index_literal_values_fn(obj);
                                                        if (!result['SRDFV']['Literal_values'][obj_index]) {
                                                            result['SRDFV']['Literal_values'][obj_index] = ((language) ? `${value}@${language}` : value);
                                                        } // if ()

                                                        result['SRDFS'][i][1].push([predicate_index, obj_index]);

                                                    } else {

                                                    } // if ()

                                                } // if ()
                                                break; // object

                                        } // switch(typeof obj)

                                        break; // default

                                } // switch (predicate)
                                //} else {
                            } // if ()
                        } // for (const [predicate, obj]

                        //result = null;
                        //} else {
                        //    // TODO: present... so, what is to be done?!?
                    } // if ()
                } // if (id) {

            }); // graph.forEach

            //result['_entities'] = [];
            //for (const [key, value] of Object.entries(result['Entities'])) {
            //    //console.log(`${key}: ${value}`);
            //    result['_entities'].push([key, value[0], `${value[1]}`]);
            //} // for ()
            //
            //result['_entity_properties'] = [];
            //for (const [key, value] of Object.entries(result['Entity_properties'])) {
            //    //console.log(`${key}: ${value}`);
            //    result['_entity_properties'].push([key, value]);
            //} // for ()
            //
            //result['_value_properties'] = [];
            //for (const [key, value] of Object.entries(result['Value_properties'])) {
            //    //console.log(`${key}: ${value}`);
            //    result['_value_properties'].push([key, value[0], value[1]]);
            //} // for ()
            //
            //result['_srdfs'] = [];
            //for (const [key, value] of Object.entries(result['SRDFS'])) {
            //    //console.log(`${key}: ${value}`);
            //    result['_srdfs'].push([key, value[0], value[1]]);
            //} // for ()

            resolve(result);
        } catch (jex) {
            reject(jex);
        } // try
    }); // rnP
} // SRDF ()

Object.defineProperties(SRDF, {
    'deserialize':   {
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
    }, // deserialize
    'toArray':       {
        value: (data) => {
            return new Promise((resolve, reject) => {
                try {
                    let
                        result = {
                            'SRDFV': {
                                'Entities':          [],
                                'Entity_properties': [],
                                'Value_properties':  [],
                                'Literal_values':    []
                            },
                            'SRDFS': []
                        }
                    ;

                    for (const [key, value] of Object.entries(data['SRDFV']['Entities'])) {
                        result['SRDFV']['Entities'].push([key, value[0], `${value[1]}`]);
                    } // for ()

                    for (const [key, value] of Object.entries(data['SRDFV']['Entity_properties'])) {
                        result['SRDFV']['Entity_properties'].push([key, value]);
                    } // for ()

                    for (const [key, value] of Object.entries(data['SRDFV']['Value_properties'])) {
                        result['SRDFV']['Value_properties'].push([key, value[0], value[1]]);
                    } // for ()

                    for (const [key, value] of Object.entries(data['SRDFV']['Literal_values'])) {
                        result['SRDFV']['Literal_values'].push([key, value]);
                    } // for ()

                    for (const [key, value] of Object.entries(data['SRDFS'])) {
                        result['SRDFS'].push([key, value[0], value[1]]);
                    } // for ()

                    resolve(result);
                } catch (jex) {
                    reject(jex);
                } // try
            }); // rnP
        }
    }, // toArray
    'toSrdfProto':   {
        value: (data) => {
            return new Promise((resolve, reject) => {
                try {
                    let
                        result = {
                            //'SRDFV': {
                            //    'Entities':          [],
                            //    'Entity_properties': [],
                            //    'Value_properties':  [],
                            //    'Literal_values':    []
                            //},
                            'v': {
                                'entities':         [],
                                'entityProperties': [],
                                'valueProperties':  [],
                                'literalValues':  []
                            },
                            's': []
                        }
                    ;

                    for (const [key, value] of Object.entries(data['SRDFV']['Entities'])) {
                        result['v']['entities'].push({'key': key, 'entity': value[0], 'type': `${value[1]}`});
                    } // for ()
                    for (const [key, value] of Object.entries(data['SRDFV']['Entity_properties'])) {
                        result['v']['entityProperties'].push({'key': key, 'property': value});
                    } // for ()
                    for (const [key, value] of Object.entries(data['SRDFV']['Value_properties'])) {
                        result['v']['valueProperties'].push({'key': key, 'property': value[0], 'type': value[1]});
                    } // for ()
                    for (const [key, value] of Object.entries(data['SRDFV']['Literal_values'])) {
                        result['v']['literalValues'].push({'key': key, 'value': value});
                    } // for ()

                    for (const [key, value] of Object.entries(data['SRDFS'])) {

                        let node    = {
                                'iri': key,
                                'epe': [], // entity_property-entity
                                'vpv': [] // value_property-value
                            }
                        ;
                        node['epe'] = value[0].map(item => {
                            return {'pkj': item[0], 'pki': item[1]};
                        });
                        node['vpv'] = value[1].map(item => {
                            return {'pkk': item[0], 'pkl': item[1]};
                        });
                        result['s'].push(node);

                    } // for ()

                    resolve(result);
                } catch (jex) {
                    reject(jex);
                } // try
            }); // rnP
        }
    }, // toArray
    'key_1_9':       {value: _key_1_9},
    'key_1_0':       {value: _key_1_0},
    'key_a_z':       {value: _key_a_z},
    'key_A_Z':       {value: _key_A_Z},
    'key_extra':     {value: _key_extra},
    'shuffleString': {value: shuffleString}
});

exports['SRDF'] = SRDF;
