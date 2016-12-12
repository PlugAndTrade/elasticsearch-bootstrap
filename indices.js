const R = require('ramda'),
      Promise = require('bluebird'),
      request = require('request-promise'),
      utils = require('./utils'),
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

  function createIndex(name, config) {
    return request({
      uri: R.join('/')([ host, name ]),
      method: 'POST',
      body: config,
      json: true
    })
    .then(() => ({ index: name }));
  };

  function createIndices(configPath) {
    return fs.readFileAsync(configPath)
      .then(JSON.parse)
      .then(R.pipe(
        R.prop('indices'),
        R.invoker(1, 'map')((val, idx) => createIndex(`${val.name}-${Date.now() + idx}`, val.config).then(R.merge(val))),
        R.pipeP(
          Promise.all,
          moveAliases
        )
      ));
  }

  function removeAlias(aliasDefinition) {
    return request({
      uri: R.join('/')([ host, aliasDefinition.alias ]),
      json: true
    })
    .then(R.keys)
    .then(R.map(R.pipe(
      R.set(R.lensProp('index'), R.__, { alias: aliasDefinition.alias }),
      R.objOf('remove')
    )))
    .catch(err => err.statusCode == 404 ? [] : Promise.reject(err));
  }

  function addAlias(aliasDefinition) {
    return Promise.resolve([ { add: R.pick([ 'alias', 'index' ])(aliasDefinition) } ]);
  }

  function moveAliases(aliasDefinitions) {
    return R.pipe(
      R.juxt([ R.map(removeAlias), R.map(addAlias) ]),
      R.unnest,
      R.pipeP(
        Promise.all,
        R.unnest,
        R.objOf('actions'),
        (body) => request({
          uri: R.join('/')([ host, '_aliases' ]),
          method: 'POST',
          body: body,
          json: true
        })
        .then(R.always(body)),
        R.pipe(
          R.prop('actions'),
          R.map(R.cond([
            [ R.has('remove'), R.pipe(
              R.prop('remove'),
              R.converge(R.objOf, [ R.prop('alias'), R.pipe(R.prop('index'), R.objOf('from')) ])
            ) ],
            [ R.has('add'), R.pipe(
              R.prop('add'),
              R.converge(R.objOf, [ R.prop('alias'), R.pipe(R.prop('index'), R.objOf('to')) ])
            ) ]
          ])),
          R.reduce(R.mergeWith(R.merge), {})
        )
      )
    )(aliasDefinitions);
  }

  return {
    createAllIndexTemplates: utils.withAllInDirectory(createTemplate),
    createIndices,
    moveAliases
  };
};
