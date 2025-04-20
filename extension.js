const vscode = require('vscode');

function activate(context) {
	const disposable = vscode.commands.registerCommand('functionBreaker.breakParams', function () {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;

		const document = editor.document;
		const selection = editor.selection;
		const text = document.getText(selection);

		// Match something like: Input.getVector(...)
		const match = text.match(/^(\w+\.\w+)\(([^)]+)\)$/s);
		if (!match) {
			vscode.window.showErrorMessage("Please select a valid function call.");
			return;
		}

		const funcName = match[1];
		const args = match[2]
			.split(',')
			.map(arg => arg.trim())
			.join(',\n\t');

		const newText = `${funcName}(\n\t${args}\n)`;

		editor.edit(editBuilder => {
			editBuilder.replace(selection, newText);
		});
	});

	context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
};