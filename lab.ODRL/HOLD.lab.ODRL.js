const
    path_ = "lab.ODRL"

;

//const
//    EventEmitter    = require('events')
//;

//region json-ld template
const model = {
    '@context': {}
}; // model
//endregion json-ld template

const u = {
    core:   {
        callback: (err, result) => {
            return (err) ? err : result;
        },
        map:      {
            facade: (map, steer) => {
                let
                    add_    = (key, value, callback) => {
                        let
                            result_ = {'s': true}
                        ;
                        return new Promise((resolve, reject) => {
                            try {
                                map.set(key, value);
                                resolve(result_);
                            } catch (jex) {
                                reject(jex);
                            } // try }); // Promise }, // facade_ = {} ;
                        }); // Promise
                    }, // add_
                    //
                    facade_ = {}
                ;

                if (steer['add'])
                    facade_['add'] = {value: add_};

                //REM: vielleicht ist size das einzige, das anonym erreichbar ist?
                //
                facade_['size'] = {
                    get: () => {
                        return map.size;
                    }
                };
                if (steer['keys'])
                    facade_['keys'] = {
                        get: () => {
                            return [...map.keys()];
                        }
                    };
                if (steer['values'])
                    facade_['valeus'] = {
                        get: () => {
                            return [...map.values()];
                        }
                    };
                if (steer['entries'])
                    facade_['entries'] = {
                        get: () => {
                            return [...map.entries()];
                        }
                    };
                //REM: NO seal, so all properties have to be seized very well!
                return Object.create(null, facade_);

            } // facade
        } // map
    }, // core
    module: {
        ODRL: null
    } // module
}; // u

