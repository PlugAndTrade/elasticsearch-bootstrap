# Elasticsearch bootstrap

## Installation

```
npm install --save @plugandtrade/elasticsearch-bootstrap
```

## Running

```
./node_modules/.bin/elasticsearch-bootstrap
```

Or, edit your `package.json` to include it in your scripts, e.g.:
```json
  // other stuff
  "scripts": {
    //other commands
    "bootstrap": "./node_modules/.bin/elasticsearch-bootstrap --indices ./indices.json"
  },
  // other stuff
```

and run it using:
```
npm run bootstrap -- --host 'http://localhost:9200' 
```
**Note:** the `--` are needed before the options that should be passed to the script

## Options

### Host

```
.. --host <url_to_elasticsearch>
```

Complete http url, e.g. `http://localhost:9200`. The default is `http://localhost:9200`.

### Scripts

```
... --scripts <path-to-scripts>
```

The path must be a folder containing one file per script, the name of each file will be used as the `id` of the stored script.

Example:
```
 - ./scripts/
   - my_first_script.hbs
   - my_second_script.hbs
```

Supported script languages:
 * **Handlebars**: Use file extension `.hbs`

### Index templates

```
... --index-templates <path-to-templates>
```

The path must be a folder containing `json` files where each file is an index template. If the `template` property is not specified in the file, `{filename}-*` will be used as template pattern.

Example:
```
 - ./index-templates/
   - my_first_template.json
   - my_second_template.json
```

### Indices

```
... --indices <path-to-index-configurations>
```

The index configurations file must be a valid `json` file with the following structure:

```json
{
  "indices": [
    {
      "name": "my_index",
      "alias": "my_alias",
      "config": {}
    }
  ]
}
```

The `config` property must either be an empty object or a valid index configuration.

The above config will create an index name `my_index-{unix_timestamp}` and move (if exists, otherwise just add) the alias `my_alias` to point to it.

### Seeds

```
... --seeds <path-to-seeds>
```

The path must be a folder with a seed structure. A seed structure follows this simple rule:

```
 - <index_name>/
   - <type_name>/
     - <document_id>.json
   - <type_name>/
     - <document_id>.json
```

The json files must be valid json containing the data of each document.
