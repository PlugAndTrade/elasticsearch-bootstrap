const R = require('ramda'),
      Promise = require('bluebird'),
      request = require('request-promise'),
      utils = require('./utils'),
      fs = Promise.promisifyAll(require('fs'));

module.exports = function (host) {

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

  function moveAliases(configPath, indices, selectIndex) {
    let indexNames = R.pipe(R.map(R.props([ 'name', 'index' ])), R.fromPairs)(indices);
    return fs.readFileAsync(configPath)
      .then(JSON.parse)
      .then(R.isEmpty(selectIndex)
        ? R.identity
        : R.over(R.lensProp('indices'), R.filter(R.propSatisfies(R.contains(R.__, selectIndex), 'name')))
      )
      .then(R.pipe(
        R.prop('indices'),
        R.map(R.converge(R.over(R.lensProp('alias')), [
          R.pipe(R.prop('name'), R.defaultTo),
          R.identity
        ])),
        R.map(R.converge(R.set(R.lensProp('index')), [
          R.converge(R.propOr(R.__, R.__, indexNames), [ R.prop('index'), R.prop('name') ]),
          R.identity
        ])),
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
      ));
  }

  return {
    moveAliases
  };
}
