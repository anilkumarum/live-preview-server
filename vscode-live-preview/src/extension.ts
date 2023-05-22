import * as vscode from "vscode";
import { InlinePanel } from "./panel-controller/inlinePanel.js";
import statusBar from "./utils/status-bar.js";
import { openBrowser } from "./utils/browser.js";
import { findHTMLDocument } from "./utils/htmldoc.js";
import { userConfig, userCustom } from "./panel-controller/config.js";

const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.path;

export async function activate(context: vscode.ExtensionContext) {
	let port = 2200;
	let previewServer;
	const disposableBrowser = vscode.commands.registerCommand("livePreviewServer.start.openBrowser", async () => {
		const docPath = await startPreviewServer();
		openBrowser("default", `${port}${docPath}`);
		statusBar.setCloseCommand();
	});

	const disposableChrome = vscode.commands.registerCommand(
		"livePreviewServer.start.chromeBrowser",
		async () => {
			const docPath = await startPreviewServer();
			openBrowser("chrome", `${port}${docPath}`);
			statusBar.setCloseCommand();
		}
	);

	const disposableFirefox = vscode.commands.registerCommand(
		"livePreviewServer.start.firefoxBrowser",
		async () => {
			const docPath = await startPreviewServer();
			openBrowser("firefox", `${port}${docPath}`);
			statusBar.setCloseCommand();
		}
	);

	const disposablePanel = vscode.commands.registerCommand("livePreviewServer.start.inlinePreview", async () => {
		const docPath = await startPreviewServer();
		InlinePanel.openPanel(context.extensionUri, docPath, workspaceFolder, port, closePreview);
	});

	const disposableServer = vscode.commands.registerCommand("livePreviewServer.start.server", async () => {
		await startPreviewServer();
		statusBar.setCloseCommand();
	});

	//close server on command
	const disposableClose = vscode.commands.registerCommand("livePreviewServer.close.server", () => {
		closePreview();
		statusBar.setStartCommand();
	});

	context.subscriptions.push(disposableBrowser);
	context.subscriptions.push(disposableChrome);
	context.subscriptions.push(disposableFirefox);
	context.subscriptions.push(disposableServer);
	context.subscriptions.push(disposablePanel);
	context.subscriptions.push(disposableClose);

	async function startPreviewServer() {
		const { PreviewServer } = require("../../preview-server/build/server.js");
		//const { PreviewServer } = await import("../../preview-server/server.js");

		previewServer = new PreviewServer(workspaceFolder, context.extensionPath, userConfig, userCustom);
		port = await previewServer.startServer(port).catch((err) => console.error(err));
		const document = await findHTMLDocument().catch((err) => console.error(err));
		await new Promise((r) => setTimeout(r, 10));

		if (!document) throw new Error("docPath not available");
		userConfig.liveRefresh && previewServer.parseLiveRefresher(document);
		toggleDocumentListener();
		// runCustomCommand("runCompileCommand");

		return document.fileName.slice(workspaceFolder.length);
	}

	function toggleDocumentListener(doDispose = false) {
		if (doDispose) {
			disposableOnDidSave?.dispose();
			disposableOnDidChange?.dispose();
			disposableOnChange?.dispose();
			return;
		}
		var disposableOnDidSave = vscode.workspace.onDidSaveTextDocument(async (textDocument) => {
			// runCustomCommand("runCompileCommand");
			previewServer.reloadOnSave(textDocument.fileName);
		});

		var disposableOnDidChange = vscode.window.onDidChangeActiveTextEditor(async (textEditor) => {
			if (!textEditor) return;
			const textDocument = textEditor.document;
			if (userConfig.liveRefresh) {
				if (textDocument.languageId === "html" || textDocument.languageId === "css")
					previewServer.parseLiveRefresher(textDocument);
			}
			previewServer.onTxtDocumentActive(textDocument);
		});

		/* const disposableOnOpen = vscode.workspace.onDidOpenTextDocument(async (textDocument) => {
			previewServer.onTxtDocumentActive(textDocument);
		});

		context.subscriptions.push(disposableOnOpen); */
		context.subscriptions.push(disposableOnDidSave);
		context.subscriptions.push(disposableOnDidChange);

		if (userConfig.liveRefresh) {
			var disposableOnChange = vscode.workspace.onDidChangeTextDocument((textDocumentChangeEvent) => {
				const { document, contentChanges } = textDocumentChangeEvent;
				if (!contentChanges[0]) return;
				//TODO for-loop  on contentChanges
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
	}

	function closePreview() {
		toggleDocumentListener(true);
		previewServer?.closeServer();
	}
}
