const R = require('ramda'),
      Promise = require('bluebird'),
      path = require('path'),
      fs = Promise.promisifyAll(require('fs'));

const filterAsync = R.curry(function filterAsync(fn, list) {
  return R.pipeP(
    R.pipe(R.map(fn), Promise.all),
    R.zip(list),
    R.filter(R.prop(1)),
    R.map(R.prop(0))
  )(list);
});

module.exports = function (host) {

  const readDocSeed = R.curry(function readDocSeed(dirPath, indexName, typeName, docFile) {
    return fs.readFileAsync(path.join(dirPath, indexName, typeName, docFile))
      .then(JSON.parse)
      .then((doc) => ({
        _id: R.replace('.json', '')(docFile),
        document: doc
      }));
  });

  const readTypeSeeds = R.curry(function readTypeSeeds(dirPath, indexName, typeName) {
    return fs.readdirAsync(path.join(dirPath, indexName, typeName))
      .then(docFiles => {
        return R.pipeP(
          R.pipe(R.map(readDocSeed(dirPath, indexName, typeName)), Promise.all),
          R.map(R.assoc('_type', typeName))
        )(docFiles);
      });
  });

  const readIndexSeeds = R.curry(function readIndexSeeds(dirPath, indexName) {
    return fs.readdirAsync(path.join(dirPath, indexName))
      .then(filterAsync(R.pipe(
        (name) => path.join(dirPath, indexName, name),
        R.pipeP(fs.statAsync, R.invoker(0, 'isDirectory'))
      )))
      .then((typeNames) => {
        return R.pipeP(
          R.pipe(R.map(readTypeSeeds(dirPath, indexName)), Promise.all),
          R.unnest,
          R.map(R.assoc('_index', indexName))
        )(typeNames);
      });
  });

  function toBulk(doc) {
    return R.pipe(
      R.juxt([
        R.pipe(R.pick([ '_index', '_type', '_id' ]), R.objOf('index'), JSON.stringify),
        R.pipe(R.prop('document'), JSON.stringify)
      ]),
      R.map(R.concat(R.__, '\n')),
      R.join('')
    )(doc);
  }

  function indexAll(dirPath) {
    return fs.readdirAsync(dirPath)
      .then(filterAsync(R.pipe(
        (name) => path.join(dirPath, name),
        R.pipeP(fs.statAsync, R.invoker(0, 'isDirectory'))
      )))
      .then((indexNames) => {
        return R.pipeP(
          R.pipe(R.map(readIndexSeeds(dirPath)), Promise.all),
          R.unnest
        )(indexNames);
      })
      .then(R.pipe(
        R.map(toBulk),
        R.join('')
      ))
      .then((body) => {
        return request({
          uri: R.join('/')([ host, '_bulk' ]),
          method: 'POST',
          body: body
        })
        .then(JSON.parse)
      })
      .then(res => {
        return R.pipe(
          R.juxt([
            R.pipe(R.prop('items'), R.length),
            R.pipe(
              R.prop('items'),
              R.map(R.pipe(R.values, R.head)),
              R.reject(R.propSatisfies(R.both(R.lte(200), R.gt(300)), 'status'))
            )
          ]),
          R.zipObj([ 'total', 'failures' ])
        )(res);
      });
  }

  return {
    seedAll: indexAll
  };
}
