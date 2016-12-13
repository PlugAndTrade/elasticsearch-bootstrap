const R = require('ramda'),
      Promise = require('bluebird'),
      request = require('request-promise'),
      fs = Promise.promisifyAll(require('fs'));

module.exports = function (host) {

  function reindex(spec) {
    return request({
      uri: R.join('/')([ host, '_reindex' ]),
      method: 'POST',
      body: {
        source: { index: spec.alias },
        dest: { index: spec.index }
      },
      json: true
    });
  }

  function reindexAll(configPath, indices) {
    let indexNames = R.pipe(R.map(R.props([ 'name', 'index' ])), R.fromPairs)(indices);
    return fs.readFileAsync(configPath)
      .then(JSON.parse)
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
        R.reduce(
          (promise, spec) => promise.then(results => reindex(spec)
            .then(R.pipe(
              R.assoc('indices', spec),
              R.append(R.__, results)
            ))),
          Promise.resolve([]))
      ));
  }

  return {
    reindexAll
  };
};
