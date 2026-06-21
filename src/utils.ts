import {
  InsertClause,
  InsertStmt,
  Node,
  ValuesClause,
} from "sql-parser-cst";

export type InsertClauseWithColumns = InsertClause &
  Required<Pick<InsertClause, "columns">>;

export function findInsertStatement(stmt: Node | undefined): {
  stmt: InsertStmt;
  insert: InsertClauseWithColumns;
  values: ValuesClause;
} {
  if (stmt?.type !== "insert_stmt") {
    throw new Error("Not an INSERT statement");
  }
  const insert = stmt.clauses.find(
    (cls): cls is InsertClause => cls.type === "insert_clause",
  );
  const values = stmt.clauses.find(
    (cls): cls is ValuesClause => cls.type === "values_clause",
  );
  if (!insert || !insert.columns || !values) {
    throw new Error(
      "INSERT statement must have columns list and VALUES list",
    );
  }
  return { stmt, insert: insert as InsertClauseWithColumns, values };
}

export function findColumnIndex(
  location: number,
  insert: InsertClauseWithColumns,
  values: ValuesClause,
): number {
  const fromColumns = insert.columns.expr.items.findIndex((col) =>
    locationInNode(location, col),
  );
  if (fromColumns !== -1) {
    return fromColumns;
  }

  for (const row of values.values.items) {
    const items =
      row.type === "row_constructor" ? row.row.expr.items : row.expr.items;
    const fromValues = items.findIndex((val) => locationInNode(location, val));
    if (fromValues !== -1) {
      return fromValues;
    }
  }

  return -1;
}

export function locationInNode(location: number, node: Node): boolean {
  if (!node.range) {
    return false;
  }
  return node.range[0] <= location && location <= node.range[1];
}
