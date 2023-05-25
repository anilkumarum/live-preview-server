const vscode = require("vscode");
// import vscode from "vscode";

/**@param {number} start, @param {number} end*/
// export
function highlightVsLine(start, end) {
	const editor = vscode.window.activeTextEditor;
	const positionStart = editor.document.positionAt(start);
	const positionEnd = editor.document.positionAt(end);
	const range = new vscode.Range(positionStart, positionEnd);
	editor.selection = new vscode.Selection(positionStart, positionEnd);
	editor.revealRange(range);
}
exports.highlightVsLine = highlightVsLine;
