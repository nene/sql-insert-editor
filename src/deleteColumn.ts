import { DialectName, Node, parse, show } from "sql-parser-cst";

export function deleteColumn(
  sql: string,
  location: number,
  dialect: DialectName,
): string {
  const program = parse(sql, {
    dialect,
    includeRange: true,
    includeComments: true,
    includeNewlines: true,
    includeSpaces: true,
  });
  const stmtIndex = program.statements.findIndex((stmt) =>
    locationInNode(location, stmt),
  );
  const stmt = program.statements[stmtIndex];

  if (stmt?.type !== "insert_stmt") {
    throw new Error("Not an INSERT statement");
  }
  const insert = stmt.clauses.find((cls) => cls.type === "insert_clause");
  const values = stmt.clauses.find((cls) => cls.type === "values_clause");
  if (!insert || !insert.columns || !values) {
    throw new Error("INSERT statement must have columns list and VALUES list");
  }

  const columnIndex = findColumnIndex(location, insert, values);
  if (columnIndex === -1) {
    throw new Error("Failed to identify INSERT statement column");
  }

  const newInsertClause = {
    ...insert,
    columns: {
      ...insert.columns,
      expr: {
        ...insert.columns.expr,
        items: removeAt(columnIndex, insert.columns.expr.items),
      },
    },
  };
  const newValuesClause = {
    ...values,
    values: {
      ...values.values,
      items: values.values.items.map((row) => {
        switch (row.type) {
          case "paren_expr":
            return {
              ...row,
              expr: {
                ...row.expr,
                items: removeAt(columnIndex, row.expr.items),
              },
            };
          case "row_constructor":
            return {
              ...row,
              row: {
                ...row.row,
                expr: {
                  ...row.row.expr,
                  items: removeAt(columnIndex, row.row.expr.items),
                },
              },
            };
        }
      }),
    },
  };

  const newInsertStmt = {
    ...stmt,
    clauses: stmt.clauses.map((cls) => {
      if (cls === insert) {
        return newInsertClause;
      } else if (cls === values) {
        return newValuesClause;
      } else {
        return cls;
      }
    }),
  };

  program.statements[stmtIndex] = newInsertStmt;

  return show(program);
}

function findColumnIndex(location: number, insert: any, values: any): number {
  const fromColumns = insert.columns.expr.items.findIndex((col: Node) =>
    locationInNode(location, col),
  );
  if (fromColumns !== -1) {
    return fromColumns;
  }

  for (const row of values.values.items) {
    const items =
      row.type === "row_constructor" ? row.row.expr.items : row.expr.items;
    const fromValues = items.findIndex((val: Node) =>
      locationInNode(location, val),
    );
    if (fromValues !== -1) {
      return fromValues;
    }
  }

  return -1;
}

function locationInNode(location: number, node: Node): boolean {
  if (!node.range) {
    return false;
  }
  return node.range[0] <= location && location <= node.range[1];
}

function removeAt<T>(index: number, arr: T[]): T[] {
  return [...arr.slice(0, index), ...arr.slice(index + 1)];
}
