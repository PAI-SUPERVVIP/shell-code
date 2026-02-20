import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('OpenCode Terminal extension is now active!\n');

    const connectTerminal = vscode.commands.registerCommand(
        'opencode-terminal.connect',
        () => {
            const terminalUrl = vscode.workspace
                .getConfiguration('opencode-terminal')
                .get('url', 'http://localhost:3000');

            vscode.window.showInputBox({
                value: terminalUrl,
                prompt: 'Enter OpenCode Terminal URL',
                placeHolder: 'e.g., http://localhost:3000'
            }).then(url => {
                if (url) {
                    vscode.env.openExternal(vscode.Uri.parse(url));
                }
            });
        }
    );

    context.subscriptions.push(connectTerminal);
}

export function deactivate() {}
