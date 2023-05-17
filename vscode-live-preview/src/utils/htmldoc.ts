import { readdir } from "node:fs/promises";
import { dirname } from "node:path";
import * as vscode from "vscode";

async function getHTMLDocument(dirPath): Promise<vscode.TextDocument> {
	return new Promise(async (resolve, reject) => {
		readdir(dirPath, { withFileTypes: true })
			.then((dirents) => {
				for (const dirent of dirents) {
					if (dirent.name.endsWith(".html")) {
						vscode.workspace.openTextDocument(`${dirPath}/${dirent.name}`).then((doc) => {
							vscode.window.showTextDocument(doc).then((editor) => resolve(editor.document));
						});
					}
				}
			})
			.catch((err) => reject(err));
	});
}

export async function findHTMLDocument() {
	const editor = vscode.window.activeTextEditor;
	if (editor.document.languageId !== "html") {
		const dirPath = dirname(editor.document.fileName);
		return await getHTMLDocument(dirPath);
	}
	return editor.document;
}
