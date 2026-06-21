import { describe, expect, it } from "vitest";
import { deleteColumn } from "./deleteColumn";
import dedent from "dedent";
import { DialectName } from "sql-parser-cst";

describe("deleteColumn()", () => {
  it("deletes a column from INSERT statement (cursor inside column name)", () => {
    const result = deleteColumnAtCursor(dedent`
      INSERT INTO tbl (foo, b|ar, baz) VALUES (1, 2, 3);
    `);
    expect(result).toBe(dedent`
      INSERT INTO tbl (foo, baz) VALUES (1, 3);
    `);
  });

  it("deletes a column from INSERT statement (cursor before column name)", () => {
    const result = deleteColumnAtCursor(dedent`
      INSERT INTO tbl (foo, |bar, baz) VALUES (1, 2, 3);
    `);
    expect(result).toBe(dedent`
      INSERT INTO tbl (foo, baz) VALUES (1, 3);
    `);
  });

  it("deletes a column from INSERT statement (cursor before column name)", () => {
    const result = deleteColumnAtCursor(dedent`
      INSERT INTO tbl (foo, bar|, baz) VALUES (1, 2, 3);
    `);
    expect(result).toBe(dedent`
      INSERT INTO tbl (foo, baz) VALUES (1, 3);
    `);
  });

  it("deletes a column from INSERT statement (cursor inside column value)", () => {
    const result = deleteColumnAtCursor(dedent`
      INSERT INTO tbl (foo, bar, baz) VALUES (10, 20|0, 3000);
    `);
    expect(result).toBe(dedent`
      INSERT INTO tbl (foo, baz) VALUES (10, 3000);
    `);
  });

  it("deletes a column from INSERT statement (cursor inside ROW constructor value) (MySQL)", () => {
    const result = deleteColumnAtCursor(
      dedent`
      INSERT INTO tbl (foo, bar, baz) VALUES ROW(10, 200, 3000), ROW(20, 400, 60|00);
    `,
      "mysql",
    );
    expect(result).toBe(dedent`
      INSERT INTO tbl (foo, bar) VALUES ROW(10, 200), ROW(20, 400);
    `);
  });

  it("deletes a column from all rows of INSERT statement", () => {
    const result = deleteColumnAtCursor(dedent`
      INSERT INTO tbl (foo, b|ar, baz)
      VALUES (1, 2, 3), (4, 5, 6), (7, 8, 9);
    `);
    expect(result).toBe(dedent`
      INSERT INTO tbl (foo, baz)
      VALUES (1, 3), (4, 6), (7, 9);
    `);
  });

  it("deletes a column from INSERT statement with RETURNING clause", () => {
    const result = deleteColumnAtCursor(dedent`
      INSERT INTO tbl (foo, b|ar, baz) VALUES (1, 2, 3) RETURNING *;
    `);
    expect(result).toBe(dedent`
      INSERT INTO tbl (foo, baz) VALUES (1, 3) RETURNING *;
    `);
  });

  it("deletes a column from INSERT statement with WITH clause", () => {
    const result = deleteColumnAtCursor(dedent`
      WITH src AS (SELECT 1)
      INSERT INTO tbl (foo, b|ar, baz) VALUES (1, 2, 3);
    `);
    expect(result).toBe(dedent`
      WITH src AS (SELECT 1)
      INSERT INTO tbl (foo, baz) VALUES (1, 3);
    `);
  });

  it("deletes a column from INSERT statement with ROW() constructor (MySQL)", () => {
    const result = deleteColumnAtCursor(
      dedent`
        INSERT INTO tbl (foo, b|ar, baz)
        VALUES ROW(1, 2, 3), ROW(4, 5, 6);
      `,
      "mysql",
    );
    expect(result).toBe(dedent`
      INSERT INTO tbl (foo, baz)
      VALUES ROW(1, 3), ROW(4, 6);
    `);
  });

  it("throws error when invalid SQL", () => {
    expect(() =>
      deleteColumnAtCursor(dedent`
        INSERT INTO !HAHA; |
      `),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: Syntax Error: Unexpected "!"
      Was expecting to see: identifier or whitespace
      --> undefined:1:13
        |
      1 | INSERT INTO !HAHA; 
        |             ^]
    `,
    );
  });

  it("throws error when cursor not inside INSERT statement", () => {
    expect(() =>
      deleteColumnAtCursor(dedent`
        INSERT INTO tbl (a, b) VALUES (1, 2);
        SELECT f|oo FROM tbl;
      `),
    ).toThrowErrorMatchingInlineSnapshot(`[Error: Not an INSERT statement]`);
  });

  it("throws error when INSERT has no VALUES clause", () => {
    expect(() =>
      deleteColumnAtCursor(dedent`
        INSERT INTO tbl (fo|o, bar) SELECT * FROM blah;
      `),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: INSERT statement must have columns list and VALUES list]`,
    );
  });

  it("throws error when INSERT has no columns list", () => {
    expect(() =>
      deleteColumnAtCursor(dedent`
        INSERT INTO tbl VALUES (10, 2|0, 30);
      `),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: INSERT statement must have columns list and VALUES list]`,
    );
  });

  it("throws error when cursor not inside one of the columns", () => {
    expect(() =>
      deleteColumnAtCursor(dedent`
        INSERT INTO tbl (foo, bar, baz) VAL|UES (10, 20, 30);
      `),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Failed to identify INSERT statement column]`,
    );
  });
});

function deleteColumnAtCursor(
  sql: string,
  dialect: DialectName = "sqlite",
): string {
  const offset = sql.indexOf("|");
  if (offset === -1) {
    throw new Error("Test SQL must contain a | to mark cursor position");
  }
  const cleanSql = sql.slice(0, offset) + sql.slice(offset + 1);
  return deleteColumn(cleanSql, offset, dialect);
}
