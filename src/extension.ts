import * as vscode from "vscode";
import { deleteColumn } from "./deleteColumn";
import { moveColumn } from "./moveColumn";
import { sortColumns } from "./sortColumns";
import { DialectName } from "sql-parser-cst";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "sql-insert-editor.deleteColumn",
      sqlTransformCommand(deleteColumn),
    ),
    vscode.commands.registerCommand(
      "sql-insert-editor.moveColumnBefore",
      sqlTransformCommand((text, offset, dialect) =>
        moveColumn(text, offset, -1, dialect),
      ),
    ),
    vscode.commands.registerCommand(
      "sql-insert-editor.moveColumnAfter",
      sqlTransformCommand((text, offset, dialect) =>
        moveColumn(text, offset, 1, dialect),
      ),
    ),
    vscode.commands.registerCommand(
      "sql-insert-editor.sortColumns",
      sqlTransformCommand(sortColumns),
    ),
  );
}

type SqlTransform = (
  text: string,
  offset: number,
  dialect: DialectName,
) => string;

function sqlTransformCommand(transform: SqlTransform): () => void {
  return () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    try {
      const result = transform(
        getEditorText(editor),
        getCursorOffset(editor),
        getDialect(),
      );
      replaceEditorText(editor, result);
    } catch (error) {
      vscode.window.showInformationMessage(extractErrorMessage(error));
    }
  };
}

// type-safe extraction of error.message from standard Error
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function getDialect(): DialectName {
  return vscode.workspace
    .getConfiguration("sqlInsertEditor")
    .get<DialectName>("dialect", "sqlite");
}

function getEditorText(editor: vscode.TextEditor): string {
  return editor.document.getText();
}

function getCursorOffset(editor: vscode.TextEditor): number {
  return editor.document.offsetAt(editor.selection.active);
}

function replaceEditorText(
  editor: vscode.TextEditor,
  newText: string,
): Thenable<boolean> {
  const document = editor.document;
  const fullRange = new vscode.Range(
    document.positionAt(0),
    document.positionAt(document.getText().length),
  );
  return editor.edit((editBuilder) => {
    editBuilder.replace(fullRange, newText);
  });
}

export function deactivate() {}
