import * as vscode from "vscode";
import { InlinePanel } from "./panel-controller/inlinePanel.js";
import statusBar from "./utils/status-bar.js";
import { openBrowser } from "./utils/browser.js";
import { findHTMLDocument } from "./utils/htmldoc.js";
import { userConfig, userCustom } from "./utils/config.js";
import ConsoleOutput from "./utils/output-channel.js";
import { launchDebug } from "./utils/debug.js";
import { Command } from "./utils/constant.js";

const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;

export async function activate(context: vscode.ExtensionContext) {
	let port = userConfig.serverPort || 2200;
	let previewServer;
	const disposableBrowser = vscode.commands.registerCommand(Command.LaunchDefault, async () => {
		const docPath = await startPreviewServer();
		openBrowser("default", `${port}${docPath}`);
		statusBar.setCloseCommand();
	});

	const disposableChrome = vscode.commands.registerCommand(Command.LaunchChrome, async () => {
		const docPath = await startPreviewServer();
		openBrowser("chrome", `${port}${docPath}`);
		statusBar.setCloseCommand();
	});

	const disposableFirefox = vscode.commands.registerCommand(Command.LaunchFirefox, async () => {
		const docPath = await startPreviewServer();
		openBrowser("firefox", `${port}${docPath}`);
		statusBar.setCloseCommand();
	});

	const disposablePanel = vscode.commands.registerCommand(Command.InlinePreview, async () => {
		const docPath = await startPreviewServer();
		InlinePanel.openPanel(context.extensionUri, docPath, workspaceFolder, port, closePreview);
	});

	const disposableServer = vscode.commands.registerCommand(Command.StartServer, async () => {
		await startPreviewServer();
		statusBar.setCloseCommand();
	});

	const disposableDebug = vscode.commands.registerCommand(Command.DebugServer, async () => {
		const docPath = await startPreviewServer();
		await launchDebug(workspaceFolder, port, docPath);
		statusBar.setCloseCommand();
	});

	//close server on command
	const disposableClose = vscode.commands.registerCommand(Command.CloseServer, () => {
		closePreview();
		statusBar.setStartCommand();
	});

	context.subscriptions.push(disposableBrowser);
	context.subscriptions.push(disposableChrome);
	context.subscriptions.push(disposableFirefox);
	context.subscriptions.push(disposableServer);
	context.subscriptions.push(disposableDebug);
	context.subscriptions.push(disposablePanel);
	context.subscriptions.push(disposableClose);

	async function startPreviewServer() {
		const { PreviewServer } = require("../../preview-server/build/server.js");
		// const { PreviewServer } = await import("../../preview-server/server.js");
		const serverLogger = new ConsoleOutput("LPS server log");
		const extPath = context.extensionPath;
		//start preview server
		previewServer = new PreviewServer(workspaceFolder, extPath, userConfig, serverLogger, userCustom);
		port = await previewServer.startServer(port).catch(async (err) => console.error(err));
		if (!port) return vscode.window.showErrorMessage("Cannot start server");
		//find html file in current directory
		const document = await findHTMLDocument().catch((err) => console.error(err));
		await new Promise((r) => setTimeout(r, 100));

		if (!document) return vscode.window.showErrorMessage("docPath not available");
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
			previewServer.reloadOnSave(textDocument);
		});

		var disposableOnDidChange = vscode.window.onDidChangeActiveTextEditor(async (textEditor) => {
			if (!textEditor) return;
			const textDocument = textEditor.document;
			if (userConfig.liveRefresh) {
				if (textDocument.languageId === "html" || textDocument.languageId === "css")
					previewServer.parseLiveRefresher(textDocument);
			}
			previewServer.changePageUrl(textDocument);
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

export function deactivate() {}
