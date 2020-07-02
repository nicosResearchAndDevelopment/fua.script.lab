/*



<policy id='urn:policy:cs4:showEmployees' description='Prohibits access to employees after 3pm'>
  <preventiveMechanism id='showEmployees'>

    <event action='urn:action:cs4:showEmployees'/>

    <condition>
      <function:lessEqual>
        <constant:int value='15'/>
        <pip:int method='getCurrentHour' default='0' />
      </function:lessEqual>
    </condition>

    <authorizationDecision name='showEmployeesDecision'>
      <inhibit/>
    </authorizationDecision>
  </preventiveMechanism>
</policy>


 */

let
    POLICY_0 = (function () {

        return function (args) {
            let
                policy_id,
                policy_description = ""
            ;

            //region fn
            function policy_id_(id) {

                let return_ = {};

                if (policy_id || !id)
                    throw new Error();

                if (!policy_description)
                    return_['description'] = policy_description_;

                return return_;

            } // policy_id_

            function policy_description_(description) {
                let return_ = {};

                policy_description = description;

                if (!policy_id)
                    return_['id'] = policy_id_;

                return_['preventiveMechanism'] = preventiveMechanism_;

                return return_;

            } // policy_description_

            function preventiveMechanism_(id) {
                let return_ = {};

                return_['event'] = (action) => {
                    let return_ = {};
                    return_['condition'] = {
                        'function': (type) => {
                            let return_ = {};
                            switch (type) {
                                case "lessEqual":
                                    return_['constant'] = (type) => {
                                        let return_ = {};
                                        switch (type) {
                                            case "int":
                                                return_['value'] = (value) => {

                                                };
                                            default:
                                                break;
                                        } // switch
                                        return return_;
                                    };
                                    break; // lessEqual
                                default:
                                    break; // default
                            } // switch
                        } // func
                    }; // condition
                    return return_;
                };
                return return_;

            } // preventiveMechanism

            function execute_() {
                return new Promise((resolve, reject) => {
                    let
                        result_ = {'s': true, '@type': "v", 'v': undefined}
                    ;
                    try {
                        resolve(result_);
                    } catch (jex) {
                        reject({'jex': jex});
                    } // try
                });
            } // execute_

            //endregion fn

            return {
                'id': policy_id_
            };

        }; // return
    }()),
    POLICY = (function () {

        function _function(config) {
            return (args) => {
                return new Promise((resolve, reject) => {
                    let
                        result_ = {
                            's': true,
                            '@type': "v",
                            'tss': (new Date).valueOf(),
                            'tse': undefined,
                            'v': undefined
                        }
                    ;
                    try {
                        if (!rtr_) {
                            reject({'err': new Error()});
                        } else {
                            result_['tse'] = (new Date).valueOf();
                            resolve(result_);
                        } // if ()
                    } catch (jex) {
                        reject({'jex': jex});
                    } // try
                }); // return new Promise()
            }; // return
        } // _function

        function _condition(config) {

            let
                _first_literal,
                return_
            ;
            _first_literal = (config['function']) ? "function" : ((config['and']) ? "and" : ((config['or']) ? "OR" : undefined));
            switch (_first_literal) {
                case "function":
                    return_ = new _function(config['function']);
                    break; // function
                case "and":
                    //REM: all have to be true...
                    break;
                case "or":
                    //REM: only one has to be true...
                    break;
                default:
                    return_ = (args) => {
                        return new Promise((reolve, reject) => {
                            reject({'err': new Error()});
                        })
                    };
                    break;
            } // switch (_first_literal)
            return return_; // a Promise given fn
        } // _condition

        function _preventive_mechanism(config) {
            let
                _properties = {},
                mechanism_
            ;
            _properties['id'] = {value: config['id']};
            _properties['event'] = {value: config['event']['action']};

            _properties['condition'] = {value: new _condition(config['condition'])};

            _properties['execute'] = {
                value: (args) => {
                    return new Promise((resolve, reject) => {
                        let
                            result_ = {
                                's': true,
                                '@type': "v",
                                'tss': (new Date).valueOf(),
                                'tse': undefined,
                                'v': undefined
                            }
                        ;
                        try {
                            if (!rtr_) {
                                reject({'err': new Error()});
                            } else {
                                result_['tse'] = (new Date).valueOf();
                                resolve(result_);
                            } // if ()
                        } catch (jex) {
                            reject({'jex': jex});
                        } // try
                    }); // return new Promise()
                } // value
            }; // execute

            mechanism_ = Object.create(null, _properties);

            return mechanism_;

        } // _preventive_mechanism

        function _authorization_decision(config) {
            let
                _name = config['name'],
                result_ = {'@type': ((config['inhibit']) ? "inhibit" : "asdf")}
            ;
            return result_;
        } // _authorization_decision

        return function (config) {

            let
                event_action = null,
                _mechanism = null,
                _decision = null,
                //
                rtr_ = false
            ;

            if (config['preventiveMechanism']) {
                _mechanism = new _preventive_mechanism(config['preventiveMechanism']);
                event_action = _mechanism['event'];
            } else {

            } // if ()
            if (config['authorizationDecision ']) {
                _decision = new _authorization_decision(config['authorizationDecision']);
            } else {

            } // if ()
            if (!event_action)
                throw new Error();

            return [event_action, {
                'execute': (/* set at runtime by PEP */ args) => {
                    return new Promise((resolve, reject) => {
                        let
                            result_ = {
                                's': true,
                                '@type': "v",
                                'tss': (new Date).valueOf(),
                                'tse': undefined,
                                'v': undefined
                            }

                        ;
                        try {
                            if (!rtr_) {
                                reject({'err': new Error()});
                            } else {
                                result_['tse'] = (new Date).valueOf();
                                resolve(result_);
                            } // if ()
                        } catch (jex) {
                            reject({'jex': jex});
                        } // try
                    }); // return new Promise()
                }, // execute
                'inspect': () => {
                    return new Promise((resolve, reject) => {
                        let
                            result_ = {'s': true, '@type': "v", 'v': undefined}
                        ;
                        try {
                            resolve(result_);
                        } catch (jex) {
                            reject({'jex': jex});
                        } // try
                    }); // return new Promise()
                } // inspect
            }]; // return

        }; // return function (config)
    }())
