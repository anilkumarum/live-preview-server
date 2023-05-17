import * as vscode from "vscode";
import { InlinePanel } from "./panel-controller/inlinePanel.js";
import "./utils/status-bar.js";
import { openBrowser } from "./utils/browser.js";
import { findHTMLDocument } from "./utils/htmldoc.js";

const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.path;

export async function activate(context: vscode.ExtensionContext) {
	const port = 3300;
	const disposableBrowser = vscode.commands.registerCommand("livePreviewServer.start.openBrowser", async () => {
		const docPath = await startPreviewServer();
		openBrowser("default", `${port}${docPath}`);
	});

	const disposableChrome = vscode.commands.registerCommand(
		"livePreviewServer.start.chromeBrowser",
		async () => {
			const docPath = await startPreviewServer();
			openBrowser("chrome", `${port}${docPath}`);
		}
	);

	const disposableFirefox = vscode.commands.registerCommand(
		"livePreviewServer.start.firefoxBrowser",
		async () => {
			const docPath = await startPreviewServer();
			openBrowser("firefox", `${port}${docPath}`);
		}
	);

	const disposableServer = vscode.commands.registerCommand("livePreviewServer.start.server", async () => {
		await startPreviewServer();
	});

	const disposablePanel = vscode.commands.registerCommand("livePreviewServer.start.inlinePreview", async () => {
		const docPath = await startPreviewServer();
		InlinePanel.openPanel(context.extensionUri, docPath, workspaceFolder);
	});
	context.subscriptions.push(disposableBrowser);
	context.subscriptions.push(disposableChrome);
	context.subscriptions.push(disposableFirefox);
	context.subscriptions.push(disposableServer);
	context.subscriptions.push(disposablePanel);

	async function startPreviewServer() {
		const { PreviewServer } = await import("preview-server");
		const isLiveRefresh = true;
		const previewServer = new PreviewServer(workspaceFolder, context.extensionPath, isLiveRefresh);
		const document = await findHTMLDocument().catch((err) => console.error(err));
		await new Promise((r) => setTimeout(r, 100));
		if (!document) return console.error("docPath not available");
		previewServer.onTxtDocumentOpen(document);

		const disposableOnDidSave = vscode.workspace.onDidSaveTextDocument(async (textDocument) => {
			// runCustomCommand("runCompileCommand");
			previewServer.reloadOnSave(textDocument.fileName);
		});

		const disposableOnOpen = vscode.workspace.onDidOpenTextDocument(async (textDocument) => {
			// runCustomCommand("runCompileCommand");
			if (textDocument.languageId === "html" || textDocument.languageId === "css")
				previewServer.onTxtDocumentOpen(textDocument);
		});

		// runCustomCommand("runCompileCommand");
		context.subscriptions.push(disposableOnDidSave);
		context.subscriptions.push(disposableOnOpen);

		if (isLiveRefresh) {
			const disposableOnChange = vscode.workspace.onDidChangeTextDocument((textDocumentChangeEvent) => {
				const { document, contentChanges } = textDocumentChangeEvent;
				switch (document.languageId) {
					case "html":
						previewServer.updateElementAtPosition(contentChanges[0], document);
						break;
					case "css":
						previewServer.updateRuleAtPosition(contentChanges[0], document);
						break;
				}
			});

			context.subscriptions.push(disposableOnChange);
		}

		//close server on command
		const disposableClose = vscode.commands.registerCommand("livePreviewServer.close.server", () => {
			previewServer.closeServer();
		});
		context.subscriptions.push(disposableClose);
		return document.fileName.slice(workspaceFolder.length);
	}
}
