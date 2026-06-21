import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("sql-insert-editor.deleteColumn", () => {
      vscode.window.showInformationMessage(
        "Delete this column (not yet implemented)",
      );
    }),
  );
}

export function deactivate() {}