; // let

// let
//     policy = new POLICY({
//         'id': "urn:policy:cs4:showEmployees",
//         'description': "Prohibits access to employees after 3pm"
//     })
//         .preventiveMechanism({'id': "showEmployees"})
//         .event({'action': "urn:action:cs4:showEmployees"})
//         .condition({'function': "lessEqual"})
//         .function("lessEqual")
//         .constant("int").value('15')
//         .pip("int").method("getCurrentHour").default('0')
// ;
// policy.preventiveMechanism()
//     .authorizationDecision({name: "showEmployeesDecision"})
//     .inhibit()
//
// policy.execute().then((result) => {
//     result;
// }).catch((err) => {
//     err;
// });

let
    policy_config = {

        '@context': {
            'nid': "@id",
            'HasTypeDefinition': '@type'
        },

        'BrowseName': "policy_cs4_showEmployees",
        'DisplayName': "showEmployees",
        'Description': "Prohibits access to employees after 3pm",
        'nid': "ns=9999;s=urn:policy:cs4:showEmployees",
        'HasTypeDefinition': "PolicyType",

        'preventiveMechanism': {
            'id': "showEmployees",
            'event': {'action': "urn:action:cs4:showEmployees"},
            'condition': {
                'function': {
                    'pip': {
                        'type': "int",
                        'method': "getCurrentHour",
                        'default': '0'
                    },
                    'type': "lessEqual",
                    'constant': {
                        'type': "int",
                        'value': '15'
                    }
                } // function
            } // condition
        } // preventiveMechanism
    },
    policy,
    time = {
        'getCurrentHour': (args) => {
            return new Promise((resolve, reject) => {
                resolve({'v': parseInt((new Date).getHours() || args['default'] || 0)});
            });
        }
    },
    PIP = {
        'methods': [
            ['getCurrentHour', time['getCurrentHour']]
        ]
    },
    policies = new Map()
;

policy = new POLICY(policy_config);
policies.set(policy[0], policy[1]);
policies;