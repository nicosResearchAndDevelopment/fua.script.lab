// [jspath](https://www.npmjs.com/package/jspath)

const
    JSPath = require("jspath")
;

let
    constraint,
    target,
    collection,
    directive,
    reduce,
    result
; // let

constraint = [{
    "leftOperand":  "maker",
    "operator":     "eq",
    "rightOperand": {"@value": "Honda", "@type": "xsd:string"}
}];

reduce = {
    //REM: '@id' has to be explicitly set <false> to be suppressed!
    //REM:  <true> = direct
    //REM:  <fn> = (value) => { return value; )
    //'@id':   false,     //REM: so, suppressed
    //'@id':   undefined, //REM: so, direct atribute-flow
    //'@id':   true,      //REM: so, direct atribute-flow
    '@id':   function (value) {
        return `http://www.example.com/${value}/`;
    }, //REM: ...so, be modified
    //REM: '@type' has to be explicitly set <false> to be suppressed!
    //REM:  <true> = direct
    //REM:  <fn> = (value) => { return value; )
    //'@type': false,
    'maker': true, // direct
    'year':  function (value) {
        return (value * 1000);
    }
};

function Refinement({'@id': id, 'constraint': constraint, 'reduce': reduce}) {

    const
        directive = build_directive({'target': "collection", 'constraint': constraint})
    ; // const

    return ({'collection': collection}) => {
        let
            //result = JSON.parse(JSON.stringify(JSPath.apply(
            result = JSPath.apply(
                directive,
                {
                    "collection": collection
                }
            ),
            //)),
            _result
        ; // let
        if (reduce) {
            let
                _id   = ((typeof reduce['@id'] === 'boolean') ? ((reduce['@id']) ? (value) => value : false) : ((reduce['@id']) ? /** fn */ reduce['@id'] : (value) => value)),
                _type = ((typeof reduce['@type'] === 'boolean') ? ((reduce['@type']) ? (value) => value : false) : ((reduce['@type']) ? /** fn */ reduce['@type'] : (value) => value))
            ; // let
            _result   = [];
            result.map((node) => {
                let
                    _touched = false,
                    node_    = {}
                ; // let

                if (_id && node['@id'])
                    node_['@id'] = _id(node['@id']);
                if (_type && node['@type'])
                    node_['@type'] = _type(node['@type']);

                Object.keys(reduce).forEach((name) => {
                    switch (typeof reduce[name]) {
                        case "boolean":
                            if (reduce[name]) {
                                _touched    = true;
                                node_[name] = node[name];
                            } // if ()
                            break; // boolean
                        case "function":
                            _touched    = true;
                            node_[name] = reduce[name](node[name]);
                            break; // function
                        default:
                            break; // default
                    } // switch(typeof reduce[name])
                }); // Object.keys(reduce)
                if (_touched)
                    _result.push(node_);
            }); // result.map()
            result = _result;
        } // if ()
        return result;
    }; // return fn()

} // function Refinement ()

function build_directive({'target': target, 'constraint': constraint}) {

    let
        directive       = `.${target}{`,
        operator_mapper = {
            'odrl': {
                'eq': "==="
            }
        },
        is_array        = Array.isArray(constraint),
        and_or          = "&&"
    ; // let

    function build_constraint(constraint) {

        let
            directive = ``,
            splitter  = constraint['operator'].split(":"),
            //TODO:shorten >>> so dismiss 'operator' an pu directly in...
            operator  = ((splitter.length === 2) ? [splitter[0].toLowerCase(), splitter[1]] : ["odrl", splitter[0]])
        ; // let
        directive     = `${directive}(.${constraint['leftOperand']} ${operator_mapper[operator[0]][operator[1]]} "${constraint['rightOperand']['@value']}")`;
        //result        = `${directive})`;

        return directive;

    } // function build_constraint()

    function get_logical(constraint) {

        if (constraint['or']) {
            return "or";
        } else if (constraint['xone']) {
            return "xone";
        } else if (constraint['and']) {
            return "and";
        } else if (constraint['addSequence']) {
            return "addSequence";
        } // if ()

        return undefined;

    } // function get_logical()

    if (!is_array) {
        constraint = [constraint];
    } // if ()

    constraint.map((c) => {

        let logical = get_logical(c);

        switch (logical) {
            case "and":
                directive = `(${directive}`;
                c['@list'].map((c) => {
                    directive = `${directive}${build_constraint(c)} && `;
                });
                directive = `${directive.substring(0, (directive.length - 4))}}) ${and_or} `;
                break; // and
            case "or":
                directive = `(${directive}`;
                c['@list'].map((c) => {
                    directive = `${directive}${build_constraint(c)} || `;
                });
                directive = `${directive.substring(0, (directive.length - 4))}}) ${and_or} `;
                break; // or
            case "xone":
                //TODO: 'xone' :: hier muss offensichtlich über alle GETRENNT gesucht werden
                //TODO:  es darf nur einer (!!!) ein Ergebnis zurück geben...
                //TODO:  JSPath * @list.length...
                //TODO:  trifft das nicht zu, dann ist das result eine leere Menge = []
                //Promise.all([]).then((results) => {
                // wenn nur einer results[i] ein result hat, dann ist das die Ergenismenge (auf result)
                // );
                throw new Error('xone');
                break; // xone
            case "andSequence":
                //TODO: ???
                //TODO:  JSPath * @list.length...
                throw new Error('andSequence');
                break; // andSequence
            case undefined:
                directive = `${directive}${build_constraint(c)} ${and_or} `;
                break; // undefined
            default:
                throw new Error();
                break; // default
        } // switch(logical)
    }); // constraint.map()

    //REM: check for LogicalConstraint

    //switch (logical) {
    //    case "and":
    //        constraint.map((c) => {
    //            directive = `${directive}${build_constraint(c)} && `;
    //        });
    //        break; // and
    //    default:
    //        throw new Error();
    //        break; // default
    //} // switch(logical)

    //REM: delete last " && ";
    //directive = `${directive.substring(0, (directive.length - 4))}}`;
    //return directive;
    return `${directive.substring(0, (directive.length - 4))}}`;

} // function build_directive()

target = "contains";

collection = [
    {"@id": "1", "@type": "car", "maker": "Nissan", "model": "Teana", "year": 2011},
    {"@id": "2", "@type": "car", "maker": "Honda", "model": "Jazz", "year": 2010},
    {"@id": "3", "@type": "car", "maker": "Honda", "model": "Civic", "year": 2007},
    {"@id": "4", "@type": "car", "maker": "Toyota", "model": "Yaris", "year": 2008},
    {"@id": "5", "@type": "car", "maker": "Honda", "model": "Accord", "year": 2011},
    {"@id": "6", "@type": "car", "maker": "VW", "model": "golf", "year": 1962}
];

if (false) {
    result = JSPath.apply(
        '.contains{((.maker === "Honda") && (.year > 2009)) || (.year === 1962)}',
        {
            "contains": collection
        }
    ); // JSPath.apply()
} else {
    let refinement = Refinement({'@id': "grunz", 'constraint': constraint, 'reduce': reduce});
    result         = refinement({'collection': collection});
} // if (shield)

console.log(`${JSON.stringify(result, "", "\t")}`);

throw new Error();