u.module.ODRL = (function () {
    const
        _RuleType_enum          = {
            'PermissionRule':  "PermissionRule",
            'ProhibitionRule': "ProhibitionRule",
            'DutyRule':        "DutyRule"
        }, // _RuleType_enum
        _Action_execute_default = (args) => {
            return new Promise((resolve, reject) => {
                const
                    err_    = {'g': "a1813c15-6769-4c00-96e4-97efe92239e8", 'm': `Actions 'execute' NOT implemented`},
                    result_ = {'s': false}
                ;
                reject(err_);
            }); // Promise
        }, // _Action_execute_default
        _Rule_detect_default    = (args) => {
            return new Promise((resolve, reject) => {
                const
                    err_    = {'g': "ced7e257-ca47-44f9-b75b-40b902d65e15", 'm': `Rules 'detect' NOT implemented`},
                    result_ = {'s': false}
                ;
                reject(err_);
            }); // Promise
        } // _Action_execute_default
    ;

    return Object.seal(Object.create(null, {
        //TODO: Policy is derived from an asset!
        'Policy': {
            value: (function () {

                function _Policy_addRules(rules, rules_to_add) {
                    let
                        _promises = [],
                        _fn       = (rules, rule) => {
                            let
                                err_    = null,
                                result_ = {'s': true, 'r': []}
                            ;

                            return new Promise((resolve, reject) => {
                                try {
                                    if (!rule['nid']) {
                                        result_['s'] = false;
                                        err_         = {
                                            'g': "41d5a7d4-9211-4445-ae67-fb970d2d88c8",
                                            'm': `rule : NodeId (nid) is missing.`
                                        };
                                    } else {
                                        if (rules['all'].has(rule['nid'])) {
                                            result_['s'] = false;
                                            err_         = {
                                                'g': "9af0343c-ddbb-46c6-88a5-cdfbc70af956",
                                                'm': `rule '${rule['nid']}' already present.`
                                            };
                                        } else {
                                            if (typeof rule['detect'] !== 'function') {
                                                result_['s'] = false;
                                                err_         = {
                                                    'g': "6449254f-53c7-4802-8531-0cd07c96164a",
                                                    'm': `rule '${rule['nid']}' has no Promise 'detect'.`
                                                };
                                            } else {
                                                switch (rule['type']) {
                                                    case "PermissionRule":
                                                    case "ProhibitionRule":
                                                    case "DutyRule":
                                                        rules['all'].set(rule['nid'], rule);
                                                        break;
                                                    default:
                                                        break;
                                                } // switch()
                                                switch (rule['type']) {
                                                    case "PermissionRule":
                                                        rules['permissions'].set(rule['nid'], rule);
                                                        result_['r'].push(`rule '${rule['nid']}' added to 'permissions'`);
                                                        break;
                                                    case "ProhibitionRule":
                                                        rules['prohibitions'].set(rule['nid'], rule);
                                                        result_['r'].push(`rule '${rule['nid']}' added to 'prohibitions'`);
                                                        break;
                                                    case "DutyRule":
                                                        rules['duties'].set(rule['nid'], rule);
                                                        result_['r'].push(`rule '${rule['nid']}' added to 'duties'`);
                                                        break;
                                                    default:
                                                        result_['s'] = false;
                                                        err_         = {
                                                            'g': "9b8f331c-7455-4779-8027-091180834609",
                                                            'm': `rule '${rule['nid']}' has unkown type '${rule['type']}'.`
                                                        };
                                                        break;
                                                } // switch()
                                            } // if ()
                                        } // if ()
                                    } //if ()
                                    if (err_) {
                                        reject(err_);
                                    } else {
                                        resolve(result_);
                                    } // if ()
                                } catch (jex) {
                                    reject(jex);
                                } // try
                            }); // Promise
                        }
                        //, // _fn
                        ////
                        //err_      = null,
                        //result_   = {'s': true}
                    ; // let

                    rules_to_add.forEach((rule) => {
                        _promises.push(_fn(rules, rule));
                    });
                    return Promise.all(_promises);
                } // _Policy_addRules

                return function (args) {

                    return (function (inner_args) {

                        let
                            nid_        = inner_args['nid'] || `ns=1;s=${Math.random()}-${Math.random()}-${Math.random()}`,
                            rules_      = {
                                'all':          new Map(),
                                'permissions':  new Map(),
                                'prohibitions': new Map(),
                                'duties':       new Map()
                            },
                            //
                            properties_ = {},
                            self_
                        ;

                        properties_['type']           = {value: "Policy"};        // ODRL
                        properties_['nid']            = {value: nid_};            // OPCUA
                        properties_['uid']            = {value: nid_};            // ODRL
                        properties_['inheritAllowed'] = {value: (typeof inner_args['inheritAllowed'] === 'boolean') ? inner_args['inheritAllowed'] : false};            // ODRL

                        properties_['rules'] = {
                            get: () => {
                                return {
                                    'all':          u.core.map.facade(rules_['all'], {'size': true}),
                                    'permissions':  u.core.map.facade(rules_['permissions'], {'size': true, 'entries': true, 'values': true, 'keys': true}),
                                    'prohibitions': u.core.map.facade(rules_['prohibitions'], {'size': true, 'entries': true, 'values': true, 'keys': true}),
                                    'duties':       u.core.map.facade(rules_['duties'], {'size': true, 'entries': true, 'values': true, 'keys': true})
                                };
                            }
                        };

                        properties_['addRules'] = {
                            value: (rules, callback) => {
                                return _Policy_addRules(rules_, rules); // Promise
                            } // value
                        }; // addRules

                        self_ = Object.create(null, properties_);

                        properties_ = null;

                        return self_;

                    })(/* inner_args */ args);
                } // return
            }()) // value
        }, // Policy

        'Rule': {
            value: (function () {

                //region Rule
                //region Rule.fn
                function Rule(args) {

                    if (!args['Actions'])
                        throw `there has to be at least one action! g: "829b2164-b181-4d4d-81fb-c1f856bf23d4"`;

                    const
                        Actions_ = new Map(),
                        Constraints_ = new Map()
                    ;
                    _Rule_addActions(Actions_, args['Actions']).then((result) => {
                        //result = result;
                        //throw new Error(err);
                        _Rule_addConstraints(Constraints_, (args['Constraints'] || [])).then((result) => {
                            result = result;
                        }).catch ((err)=> {
                            throw new Error(err);
                        });
                    }).catch((err) => {
                        throw new Error(err);
                    });
                    return Object.create(null, {
                        'nid':     {
                            value: args['nid'] || `ns=1;s=${Math.random()}-${Math.random()}-${Math.random()}`
                        },
                        'type':    {value: args['type']},
                        'Actions': {
                            value: u.core.map.facade(Actions_, {'size': true, 'entries': true})
                        },
                        'Constraints': {
                            value: u.core.map.facade(Constraints_, {'size': true, 'entries': true})
                        }
                    });
                } // Rule

                function _Rule_addActions(actions, actions_to_add) {
                    let
                        _promises = [],
                        _fn       = (actions, action) => {
                            let
                                err_    = null,
                                result_ = {'s': true, 'r': []}
                            ;

                            return new Promise((resolve, reject) => {
                                try {
                                    if (!action['nid']) {
                                        result_['s'] = false;
                                        err_         = {
                                            'g': "f1972f82-0c3d-4abc-800e-086480568855",
                                            'm': `action : NodeId (nid) is missing.`
                                        };
                                    } else {
                                        if (actions.has(action['nid'])) {
                                            result_['s'] = false;
                                            err_         = {
                                                'g': "5e38d41d-4490-4d12-8b94-725f74f7c6ca",
                                                'm': `action '${action['nid']}' already present.`
                                            };
                                        } else {
                                            if (typeof action['execute'] !== 'function') {
                                                result_['s'] = false;
                                                err_         = {
                                                    'g': "dc7836a6-9445-40c2-8139-887f3341c6c7",
                                                    'm': `action '${action['nid']}' has no Promise 'execute'.`
                                                };
                                            } else {
                                                actions.set(action['nid'], action);
                                            } // if ()
                                        } // if ()
                                    } //if ()
                                    if (err_) {
                                        reject(err_);
                                    } else {
                                        resolve(result_);
                                    } // if ()
                                } catch (jex) {
                                    reject(jex);
                                } // try
                            }); // Promise

                        } // _fn
                    ; // let

                    actions_to_add.forEach((action) => {
                        _promises.push(_fn(actions, action));
                    });
                    return Promise.all(_promises);
                } // _Rule_addActions
                function _Rule_addConstraints(constraints, constraints_to_add) {
                    let
                        _promises = [],
                        _fn       = (constraints, constraint) => {
                            let
                                err_    = null,
                                result_ = {'s': true, 'r': []}
                            ;

                            return new Promise((resolve, reject) => {
                                try {
                                    if (!constraint['nid']) {
                                        result_['s'] = false;
                                        err_         = {
                                            'g': "f5b77c84-847e-4b02-b88b-fa050e9e383b",
                                            'm': `constraint : NodeId (nid) is missing.`
                                        };
                                    } else {
                                        if (constraints.has(constraint['nid'])) {
                                            result_['s'] = false;
                                            err_         = {
                                                'g': "ca26f41c-c546-4f2e-8376-b6b176a992c5",
                                                'm': `constraint '${constraint['nid']}' already present.`
                                            };
                                        } else {
                                            if (typeof constraint['execute'] !== 'function') {
                                                result_['s'] = false;
                                                err_         = {
                                                    'g': "e9129ec5-e8cc-4eb3-b429-4b189431ba2a",
                                                    'm': `constraint '${constraint['nid']}' has no Promise 'execute'.`
                                                };
                                            } else {
                                                constraints.set(constraint['nid'], constraint);
                                            } // if ()
                                        } // if ()
                                    } //if ()
                                    if (err_) {
                                        reject(err_);
                                    } else {
                                        resolve(result_);
                                    } // if ()
                                } catch (jex) {
                                    reject(jex);
                                } // try
                            }); // Promise

                        } // _fn
                    ; // let

                    constraints_to_add.forEach((constraint) => {
                        _promises.push(_fn(constraints, constraint));
                    });
                    return Promise.all(_promises);
                } // _Rule_addConstraints

                //endregion Rule.fn
                //endregion Rule

                return Object.seal(Object.create(null, {
                    'enum': {
                        value: {
                            'RuleType': _RuleType_enum
                        } // value
                    },

                    'Action': {
                        value: (function () {
                            return function (args) {

                                if (!args['name'])
                                    throw `name is missing. g: "3efc4689-5112-4333-a6aa-b87edb368831"`;

                                let
                                    properties_ = {
                                        'nid':        {value: (args['nid']) ? args['nid'] : `ns=1;s=${Math.random()}-${Math.random()}-${Math.random()}`},
                                        'name':       {value: args['name']},
                                        'BrowseName': {value: args['name']},
                                        'execute':    {value: (typeof args['execute'] === 'function') ? args['execute'] : _Action_execute_default}
                                    },
                                    self_
                                ;
                                self_           = Object.create(null, properties_);
                                properties_     = undefined;
                                return self_;
                            }; // return
                        }()) // value
                    }, // Action

                    'Permission': {
                        value: (function () {
                            return function (args) {
                                let
                                    properties_ = {
                                        'detect': {
                                            value: (typeof args['detect'] === 'function') ? args['detect'] : _Rule_detect_default // value
                                        } // detect
                                    }, // properties_
                                    self_
                                ; // let
                                self_           = Object.create(new Rule({
                                    'type':    _RuleType_enum['PermissionRule'],
                                    'nid':     undefined,
                                    'Actions': args['Actions']
                                }), properties_);
                                properties_     = undefined;
                                return self_;
                            };
                        }()) // value
                    }, // Permission

                    'Prohibition': {
                        value: (function () {
                            return function (args) {
                                let
                                    properties_ = {
                                        'detect': {
                                            value: (typeof args['detect'] === 'function') ? args['detect'] : _Rule_detect_default // value
                                        } // detect
                                    }, // properties_
                                    self_
                                ; // let
                                self_           = Object.create(new Rule({
                                    'type':    _RuleType_enum['ProhibitionRule'],
                                    'nid':     undefined,
                                    'Actions': args['Actions']
                                }), properties_);
                                properties_     = undefined;
                                return self_;
                            }; // return
                        }()) // value
                    }, // Prohibition

                    'Duty': {
                        value: (function () {
                            return function (args) {
                                const
                                    uid         = args['uid'] || args['nid']
                                ;
                                let
                                    properties_ = {
                                        'uid':    {
                                            //REM: ODRL.Duty.uid
                                            get: () => {
                                                return (uid) ? uid : self_['nid'];
                                            }
                                        },
                                        'detect': {
                                            value: (typeof args['detect'] === 'function') ? args['detect'] : _Rule_detect_default // value
                                        } // detect
                                    }, // properties_
                                    self_
                                ; // let
                                self_           = Object.create(new Rule({
                                    'type':    _RuleType_enum['DutyRule'],
                                    'nid':     undefined,
                                    'Actions': args['Actions']
                                }), properties_);
                                properties_     = undefined;
                                return self_;
                            }; // return
                        }()) // value
                    } // Duty
                }));
            }()) // value
        } // Rule
    })); // return
}()); // u.module.ODRL

