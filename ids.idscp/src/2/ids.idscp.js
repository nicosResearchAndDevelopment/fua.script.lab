const
    {Server}         = require(`./ids.idscp.server`),
    {Client}         = require(`./ids.idscp.client`)
;
exports.idscpVersion = "2";
exports.Client       = Client;
exports.Server       = Server;