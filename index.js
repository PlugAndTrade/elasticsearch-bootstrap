const Scripts = require('./lib/scripts'),
      Indices = require('./lib/indices'),
      Aliases = require('./lib/aliases'),
      Reindex = require('./lib/reindex'),
      Seeds = require('./lib/seeds');

module.exports = function (host) {
  return Object.assign({}, Scripts(host, { 'hbs': 'handlebars' }), Indices(host), Seeds(host), Aliases(host), Reindex(host));
};
