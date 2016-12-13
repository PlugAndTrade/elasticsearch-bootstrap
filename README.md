# Elasticsearch bootstrap

## Usage

### Local

Install with:
```
npm install --save @plugandtrade/elasticsearch-bootstrap
```

Run with:
```
./node_modules/.bin/elasticsearch-bootstrap --indices ./indices.json
```

Or, edit your `package.json` to include it in your scripts, e.g.:
```javascript
  // other stuff
  "scripts": {
    // other commands
    "bootstrap": "elasticsearch-bootstrap --indices ./indices.json"
  },
  // other stuff
```

and run it using:
```
npm run bootstrap -- --host 'http://localhost:9200' 
```
**Note:** the `--` are needed before the options that should be passed to the script

### Global

Install with:
```
npm install -g @plugandtrade/elasticsearch-bootstrap
```

Run with:
```
elasticsearch-bootstrap --indices ./indices.json
```

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
      "index": "my_index-{{timestamp}}"
      "config": {}
    }
  ]
}
```

 * The `config` property is optional and must be a valid index configuration if set.
 * The `index` property defaults to `[name]-{{timestamp}}`, it must be a string
   and will be compiled as a handlebars template with the `timestamp` variable set
   to `Date.now()`.
 * The `name` property must be unique.

The above config will create an index named `my_index-{unix_timestamp}`.

### Move aliases

```
... --move-aliases <path-to-alias-configuration>
```

The alias configurations file must be a valid `json` file with the following structure:

```json
{
  "indices": [
    {
      "name": "my_index",
      "alias": "my_alias",
      "index": "my_index-12345"
    }
  ]
}
```

 * The `alias` property defaults to `[name]`.
 * The `name` property must be unique.
 * The `index` property is optional and will be overwritten by the actual index name created using `--indices ...` with the same `name`.

The above config will the alias `my_alias` to `my_index-12345`.

The indices configuration and aliases configuration are compatible and may be merged, e.g.:
```json
{
  "indices": [
    {
      "name": "my_index",
      "alias": "my_alias",
      "index": "my_index-{{timestamp}}"
    }
  ]
}
```

Example:
Indices json:
```json
{
  "name": "my_index"
}
```

Aliases json:
```json
{
  "name": "my_index"
}
```

will result in the index `my_index-123456` and the alias `my_index -> my_index-123456`.

### Reindex

```
... --reindex <path-to-reindex-configuration>
```

The alias configurations file must be a valid `json` file with the following structure:

```json
{
  "indices": [
    {
      "name": "my_index",
      "alias": "my_alias",
      "index": "my_index-12345"
    }
  ]
}
```

 * The `alias` property defaults to `[name]`.
 * The `name` property must be unique.
 * The `index` property is optional and will be overwritten by the actual index name created using `--indices ...` with the same `name`.

This option will reindex all document in `alias` to `index` using the reindex API.

The indices, aliases and reindex configurations are compatible and may be merged.

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

If the indices option is specified the `index_name` will be replaced by the
actual index name created with the `name` parameter equal to `index_name`.
