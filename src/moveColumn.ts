import { DialectName } from "sql-parser-cst";
import { editColumns } from "./editColumns";

export function moveColumn(
  sql: string,
  location: number,
  direction: -1 | 1,
  dialect: DialectName,
): string {
  return editColumns(sql, location, dialect, (columnIndex, columns) => {
    const targetIndex = columnIndex + direction;
    if (targetIndex < 0 || targetIndex >= columns.length) {
      throw new Error("Cannot move column further in that direction");
    }
    return swap(columnIndex, targetIndex, columns);
  });
}

function swap<T>(i: number, j: number, arr: T[]): T[] {
  const result = [...arr];
  result[i] = arr[j];
  result[j] = arr[i];
  return result;
}
