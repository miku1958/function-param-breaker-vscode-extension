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

        // Detect current indentation
        const line = document.lineAt(document.positionAt(funcNameStart + 1));
        const baseIndent = line.text.match(/^\s*/)[0];
        const indentUnit = editor.options.insertSpaces ? ' '.repeat(editor.options.tabSize) : '\t';
        const innerIndent = baseIndent + indentUnit;

        // Recursive formatting for nested calls
        function formatArgument(arg, levelIndent) {
            arg = arg.trim();
            const open = arg.indexOf('(');
            const close = arg.lastIndexOf(')');
            if (open !== -1 && close !== -1 && open < close) {
                const innerFunc = arg.slice(0, open).trim();
                const innerArgs = splitArgs(arg.slice(open + 1, close));
                const formattedInner = innerArgs.map(a => formatArgument(a, levelIndent + indentUnit)).join(',');
                return `${levelIndent}${innerFunc}(
${formattedInner}
${levelIndent})`;
            } else {
                return `${levelIndent}${arg}`;
            }
        }

        function splitArgs(argString) {
            let parts = [];
            let depth = 0;
            let current = '';
            for (let char of argString) {
                if (char === ',' && depth === 0) {
                    parts.push(current);
                    current = '';
                } else {
                    if (char === '(') depth++;
                    if (char === ')') depth--;
                    current += char;
                }
            }
            if (current.trim()) parts.push(current);
            return parts;
        }

        const args = splitArgs(paramText);
        const formattedArgs = args.map(a => formatArgument(a, innerIndent)).join(',');
        const formatted = `${funcName}(
${formattedArgs}
${baseIndent})`;

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
