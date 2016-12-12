#!/usr/bin/env node
const R = require('ramda'),
      meow = require('meow');

const defaultConfig = {
  host: 'http://localhost:9200'
};

const cli = meow(`
    Usage
      elastic-bootstrap [--host URL] [options]

    Options
      --host URL to elasticsearch, default: ${defaultConfig.host}
      --scripts Path to stored scripts
      --index-templates Path to index templates
      --indices Path to json file containing indices and aliases to create
      --seeds Path to file structure containing seed data

    Examples
      elastic-bootstrap --host http://localhost:9200 --index-templates ./etc/elasticsearch/index-templates/ --seeds ./etc/elasticsearch/seeds/
`);

const config = R.merge(defaultConfig, R.pick([ 'host' ])(cli.flags));

const Bootstraper = require('./')(config.host);

var promise = Promise.resolve();

if (cli.flags.scripts) {
  promise = promise
    .then(() => Bootstraper.storeAllScripts(cli.flags.scripts))
    .then((res) => {
      console.log(' * scripts stored');
    });
}

if (cli.flags.indexTemplates) {
  promise = promise
    .then(() => Bootstraper.createAllIndexTemplates(cli.flags.indexTemplates))
    .then((res) => {
      console.log(' * index templates created');
    });
}

if (cli.flags.indices) {
  promise = promise
    .then(() => Bootstraper.createIndices(cli.flags.indices))
    .then((res) => {
      console.log(' * indices created');
      console.log(JSON.stringify(res, null, 2));
    });
}

if (cli.flags.seeds) {
  promise = promise
    .then(() => Bootstraper.seedAll(cli.flags.seeds))
    .then((res) => {
      let failures = R.pipe(
        R.prop('items'),
        R.map(R.pipe(R.values, R.head)),
        R.reject(R.propSatisfies(R.both(R.lte(200), R.gt(300)), 'status'))
      )(res);
      console.log(` * ${res.items.length} seeds finished`);
      if (!R.isEmpty(failures)) {
        console.log('   ' + JSON.stringify(failures, null, 2));
      }
    });
}
