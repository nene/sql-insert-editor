import { DialectName, parse, show, Node } from "sql-parser-cst";
import { findColumnIndex, findInsertStatement, locationInNode } from "./utils";

type EditColumnsFn = <T extends Node>(columnIndex: number, columns: T[]) => T[];

export function editColumns(
  sql: string,
  location: number,
  dialect: DialectName,
  editFn: EditColumnsFn,
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

  const newInsertClause = {
    ...insert,
    columns: {
      ...insert.columns,
      expr: {
        ...insert.columns.expr,
        items: editFn(columnIndex, insert.columns.expr.items),
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
                items: editFn(columnIndex, row.expr.items),
              },
            };
          case "row_constructor":
            return {
              ...row,
              row: {
                ...row.row,
                expr: {
                  ...row.row.expr,
                  items: editFn(columnIndex, row.row.expr.items),
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
