const
    {Server}                  = require(`./ids.idscp.server`),
    {Client}                  = require(`./ids.idscp.client`),
    {fsm, wait, idscpVersion} = require(`./ids.idscp.fsm`)
;
exports.idscpUtil             = {
    getProtoHeader: function (header) {
        let result = {};
        header.forEach(element => {
            result[element.name] = element.value;
        });
        Object.freeze(result);
        return result;
    }
};
exports.idscpVersion          = idscpVersion;
exports.fsm                   = fsm;
exports.wait                  = wait;
exports.Client                = Client;
exports.Server                = Server;