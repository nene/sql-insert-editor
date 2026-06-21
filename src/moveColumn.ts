import { DialectName, parse, show } from "sql-parser-cst";
import { findColumnIndex, findInsertStatement, locationInNode } from "./utils";

export function moveColumn(
  sql: string,
  location: number,
  direction: -1 | 1,
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
  const { stmt, insert, values } = findInsertStatement(
    program.statements[stmtIndex],
  );

  const columnIndex = findColumnIndex(location, insert, values);
  if (columnIndex === -1) {
    throw new Error("Failed to identify INSERT statement column");
  }

  const targetIndex = columnIndex + direction;
  if (targetIndex < 0 || targetIndex >= insert.columns.expr.items.length) {
    throw new Error("Cannot move column further in that direction");
  }

  const newInsertClause = {
    ...insert,
    columns: {
      ...insert.columns,
      expr: {
        ...insert.columns.expr,
        items: swap(columnIndex, targetIndex, insert.columns.expr.items),
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
                items: swap(columnIndex, targetIndex, row.expr.items),
              },
            };
          case "row_constructor":
            return {
              ...row,
              row: {
                ...row.row,
                expr: {
                  ...row.row.expr,
                  items: swap(columnIndex, targetIndex, row.row.expr.items),
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

function swap<T>(i: number, j: number, arr: T[]): T[] {
  const result = [...arr];
  result[i] = arr[j];
  result[j] = arr[i];
  return result;
}
