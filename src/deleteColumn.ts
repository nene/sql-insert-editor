import { DialectName } from "sql-parser-cst";
import { editColumns } from "./editColumns";

export function deleteColumn(
  sql: string,
  location: number,
  dialect: DialectName,
): string {
  return editColumns(sql, location, dialect, removeAt);
}

function removeAt<T>(index: number, arr: T[]): T[] {
  return [...arr.slice(0, index), ...arr.slice(index + 1)];
}
