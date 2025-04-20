const vscode = require('vscode');

function activate(context) {
	const disposable = vscode.commands.registerCommand('functionBreaker.breakParams', function () {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;

		const document = editor.document;
		const position = editor.selection.active;
		const text = document.getText();

		const offset = document.offsetAt(position);

		// Find the nearest opening parenthesis before the cursor
		let start = offset;
		while (start > 0 && text[start] !== '(') start--;
		if (text[start] !== '(') {
			vscode.window.showErrorMessage("Couldn't find opening parenthesis.");
			return;
		}

		// Find function name before (
		let funcNameEnd = start;
		let funcNameStart = funcNameEnd - 1;
		while (funcNameStart >= 0 && /[\w.\$]/.test(text[funcNameStart])) funcNameStart--;

		const funcName = text.slice(funcNameStart + 1, funcNameEnd);

		// Find the closing parenthesis
		let end = start;
		let depth = 1;
		while (end < text.length - 1 && depth > 0) {
			end++;
			if (text[end] === '(') depth++;
			else if (text[end] === ')') depth--;
		}
		if (depth !== 0) {
			vscode.window.showErrorMessage("Couldn't find matching closing parenthesis.");
			return;
		}

		const paramText = text.slice(start + 1, end);
		const args = paramText
			.split(',')
			.map(arg => arg.trim())
			.filter(Boolean);

		// Detect current indentation
		const line = document.lineAt(document.positionAt(funcNameStart + 1));
		const baseIndent = line.text.match(/^\s*/)[0];
		const indent = baseIndent + (editor.options.insertSpaces ? ' '.repeat(editor.options.tabSize) : '\t');

		const formatted = `${funcName}(\n${indent}${args.join(`,\n${indent}`)}\n${baseIndent})`;

		const range = new vscode.Range(
			document.positionAt(funcNameStart + 1),
			document.positionAt(end + 1)
		);

		editor.edit(editBuilder => {
			editBuilder.replace(range, formatted);
		});
	});

	context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
};