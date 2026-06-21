import * as vscode from "vscode";
import { deleteColumn } from "./deleteColumn";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("sql-insert-editor.deleteColumn", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      const text = getEditorText(editor);
      const offset = getCursorOffset(editor);
      try {
        replaceEditorText(editor, deleteColumn(text, offset));
      } catch (error) {
        vscode.window.showInformationMessage(extractErrorMessage(error));
      }
    }),
  );
}

// type-safe extraction of error.message from standard Error
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
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
