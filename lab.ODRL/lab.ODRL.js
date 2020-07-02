const
    path_ = "lab.ODRL"
    //
;

global['u'] = {
    'module': {
        value: {}
    }
};

require("./fua.module.ODRL");

// let asdf = Object.create(null, global['u']['module']);
global['u'] = Object.create(null, global['u']);

let
    policy_one,
    policy_one_config = {
        '@context': {
            "nid": "@id",
            "HasTypeDefinition": "@type"
        },
        'nid': "ns=9999;s=ODRL_policy_one",
        'BrowseName': "policy_one",
        'HasTypeDefinition': "Policy", //OR: PolicyType
        //
        'Reference': [
            ['HasRule', [
                ['ns=9999;i=ODRL_permission_rule_one', {
                    '@context': {},
                    'nid': "ns=9999;i=ODRL_permission_rule_one",
                    'HasTypeDefinition': "Permission" //OR "PolicyRulePermissionType"
                }]
            ]] // HasRule
        ] // Reference
    } // policy_one_config
; // let

policy_one = new u.module.ODRL.Policy(policy_one_config);

console.log(`${path_}`);