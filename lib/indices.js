const R = require('ramda'),
      Promise = require('bluebird'),
      request = require('request-promise'),
      utils = require('./utils'),
      Handlebars = require('handlebars'),
      fs = Promise.promisifyAll(require('fs'));

module.exports = function (host) {
  function createTemplate(name, config) {
    return request({
      uri: R.join('/')([ host, '_template', name ]),
      method: 'POST',
      body: R.merge({ template: `${name}-*` }, JSON.parse(config)),
      json: true
    });
  }

  function createIndex(indexSpec) {
    return request({
      uri: R.join('/')([ host, indexSpec.index ]),
      method: 'POST',
      body: indexSpec.config || {},
      json: true
    })
    .then(R.always(R.pick([ 'name', 'index' ])(indexSpec)));
  };

  const render = R.curry(function render(params, template) {
    return Handlebars.compile(template)(params);
  });

  function createIndices(configPath) {
    return fs.readFileAsync(configPath)
      .then(JSON.parse)
      .then(R.pipe(
        R.prop('indices'),
        R.invoker(1, 'map')((val, idx) => R.over(
          R.lensProp('index'),
          R.pipe(R.defaultTo(`${val.name}-{{timestamp}}`), render({ timestamp: Date.now() + idx })),
          val
        )),
        R.map(createIndex),
        Promise.all
      ));
  }

  function createAllIndexTemplates(path) {
    return utils.withAllInDirectory(createTemplate)(path)
      .then(res => {
        return R.pipe(
          R.juxt([
            R.pipe(R.filter(R.prop('acknowledged')), R.length),
            R.pipe(R.reject(R.prop('acknowledged')), R.length),
          ]),
          R.zipObj([ 'success', 'failure' ])
        )(res);
      });
  }

  return {
    createAllIndexTemplates,
    createIndices
  };
};
