const Scripts = require('./scripts'),
      Indices = require('./indices'),
      Seeds = require('./seeds');

module.exports = function (host) {
  return Object.assign({}, Scripts(host, { 'hbs': 'handlebars' }), Indices(host), Seeds(host));
};
