import { describe, expect, it } from "vitest";
import { deleteColumn } from "./deleteColumn";
import dedent from "dedent";

describe("deleteColumn()", () => {
  it("deletes a column from a basic INSERT statement", () => {
    const result = deleteColumnAt(dedent`
      INSERT INTO tbl (foo, b|ar, baz) VALUES (1, 2, 3);
    `);
    expect(result).toBe(dedent`
      INSERT INTO tbl (foo, baz) VALUES (1, 3);
    `);
  });
});

function deleteColumnAt(sql: string): string {
  const offset = sql.indexOf("|");
  if (offset === -1) {
    throw new Error("Test SQL must contain a | to mark cursor position");
  }
  const cleanSql = sql.slice(0, offset) + sql.slice(offset + 1);
  return deleteColumn(cleanSql, offset, "sqlite");
}
