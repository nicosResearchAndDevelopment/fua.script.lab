exports['graph'] = [
    {
        '@id':   "https://www.nicos-rd.com/jlangkau",
        '@type': "foaf:Person",
        'rdfs:label': {"@value": "genau", "@language": "de"},
        //'foaf:givenName':  "Jörg",
        //'foaf:familyName': {"@type": "xsd:string", "@value": "Langkau"},
        //'age':             {'@type': "xsd:nonNegativeInteger", "@value": "58"}
    }
    , {
        '@id':             "https://www.nicos-rd.com/spetrac",
        '@type':           "foaf:Person",
        'foaf:givenName':  "Simon",
        'foaf:familyName': "Petrac"
    }
    , {
        '@id':             "https:www.aisec.fraunhofer.de/gbrost",
        '@type':           "foaf:Person",
        'foaf:givenName':  "Gerd",
        'foaf:familyName': "Brost"
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
];