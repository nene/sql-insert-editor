import { describe, expect, it } from "vitest";
import { moveColumn } from "./moveColumn";
import dedent from "dedent";
import { DialectName } from "sql-parser-cst";

describe("moveColumn()", () => {
  it("moves a column to the right", () => {
    const result = moveColumnAtCursor(
      dedent`
        INSERT INTO tbl (foo, b|ar, baz) VALUES (1, 2, 3);
      `,
      1,
    );
    expect(result).toBe(dedent`
      INSERT INTO tbl (foo, baz, bar) VALUES (1, 3, 2);
    `);
  });

  it("moves a column to the left", () => {
    const result = moveColumnAtCursor(
      dedent`
        INSERT INTO tbl (foo, b|ar, baz) VALUES (1, 2, 3);
      `,
      -1,
    );
    expect(result).toBe(dedent`
      INSERT INTO tbl ( bar,foo, baz) VALUES ( 2,1, 3);
    `);
  });

  it("moves a column when cursor is inside a value", () => {
    const result = moveColumnAtCursor(
      dedent`
        INSERT INTO tbl (foo, bar, baz) VALUES (1, 2|, 3);
      `,
      1,
    );
    expect(result).toBe(dedent`
      INSERT INTO tbl (foo, baz, bar) VALUES (1, 3, 2);
    `);
  });

  it("moves a column across all rows", () => {
    const result = moveColumnAtCursor(
      dedent`
        INSERT INTO tbl (foo, b|ar, baz)
        VALUES (1, 2, 3), (4, 5, 6), (7, 8, 9);
      `,
      1,
    );
    expect(result).toBe(dedent`
      INSERT INTO tbl (foo, baz, bar)
      VALUES (1, 3, 2), (4, 6, 5), (7, 9, 8);
    `);
  });

  it("moves a column with ROW() constructor (MySQL)", () => {
    const result = moveColumnAtCursor(
      dedent`
        INSERT INTO tbl (foo, b|ar, baz)
        VALUES ROW(1, 2, 3), ROW(4, 5, 6);
      `,
      -1,
      "mysql",
    );
    expect(result).toBe(dedent`
      INSERT INTO tbl ( bar,foo, baz)
      VALUES ROW( 2,1, 3), ROW( 5,4, 6);
    `);
  });

  it("throws error when moving the first column to the left", () => {
    expect(() =>
      moveColumnAtCursor(
        dedent`
          INSERT INTO tbl (f|oo, bar, baz) VALUES (1, 2, 3);
        `,
        -1,
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Cannot move column further in that direction]`,
    );
  });

  it("throws error when moving the last column to the right", () => {
    expect(() =>
      moveColumnAtCursor(
        dedent`
          INSERT INTO tbl (foo, bar, b|az) VALUES (1, 2, 3);
        `,
        1,
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Cannot move column further in that direction]`,
    );
  });

  it("throws error when cursor not inside INSERT statement", () => {
    expect(() =>
      moveColumnAtCursor(
        dedent`
          SELECT f|oo FROM tbl;
        `,
        1,
      ),
    ).toThrowErrorMatchingInlineSnapshot(`[Error: Not an INSERT statement]`);
  });

  it("throws error when cursor not inside one of the columns", () => {
    expect(() =>
      moveColumnAtCursor(
        dedent`
          INSERT INTO tbl (foo, bar, baz) VAL|UES (1, 2, 3);
        `,
        1,
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Failed to identify INSERT statement column]`,
    );
  });
});

function moveColumnAtCursor(
  sql: string,
  direction: -1 | 1,
  dialect: DialectName = "sqlite",
): string {
  const offset = sql.indexOf("|");
  if (offset === -1) {
    throw new Error("Test SQL must contain a | to mark cursor position");
  }
  const cleanSql = sql.slice(0, offset) + sql.slice(offset + 1);
  return moveColumn(cleanSql, offset, direction, dialect);
}
