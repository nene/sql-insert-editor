# SQL Insert Editor

Editing INSERT statements is a nuisance. This VSCode extension is here to help.

## Features

- **Delete column** — Right-click on a column name in INSERT statement to remove that column.

Access via right-click context menu: **SQL insert editor > Delete column**

## Configuration

Make sure to configure your SQL dialect. The extension only works with these select dialects supported by the parser.

- `sqlInsertEditor.dialect` — SQL dialect to use when parsing.
  - `sqlite` (**default**, full support),
  - `bigquery` (full support),
  - `postgresql` (partial support, but pretty good),
  - `mysql` (poorly supported),
  - `mariadb` (poorly supported).

## Publishing

After running `npm run package` you'll get a new `*.vsix` file generated.
Upload that file to VSCode repository at: https://marketplace.visualstudio.com/manage/publishers/renesaarsoo
