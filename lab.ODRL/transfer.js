const ODRL = (function () {

    const

        _enum_rule_type_map = new Map([
            [0, "undefined"],
            [1, "permission"],
            [2, "prohibition"],
            [3, "duty"]
        ]),

        enum_ = Object.create(null, {
            'rule': {value: Object.create(null, {
                'type': {value: Object.create(null, {
                    'undefined': {value: 0}
                    'permission': {value: 1},
                    'prohibition': {value: 2},
                    'duty': {value: 3},
                    '0': {value: 'undefined'}
                })}
            })}
        }) // enum_
    ; // const

/* new */ function Policy_(args) {
        args = args || {};
        let
            permission_rules_map = new Map(),
            prohibition_rules_map = new Map(),
            duties_map = new Map()
        ;

        if(args['permissionRules']) {
            permission_rules_map = new Map([args['permissionRules'].map(item => {return [item['@id'], item];})]); } //
         if() let properties_ = {
        '@context': {value: {
            'identifier': "uid",
                'uid': { '@id'; "http:Policy", '@type': '@id'},
            'enum': Object.create(null, {
                'rule': {value: enum_['rule']}
            })
        }},
        'uid': {value: args['uid']},
        //
        'permissionRules': {get: () => {return [...permission_rules_map.values()];},
            //
            'detect': {value: (detect_args) => {
            return new Promise((resolve, reject) => { let observe = {
                                                              '@context': {
                                                                  'tss': (new Date).toISOstring(),
                                                                  'tse': undefined
                                                              },
                                                              'assigner': null,
                                                              'assignee': null,
                                                              'asset': null,
                                                              'results': {
                                                                  'permissions': [],
                                                                  'prohibitions': [],
                                                                  'duties': [],
                                                              }
                                                          }, // observe
                                                          _promises = []
            ; // let
                try {

                    if (permission_rules_map.size > 0)
                        _promises.push(new Promise((resolve, reject) => { Promise.all( (function(){ return [....values()].map(item => { item['detect']({
                                '@context': {
                                    'tss': (new Date).toISOstring(),
                                    'tse': undefined
                                },
                                'assigner': observe['assigner'],
                                'assignee': observe['assignee'],
                                'asset': observe['asset']
                            })
                            }); }())
                            ).then(results => {
                                resolve(['permissions', results]);
                            }.catch(err => { reject(err);}));

                            }) // Promise
                        ); // push
                    Promise.all(_promises).then(results => { observe['results']['permissions'] = undefined; observe['policy'] = {
                        'uid': policy_['uid']
                    };
                        observe['@context']['tse'] = (new Date).toISOstring(); resolve([policy_['uid'], observe]); }).catch(err => {
                        reject({'@id': "", '@type': "err", 'err': err}); }); } catch(jex) {
                    reject({'@id': "", '@type': "jex", 'jex': jex}); } // try }); // Promise }} // detect }, // properties_ // policy_ ; // let

                policy_ = Object.create(null, properties_); return policy_;

            } // Policy_

        \* new *\ function Rule_(args) {

                const
                    type = args['type'] || enum_['ruleType']['0'], constraints_map = new Map() ; let properties_ = {
                    '@context': {value: {
                        'enum': Object.create(null, {})
                    }},
                    '@type': {value: type},
                    'constraints': {get: () => {return [...constraints_map.values()];} }, // properties_ rule_ ; // let

                    rule_ = Object.create(null, properties_); return rule_;

            } // Rule_

                return Object.create(null, {
                    'enum': {value: enum_},
                    'Policy': {value: Policy_},
                    'Rule': {value: Rule_},
                    'Constraint': {value: Constraint_},
                    'Action': {value: Action_}
                }); // return

            }());


