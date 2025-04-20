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
        if (paramText.trim() === '') {
            vscode.window.showInformationMessage("Empty parameters detected, skipping formatting.");
            return;
        }

        // Detect current indentation
        const line = document.lineAt(document.positionAt(funcNameStart + 1));
        const baseIndent = line.text.match(/^\s*/)[0];
        const indentUnit = editor.options.insertSpaces ? ' '.repeat(editor.options.tabSize) : '\t';
        const innerIndent = baseIndent + indentUnit;

        // Recursive formatting for nested calls
        function splitArgs(argString) {
            let parts = [];
            let depth = 0;
            let current = '';
            let inString = false;
            let quoteChar = '';
        
            for (let i = 0; i < argString.length; i++) {
                const char = argString[i];

                if ((char === '"' || char === "'") && (i === 0 || argString[i - 1] !== '\\')) {
                    if (inString && char === quoteChar) {
                        inString = false;
                    } else if (!inString) {
                        inString = true;
                        quoteChar = char;
                    }
                }
        
                if (!inString) {
                    if (char === ',' && depth === 0) {
                        if (current.trim()) parts.push(current.trim());
                        current = '';
                        continue;
                    } else if (char === '(') {
                        depth++;
                    } else if (char === ')') {
                        depth--;
                    }
                }
        
                current += char;
            }
        
            if (current.trim()) parts.push(current.trim());
            return parts;
        }
        
        function formatArgument(arg, depth) {
            arg = arg.trim();
        
            const levelIndent = baseIndent + indentUnit.repeat(depth);
        
            // test function(...) { ... }
            const isFunction = /^function\s*\([\s\S]*?\)\s*\{[\s\S]*?\}$/.test(arg) ||
                               /^\([\s\S]*?\)\s*=>\s*\{[\s\S]*?\}$/.test(arg);
        
            if (isFunction) {
                const lines = arg.split('\n').map(line => levelIndent + line.trim());
                return lines.join('\n');
            }
        
            const open = arg.indexOf('(');
            const close = arg.lastIndexOf(')');
            if (open !== -1 && close !== -1 && open < close) {
                const funcName = arg.slice(0, open).trim();
                const argContent = arg.slice(open + 1, close).trim();
                const suffix = arg.slice(close + 1).trim();
        
                if (argContent === '') {
                    return `${levelIndent}${funcName}()${suffix ? ' ' + suffix : ''}`;
                }
        
                const innerArgs = splitArgs(argContent);
                const formattedInner = innerArgs.map(a => formatArgument(a, depth + 1)).join(',\n');
                return `${levelIndent}${funcName}(\n${formattedInner}\n${levelIndent})${suffix ? ' ' + suffix : ''}`;
            }
        
            return `${levelIndent}${arg}`;
        }

        const args = splitArgs(paramText);
        const formattedArgs = args
            .map(a => formatArgument(a, 1))  // 初始 depth = 1
            .join(',\n');
        const formatted = `${funcName}(\n${formattedArgs}\n${baseIndent})`;

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

function test() {
    registerCommand('functionBreaker.breakParams1111', function () {
    
    });
    registerCommand('functionBreaker.breakParams1111', function () {
    
    });

    const line = document.lineAt(document.positionAt(funcNameStart + 1));

    if (current.trim()) parts.push(current.trim());
}