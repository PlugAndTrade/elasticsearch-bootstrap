const R = require('ramda'),
      Promise = require('bluebird'),
      path = require('path'),
      fs = Promise.promisifyAll(require('fs'));

function withAllInDirectory(fn, dirPath) {
  return fs.readdirAsync(dirPath)
    .then((fileNames) => {
      return R.pipe(
        R.map((fileName) => {
          return fs.readFileAsync(path.join(dirPath, fileName))
            .then(R.toString)
            .then((file) => [ 
              R.replace(/\.[^\.]*$/, '')(fileName),
              file,
              R.pipe(R.match(/\.([^\.]*)/), R.prop(1))(fileName)
            ])
            .then(R.apply(fn));
        }),
        Promise.all
      )(fileNames);
    });
}

module.exports = {
  withAllInDirectory: R.curry(withAllInDirectory)
};
