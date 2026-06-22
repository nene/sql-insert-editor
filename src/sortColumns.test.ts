import { describe, expect, it } from "vitest";
import { sortColumns } from "./sortColumns";
import dedent from "dedent";
import { DialectName } from "sql-parser-cst";

describe("sortColumns()", () => {
  it("sorts columns of INSERT statement (cursor inside column name)", () => {
    const result = sortColumnsAtCursor(dedent`
      INSERT INTO tbl (foo, b|ar, zap, baz) VALUES (1, 2, 3, 4);
    `);
    expect(result).toBe(dedent`
      INSERT INTO tbl ( bar, baz,foo, zap) VALUES ( 2, 4,1, 3);
    `);
  });

  it("sorts columns when column names are quoted", () => {
    const result = sortColumnsAtCursor(dedent`
      INSERT INTO tbl (foo, "b|ar", "zap", baz) VALUES (1, 2, 3, 4);
    `);
    expect(result).toBe(dedent`
      INSERT INTO tbl ( "bar", baz,foo, "zap") VALUES ( 2, 4,1, 3);
    `);
  });

  it("sorts all columns of INSERT statement", () => {
    const result = sortColumnsAtCursor(dedent`
      INSERT INTO tbl (a, c, b)
      VALUES (1, 2, 3), (4, 5|, 6), (7, 8, 9);
    `);
    expect(result).toBe(dedent`
      INSERT INTO tbl (a, b, c)
      VALUES (1, 3, 2), (4, 6, 5), (7, 9, 8);
    `);
  });

  it("throws error when cursor not inside INSERT statement", () => {
    expect(() =>
      sortColumnsAtCursor(dedent`
        SELECT f|oo FROM tbl;
      `),
    ).toThrowErrorMatchingInlineSnapshot(`[Error: Not an INSERT statement]`);
  });
});

function sortColumnsAtCursor(
  sql: string,
  dialect: DialectName = "sqlite",
): string {
  const offset = sql.indexOf("|");
  if (offset === -1) {
    throw new Error("Test SQL must contain a | to mark cursor position");
  }
  const cleanSql = sql.slice(0, offset) + sql.slice(offset + 1);
  return sortColumns(cleanSql, offset, dialect);
}
