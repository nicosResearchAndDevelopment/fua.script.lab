module.exports = (function () {

    class BaseRuleType {
        constructor() {
        } // constructor
    } // class BaseRuleType

    class PermissionRuleType extends BaseRuleType {
        constructor() {
            super();
        } // constructor
    } // class PermissionRuleType

    /* new */
    function PolicyType(config) {
        let
            _properties = {},
            policy_
        ; // let
        policy_ = Object.create(null, _properties);
        return policy_;
    } // Policy

    try {
        u['module']['value']['ODRL'] = Object.create(null, {
            'Policy': {value: PolicyType},
            'PermissionRule': {value: PermissionRuleType}
        });
        return;
    } catch (jex) {
        return {
            'Policy': PolicyType,
            'PermissionRule': PermissionRuleType
        };
    } // try

}());