async function main() {

    const
        name             = "test.dataset.proto",
        libPath          = "C:\\fua\\DEVL\\js\\lib\\",
        protobuf         = require("protobufjs"),
        app              = require(`${libPath}core.app\\src\\core.app.js`)({
            'name':     name,
            'lib_path': libPath
        }),
        fua              = global['fua'],
        proto_idscp_root = await protobuf.load("../src/protobuf/idscp.dataset.proto"),
        proto            = {
            'Header':    proto_idscp_root.lookup("idscp.store.Header"),
            'Message':   proto_idscp_root.lookup("idscp.store.Message"),
            'Dataset':   proto_idscp_root.lookup("idscp.store.Dataset"),
            'Subject':   proto_idscp_root.lookup("idscp.store.Subject"),
            'Predicate': proto_idscp_root.lookup("idscp.store.Predicate"),
            'Object':    proto_idscp_root.lookup("idscp.store.Object"),
            //'Triple':  proto_idscp_root.lookup("idscp.store.Triple"),
            'Store':     proto_idscp_root.lookup("idscp.store.Store")
        },
        localData        = [
            {
                '@id':             "https://www.nicos-rd.com/jlangkau",
                '@type':           "foaf:Person",
                'foaf:givenName':  "Jörg",
                'foaf:familyName': "Langkau",
                'age':             {'@type': "xsd:nonNegativeInteger", "@value": "58"}
            }
            , {
                '@id':             "https://www.nicos-rd.com/spetrac",
                '@type':           "foaf:Person",
                'foaf:givenName':  "Simon",
                'foaf:familyName': "Petrac"
            }
            ,
            {
                '@id':        "https://www.nicos-rd.com/adminGroup",
                '@type':      "foaf:Group",
                'rdfs:label': {'@type': "xsd:string", '@value': "Admin Group", '@language': "en"},
                'hasMember':  [
                    "https://www.nicos-rd.com/jlangkau",
                    "https://www.nicos-rd.com/spetrac"
                ]
            }
        ],
        store            = {
            'dataset':        [],
            'context':        [],
            'condensedGraph': {}
        }

    ; // const
    Object.defineProperties(store.dataset, {
        'index': {
            value: (function ({'dataset': dataset}) {
                return (lex) => {
                    lex   = (((typeof lex) === "string") ? lex : `${lex}`);
                    let i = dataset.indexOf(lex);
                    if (i === -1) {
                        i = dataset.length;
                        dataset.push(lex);
                    } // if ()
                    return i;
                }; // return
            }({'dataset': store.dataset}))
        } // index
    });
    let
        index_context       = store.dataset.index("@context"),
        index_id            = store.dataset.index("id"),
        index_type          = store.dataset.index("@type"),
        index_lex           = store.dataset.index("lex"),
        index_datatype      = store.dataset.index("datatype"),
        index_language      = store.dataset.index("language"),
        //
        index_context_lex   = `${store.dataset.index("c")}`,
        index_id_lex        = `${store.dataset.index("id")}`,
        index_subject_lex   = `${store.dataset.index("s")}`, // TODO: drop?!?
        index_predicate_lex = `${store.dataset.index("p")}`,
        index_object_lex    = `${store.dataset.index("o")}`,
        json_store          = {
            'dataset': store.dataset,
            'context': [],
            'subject':{}
        }
    ;

    let
        context,
        blank_node_index = 0
    ;
    //let message          = proto.Message.create({
    //    'header': [{'name': "issuedAt", 'value': (new Date).toISOString()}],
    //    'store':  proto.Store.create({
    //        //'store':  proto.Store.fromObject({
    //        //'dataset': proto.Dataset.fromObject(["marzipan", "schokolade"]),
    //        //'dataset': proto.Dataset.create(["marzipan", "schokolade"]),
    //        'dataset': ["marzipan", "schokolade"],
    //        //'subject': [
    //        //    proto.Subject.fromObject({'id': "42", 'predicate': [{'id': "421", 'object': [{'lex': "4211"}]}]}),
    //        //    proto.Subject.fromObject({'id': "43", 'predicate': [{'id': "431", 'object': [{'lex': "4311"}]}]})
    //        //]
    //        'subject': [
    //            {'id': "42", '33': "33", 'predicate': [{'id': "421", 'object': [{'lex': "4211", 'language': "99"}]}]}
    //        ]
    //    })
    //});
    //let encoded          = proto.Message.encode(message).finish();
    //message              = proto.Message.decode(encoded);
    //message              = null;

    context = [
        "https://www.w3.org/1999/02/22-rdf-syntax-ns"
    ];
    context = "https://www.w3.org/1999/02/22-rdf-syntax-ns";

    function isInt(n) {
        return Number(n) === n && n % 1 === 0;
    }

    function isFloat(n) {
        return Number(n) === n && n % 1 !== 0;
    }

    function getXsdType(value) {
        if ((typeof value === "string")) {
            return "xsd:string";
        } else if (isInt(value)) {
            return "xsd:integer";
        } else if (isFloat(value)) {
            return "xsd:decimal";
        } else if ((typeof value === "boolean"))
            return "xsd:boolean";
        throw new Error(`bad type <${(typeof value)}>`);
    } // getXsdType

    function resolveContext(context, dataset, target) {

        target = (target || []);
        let
            c,
            id,
            target_i
        ;
        switch (typeof context) {
            case "string":
                target.push({});
                target_i = (target.length - 1);
                c        = target[target_i];
                c['id']  = dataset.index(context);
                break; // string
            case "object":
                if (Array.isArray(context)) {
                    context.forEach((item) => {
                        resolveContext(item, dataset, target);
                    });
                } else {
                    target.push({'attribute': [], 'property': [], 'context': []});
                    target_i = (target.length - 1);
                    c        = target[target_i];
                    c['id']  = dataset.index((context['@id'] || `_:b${(blank_node_index++)}`));
                    for (const [name, value] of Object.entries(context)) {
                        switch (name) {
                            case "@id":
                                break;
                            case "@context":
                                let _target_ = resolveContext(value, store.dataset, [])[0];
                                c['context'].push({
                                    'id':        _target_['id'],
                                    'context':   _target_['context'],
                                    'attribute': _target_['attribute'],
                                    'property':  _target_['property']
                                });
                                break;
                            default:
                                let
                                    _name  = dataset.index(name),
                                    _value = (((typeof value === "number") || (typeof value === "boolean")) ? (`${value}`) : value),
                                    _type
                                ;
                                if (typeof _value === "string") {
                                    _type = dataset.index(getXsdType(value));
                                    c['attribute'].push({'name': _name, 'value': dataset.index(_value), 'type': _type});
                                } else {
                                    let _target_ = resolveContext(value, store.dataset, [])[0];
                                    c['property'].push({
                                        'name':      _name,
                                        'id':        _target_['id'],
                                        'context':   _target_['context'],
                                        'attribute': _target_['attribute'],
                                        'property':  _target_['property']
                                    });
                                } // if ()
                                break;
                        } // switch(key)
                    } // for ()
                } // if ()
                break; // object
        } // switch(typeof obj)
        return target;
    } // resolveContext ()

    //function index(lex, dataset) {
    //    if (dataset.indexOf(lex) === -1)
    //        dataset.push(lex);
    //    return dataset.indexOf(lex);
    //}

    function resolveObject(obj, o, dataset, condensedGraph) {

        if (obj['@id']) {
            o[index_id] = datase.index(obj['@id']);
            resolveGraph([obj], dataset, condensedGraph);
        } else {
            if (obj['@value']) {
                o[index_lex] = dataset.index(obj['@value']);
                o['lex']     = o[index_lex];
                if (obj['@language']) {
                    o[index_language] = dataset.index(obj['@language']);
                    o['language']     = o[index_language];
                } else {
                    if (obj['@type']) {
                        o[index_type] = dataset.index(obj['@type']);
                        o['datatype'] = o[index_type];
                    } // if ()
                } // if ()
            } else {
                obj['@id']  = `_:b${(blank_node_index++)}`;
                o[index_id] = dataset.index(obj['@id']);
                resolveGraph([obj], dataset, condensedGraph);
            } // if ()
        } // if ()
    } // resolveObject

    function resolveGraph(graph, dataset, condensedGraph) {

        graph.forEach((resource) => {

            let
                i,
                j,
                id = (resource['@id'] || `_:b${(blank_node_index++)}`),
                subject,
                o,
                o_i
            ; // let

            if (id) {

                i = dataset.index(id);

                if (!condensedGraph[i]) {

                    condensedGraph[i] = {'id': i, 'predicate': []};
                    //json_store.subject[`${i}`] = {};

                    subject           = condensedGraph[i];

                    for (const [predicate, obj] of Object.entries(resource)) {

                        if (predicate !== "@id") {

                            j = dataset.index(predicate);

                            o = subject[j];
                            if (!o) {
                                o          = [];
                                subject[j] = o;
                                //json_store.subject[`${i}`][`${j}`] = [];
                            } // if ()

                            subject['predicate'].push({'id': j, 'object': o});
                            //json_store.subject[`${i}`][`${j}`].push( subject[j]);

                            switch (typeof obj) {
                                case "string":
                                    o.push({});
                                    o_i               = (o.length - 1);
                                    o[o_i][index_lex] = dataset.index(obj);
                                    o[o_i]['lex']     = o[o_i][index_lex];
                                    break; // string
                                case "object":
                                    if (Array.isArray(obj)) {
                                        obj.forEach((item) => {
                                            switch (typeof item) {
                                                case "string":
                                                    o.push({});
                                                    o_i              = (o.length - 1);
                                                    o[o_i][index_id] = dataset.index(item);
                                                    o[o_i]['id']     = o[o_i][index_id];
                                                    o_i++;
                                                    break; // string
                                                case "number":
                                                    o.push({});
                                                    o_i               = (o.length - 1);
                                                    o[o_i][index_lex] = dataset.index(item);
                                                    o[o_i]['lex']     = o[o_i][index_lex];
                                                    o_i++;
                                                    break; // string
                                            } // switch()
                                        });
                                    } else {
                                        o.push({});
                                        o_i = (o.length - 1);
                                        resolveObject(obj, o[o_i], dataset, condensedGraph);
                                    } // if ()
                                    break; // object
                            } // switch(typeof obj)
                            //} else {
                            //    // TODO : so what has to be done?!?
                        } // if ()
                    } // for()
                    //} else {
                    //    // TODO: present... so, what is to be done?!?
                } // if ()
            } // if (id)
        }); // graph.forEach()
    } // resolveGraph()

    context = [
        "http://www.w3.org/2001/XMLSchema#",
        {
            '@context': {
                // REM: can ONLY be used in local context, suppressed coming
                // REM: external ones...
                //'@id':   "https://www.nicos-rd.com/",
                '@base':                "https://www.nicos-rd.com/",
                'sec':                  "https://www.w3.org/1999/02/22-rdf-syntax-ns",
                'cred':                 "https://www.w3.org/2018/credentials/v1",
                "VerifiableCredential": {
                    "@id":      "https://www.w3.org/2018/credentials#VerifiableCredential",
                    "@context": {
                        "@version":   1.1,
                        "@protected": true,

                        "id":   "@id",
                        "type": "@type",

                        "cred": "https://www.w3.org/2018/credentials#",
                        "sec":  "https://w3id.org/security#",
                        "xsd":  "http://www.w3.org/2001/XMLSchema#",

                        "credentialSchema":  {
                            "@id":      "cred:credentialSchema",
                            "@type":    "@id",
                            "@context": {
                                "@version":   1.1,
                                "@protected": true,

                                "id":   "@id",
                                "type": "@type",

                                "cred": "https://www.w3.org/2018/credentials#",

                                "JsonSchemaValidator2018": "cred:JsonSchemaValidator2018"
                            }
                        },
                        "credentialStatus":  {"@id": "cred:credentialStatus", "@type": "@id"},
                        "credentialSubject": {"@id": "cred:credentialSubject", "@type": "@id"},
                        "evidence":          {"@id": "cred:evidence", "@type": "@id"},
                        "expirationDate":    {"@id": "cred:expirationDate", "@type": "xsd:dateTime"},
                        "holder":            {"@id": "cred:holder", "@type": "@id"},
                        "issued":            {"@id": "cred:issued", "@type": "xsd:dateTime"},
                        "issuer":            {"@id": "cred:issuer", "@type": "@id"},
                        "issuanceDate":      {"@id": "cred:issuanceDate", "@type": "xsd:dateTime"},
                        "proof":             {"@id": "sec:proof", "@type": "@id", "@container": "@graph"},
                        "refreshService":    {
                            "@id":      "cred:refreshService",
                            "@type":    "@id",
                            "@context": {
                                "@version":   1.1,
                                "@protected": true,

                                "id":   "@id",
                                "type": "@type",

                                "cred": "https://www.w3.org/2018/credentials#",

                                "ManualRefreshService2018": "cred:ManualRefreshService2018"
                            }
                        },
                        "termsOfUse":        {"@id": "cred:termsOfUse", "@type": "@id"},
                        "validFrom":         {"@id": "cred:validFrom", "@type": "xsd:dateTime"},
                        "validUntil":        {"@id": "cred:validUntil", "@type": "xsd:dateTime"}
                    }
                }
            }
        },
        {
            "@context": [
                {
                    "@version": 1.1
                },
                "https://w3id.org/security/v1",
                {
                    "AesKeyWrappingKey2019":             "sec:AesKeyWrappingKey2019",
                    "DeleteKeyOperation":                "sec:DeleteKeyOperation",
                    "DeriveSecretOperation":             "sec:DeriveSecretOperation",
                    "EcdsaSecp256k1Signature2019":       "sec:EcdsaSecp256k1Signature2019",
                    "EcdsaSecp256r1Signature2019":       "sec:EcdsaSecp256r1Signature2019",
                    "EcdsaSecp256k1VerificationKey2019": "sec:EcdsaSecp256k1VerificationKey2019",
                    "EcdsaSecp256r1VerificationKey2019": "sec:EcdsaSecp256r1VerificationKey2019",
                    "Ed25519Signature2018":              "sec:Ed25519Signature2018",
                    "Ed25519VerificationKey2018":        "sec:Ed25519VerificationKey2018",
                    "EquihashProof2018":                 "sec:EquihashProof2018",
                    "ExportKeyOperation":                "sec:ExportKeyOperation",
                    "GenerateKeyOperation":              "sec:GenerateKeyOperation",
                    "KmsOperation":                      "sec:KmsOperation",
                    "RevokeKeyOperation":                "sec:RevokeKeyOperation",
                    "RsaSignature2018":                  "sec:RsaSignature2018",
                    "RsaVerificationKey2018":            "sec:RsaVerificationKey2018",
                    "Sha256HmacKey2019":                 "sec:Sha256HmacKey2019",
                    "SignOperation":                     "sec:SignOperation",
                    "UnwrapKeyOperation":                "sec:UnwrapKeyOperation",
                    "VerifyOperation":                   "sec:VerifyOperation",
                    "WrapKeyOperation":                  "sec:WrapKeyOperation",
                    "X25519KeyAgreementKey2019":         "sec:X25519KeyAgreementKey2019",

                    "allowedAction":        "sec:allowedAction",
                    "assertionMethod":      {"@id": "sec:assertionMethod", "@type": "@id", "@container": "@set"},
                    "authentication":       {"@id": "sec:authenticationMethod", "@type": "@id", "@container": "@set"},
                    "capability":           {"@id": "sec:capability", "@type": "@id"},
                    "capabilityAction":     "sec:capabilityAction",
                    "capabilityChain":      {"@id": "sec:capabilityChain", "@type": "@id", "@container": "@list"},
                    "capabilityDelegation": {
                        "@id":        "sec:capabilityDelegationMethod",
                        "@type":      "@id",
                        "@container": "@set"
                    },
                    "capabilityInvocation": {
                        "@id":        "sec:capabilityInvocationMethod",
                        "@type":      "@id",
                        "@container": "@set"
                    },
                    "caveat":               {"@id": "sec:caveat", "@type": "@id", "@container": "@set"},
                    "challenge":            "sec:challenge",
                    "ciphertext":           "sec:ciphertext",
                    "controller":           {"@id": "sec:controller", "@type": "@id"},
                    "delegator":            {"@id": "sec:delegator", "@type": "@id"},
                    "equihashParameterK":   {"@id": "sec:equihashParameterK", "@type": "xsd:integer"},
                    "equihashParameterN":   {"@id": "sec:equihashParameterN", "@type": "xsd:integer"},
                    "invocationTarget":     {"@id": "sec:invocationTarget", "@type": "@id"},
                    "invoker":              {"@id": "sec:invoker", "@type": "@id"},
                    "jws":                  "sec:jws",
                    "keyAgreement":         {"@id": "sec:keyAgreementMethod", "@type": "@id", "@container": "@set"},
                    "kmsModule":            {"@id": "sec:kmsModule"},
                    "parentCapability":     {"@id": "sec:parentCapability", "@type": "@id"},
                    "plaintext":            "sec:plaintext",
                    "proof":                {"@id": "sec:proof", "@type": "@id", "@container": "@graph"},
                    "proofPurpose":         {"@id": "sec:proofPurpose", "@type": "@vocab"},
                    "proofValue":           "sec:proofValue",
                    "referenceId":          "sec:referenceId",
                    "unwrappedKey":         "sec:unwrappedKey",
                    "verificationMethod":   {"@id": "sec:verificationMethod", "@type": "@id"},
                    "verifyData":           "sec:verifyData",
                    "wrappedKey":           "sec:wrappedKey"
                }
            ]
        }
        //,
        //"https://www.w3.org/1999/02/22-rdf-syntax-ns",
        //"https://www.w3.org/2018/credentials/v1"
    ];

    store.context = resolveContext(context, store.dataset);
    resolveGraph(localData, store.dataset, store.condensedGraph);

    let
        message = proto.Message.create({
            'header': [{'name': "issuedAt", 'value': (new Date).toISOString()}],
            'store':  proto.Store.create({
                'dataset': store.dataset,
                'context': store.context,
                'subject': Object.values(store.condensedGraph)
            })
        }),
        encoded = proto.Message.encode(message).finish()
    ;

    message = proto.Message.decode(encoded);

    console.log(JSON.stringify(message, "", "\t"));
    proto;

}

main();