const
    ODRL                    = u.module.ODRL,
    ActionSet               = new Map(),
    RuleSet                 = new Map(),
    PolicySet               = new Map()
;

let
    policy_of_truth_options = {},
    policy_of_truth,
    policy_of_truth_rules,
    policy_of_truth_rules_size,
    policy_of_truth_permission_one,
    policy_of_truth_prohibition_one,
    policy_of_truth_duty_one
;

ActionSet.set("grunz", new ODRL.Rule.Action({
    'name':    "grunz",
    'execute': (args) => {
        let
            _args = args
        ;
        return new Promise((resolve, reject) => {
            let
                result_ = {'s': true, 'tss': (new Date).valueOf(), 'tse': undefined, 'v': undefined, 'r': []}
            ;
            try {
                resolve(result_);
            } catch (jex) {
                reject(err);
            } // try
        });
    } // execute
})); // ActionSet.set("grunz")

PolicySet.set('policy_of_truth', new ODRL.Policy(policy_of_truth_options));
policy_of_truth = PolicySet.get('policy_of_truth');

policy_of_truth_rules      = policy_of_truth.rules;
policy_of_truth_rules_size = policy_of_truth_rules.size;

RuleSet.set('policy_of_truth_permission_one', new ODRL.Rule.Permission({
    'Actions': [ActionSet.get('grunz')],
    'detect':  (args) => {
        return new Promise((resolve, reject) => {
            try {
                let
                    result_ = {'s': true, 'v': false}
                ;
                resolve(result_);
            } catch (jex) {
                reject(jex);
            } // try
        }) // Promise
    } // detect
}));

RuleSet.set('policy_of_truth_prohibition_one', new ODRL.Rule.Prohibition({
    'Actions': [ActionSet.get('grunz')],
    'detect':  (args) => {
        return new Promise((resolve, reject) => {
            try {
                let
                    result_ = {'s': true, 'v': true}
                ;
                resolve(result_);
            } catch (jex) {
                reject(jex);
            } // try
        }); // Promise
    } // detect
}));

//policy_of_truth_duty_one        = new ODRL.Rule.Duty({
//    // REM: so it will throw, because there has to be at last one Action!
//    //'Actions': [ActionSet.get('grunz')],
//    'detect': (args) => {
//        return new Promise((resolve, reject) => {
//            try {
//                let
//                    result_ = {'s': true, 'v': true}
//                ;
//                resolve(result_);
//            } catch (jex) {
//                reject(jex);
//            } // try
//        }); // Promise
//    } // detect
//});

policy_of_truth.addRules([
    RuleSet.get('policy_of_truth_permission_one'),
    RuleSet.get('policy_of_truth_prohibition_one'),
    //,policy_of_truth_duty_one
]).then((result) => {
    result = result;
}).catch((err) => {
    err = err;
});

console.log(`${path_} : reached : END`);