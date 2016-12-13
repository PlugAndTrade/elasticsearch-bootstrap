const Scripts = require('./scripts'),
      Indices = require('./indices'),
      Aliases = require('./aliases'),
      Seeds = require('./seeds');

module.exports = function (host) {
  return Object.assign({}, Scripts(host, { 'hbs': 'handlebars' }), Indices(host), Seeds(host), Aliases(host));
};
