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
      --indices Path to json file containing indices to create
      --seeds Path to file structure containing seed data
      --move-aliases Path to json file containing aliases to move/create
      --reindex Whether or not data should be copied from current aliases to new indices

    Examples
      elastic-bootstrap --host http://localhost:9200 --index-templates ./etc/elasticsearch/index-templates/ --seeds ./etc/elasticsearch/seeds/
`);

const config = R.merge(defaultConfig, R.pick([ 'host' ])(cli.flags));

const Bootstraper = require('./')(config.host);

var promise = Promise.resolve({});

if (cli.flags.scripts) {
  promise = promise
    .then((state) => Bootstraper
      .storeAllScripts(cli.flags.scripts)
      .then((res) => {
        console.log(' * scripts stored');
        return R.merge(state, { scripts: res });
      })
    );
}

if (cli.flags.indexTemplates) {
  promise = promise
    .then((state) => Bootstraper
      .createAllIndexTemplates(cli.flags.indexTemplates)
      .then((res) => {
        console.log(' * index templates created');
        return R.merge(state, { indexTemplates: res });
      })
    );
}

if (cli.flags.indices) {
  promise = promise
    .then((state) => Bootstraper
      .createIndices(cli.flags.indices)
      .then((res) => {
        console.log(' * indices created');
        return R.merge(state, { indices: res });
      })
    );
}

if (cli.flags.seeds) {
  promise = promise
    .then((state) => Bootstraper
      .seedAll(cli.flags.seeds, state.indices || {})
      .then((res) => {
        console.log(` * ${res.total - res.failures.length}/${res.total} documents stored`);
        return R.merge(state, { seeds: res });
      })
    );
}

if (cli.flags.reindex) {
  promise = promise
    .then(state => Bootstraper
      .reindexAll(cli.flags.reindex, state.indices)
      .then(res => {
        console.log(' * Reindex done');
        return R.merge(state, { reindex: res });
      })
    );
}

if (cli.flags.moveAliases) {
  promise = promise
    .then((state) => Bootstraper
      .moveAliases(cli.flags.moveAliases, state.indices || {})
      .then((res) => {
        console.log(' * moved aliases');
        return R.merge(state, { moveAliases: res });
      })
    );
}

promise
  .then((state) => {
    console.log(JSON.stringify(state, null, 2));
  });
