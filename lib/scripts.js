const R = require('ramda'),
      utils = require('./utils');
      Promise = require('bluebird'),
      request = require('request-promise'),
      path = require('path'),
      fs = Promise.promisifyAll(require('fs'));

module.exports = function searchTemplates(host, extensions) {
  function saveTemplate(id, template, extension) {
    return R.has(extension, extensions)
      ?  request({
        uri: R.join('/')([ host, '_scripts', extensions[extension], id ]),
        method: 'POST',
        body: { script: template },
        json: true
      })
      : Promise.reject({ error: 'Unknown file extension: ' + extension, extensions });
  }

  return {
    storeAllScripts: utils.withAllInDirectory(saveTemplate)
  }
};
