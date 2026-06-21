import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("sql-insert-editor.deleteColumn", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      const position = editor.selection.active;
      editor.edit((editBuilder) => {
        editBuilder.insert(position, "|");
      });
    }),
  );
}

export function deactivate() {}
