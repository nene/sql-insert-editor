import { DialectName } from "sql-parser-cst";
import { editColumns } from "./editColumns";

export function sortColumns(
  sql: string,
  location: number,
  dialect: DialectName,
): string {
  let columnIndices: number[] | undefined = undefined;
  return editColumns(sql, location, dialect, (index, columns) => {
    if (!columnIndices) {
      // Sort column names
      const sortedColumns = [...columns];
      sortedColumns.sort((a, b) => {
        if (a.type === "identifier" && b.type === "identifier") {
          return a.name.localeCompare(b.name, "en");
        } else {
          return 0;
        }
      });
      columnIndices = detectColumnIndices(columns, sortedColumns);
      return sortedColumns;
    } else {
      // Place column values in the same order as the column names
      return columnIndices.map((index) => columns[index]);
    }
  });
}

// Returns array of indices, denoting where the item of newArray was in oldArray
function detectColumnIndices<T>(oldArray: T[], newArray: T[]): number[] {
  return newArray.map((item) => oldArray.findIndex((it) => it === item));
}
