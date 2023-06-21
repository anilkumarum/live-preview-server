import * as vscode from "vscode";
import statusBar from "./utils/status-bar.js";
import ConsoleOutput from "./utils/output-channel.js";
import { configChangeHandler, userConfig, userCustom } from "./utils/config.js";
import { InlinePanel } from "./panel-controller/inlinePanel.js";
import { openBrowser } from "./utils/browser.js";
import { findHTMLDocument } from "./utils/htmldoc.js";
import { launchDebug } from "./utils/debug.js";
import { Command, LaunchBrowsers } from "./utils/constant.js";
import { showQuickPick } from "./utils/quick-pick.js";

const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;

export async function activate(context: vscode.ExtensionContext) {
	let port = userConfig.serverPort || 2200;
	var previewServer;

	for (const browser in LaunchBrowsers) {
		const disposableBrowser = vscode.commands.registerCommand(LaunchBrowsers[browser], async () => {
			try {
				const docPath = await startPreviewServer();
				openBrowser(browser, `${port}${docPath}`);
				statusBar.setCloseCommand();
			} catch (error) {}
		});
		context.subscriptions.push(disposableBrowser);
	}

	const disposablePanel = vscode.commands.registerCommand(Command.InlinePreview, async () => {
		try {
			const docPath = await startPreviewServer();
			InlinePanel.openPanel(context.extensionUri, docPath, workspaceFolder, port, closePreview);
		} catch (error) {}
	});

	const disposableServer = vscode.commands.registerCommand(Command.StartServer, () => {
		try {
			startPreviewServer();
			statusBar.setCloseCommand();
		} catch (error) {}
	});

	const disposableDebug = vscode.commands.registerCommand(Command.DebugServer, async () => {
		try {
			const docPath = await startPreviewServer();
			await launchDebug(workspaceFolder, port, docPath);
			statusBar.setCloseCommand();
		} catch (error) {}
	});

	const disposableQuickpick = vscode.commands.registerCommand(Command.PickBrowser, showQuickPick);

	//close server on command
	const disposableClose = vscode.commands.registerCommand(Command.CloseServer, () => {
		closePreview();
		statusBar.setStartCommand();
	});
	const disposableOnConfig = vscode.workspace.onDidChangeConfiguration(configChangeHandler);

	context.subscriptions.push(disposableServer);
	context.subscriptions.push(disposableQuickpick);
	context.subscriptions.push(disposableDebug);
	context.subscriptions.push(disposablePanel);
	context.subscriptions.push(disposableClose);
	context.subscriptions.push(disposableOnConfig);

	async function startPreviewServer(): Promise<string> {
		const { PreviewServer } = require("../../preview-server/build/server.js");
		//const { PreviewServer } = await import("../../preview-server/server.js");
		const serverLogger = new ConsoleOutput();
		const extPath = context.extensionPath;
		//start preview server
		previewServer = new PreviewServer(workspaceFolder, extPath, userConfig, serverLogger, userCustom);
		return new Promise((resolve, reject) => {
			previewServer.startServer(port).then(getHtmlFile.bind(null, resolve)).catch(errorHandler);

			async function errorHandler(error: string) {
				if (error === "EADDRINUSE")
					await previewServer.startServer(++port).then(getHtmlFile.bind(null, resolve)).catch(errorHandler);
				else vscode.window.showErrorMessage("Cannot start server at port" + port), reject();
			}
		});
	}

	async function getHtmlFile(resolve: Function) {
		let htmlFilePath: string;
		try {
			const document = await findHTMLDocument();
			userConfig.liveRefresh && previewServer.parseLiveRefresher(document);
			htmlFilePath = document.fileName.slice(workspaceFolder.length);
		} catch (error) {
			vscode.window.showErrorMessage("html file not found. Preview Server start without html file");
		} finally {
			//runCustomCommand("runCompileCommand");
			toggleDocumentListener();
			resolve(htmlFilePath);
		}
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

		context.subscriptions.push(disposableOnDidSave);
		context.subscriptions.push(disposableOnDidChange);

		if (userConfig.liveRefresh) {
			var disposableOnChange = vscode.workspace.onDidChangeTextDocument((textDocumentChangeEvent) => {
				const { document, contentChanges } = textDocumentChangeEvent;
				if (!Array.isArray(contentChanges)) return;

				for (const contentChange of contentChanges) {
					switch (document.languageId) {
						case "html":
							previewServer.updateElementAtPosition(contentChange, document);
							break;
						case "css":
							previewServer.updateRuleAtPosition(contentChange, document);
							break;
					}
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

export function deactivate() {
	//@ts-ignore
	previewServer?.closeServer();
}
