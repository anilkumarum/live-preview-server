import * as vscode from "vscode";
import { getHTMLContent, getWebviewOptions, getWebviewPanelOptions } from "./helper.js";
import { WebComm } from "./webcomm.js";

export class InlinePanel {
	static currentPanel: InlinePanel | undefined;

	constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this.#panel = panel;
		this.#extensionUri = extensionUri;
		this.#panel.onDidDispose(() => this.dispose(), null);
	}

	#panel: vscode.WebviewPanel;
	#extensionUri: vscode.Uri;
	static column: vscode.ViewColumn = vscode.ViewColumn.Two;

	static openPanel(extensionUri: vscode.Uri, iframeUrl, cwd: string) {
		if (InlinePanel.currentPanel) {
			InlinePanel.currentPanel.#panel.reveal(InlinePanel.column);
			return;
		}

		const panel = vscode.window.createWebviewPanel("liveHTMLPreview", "liveHTMLPreview", InlinePanel.column, {
			...getWebviewOptions(extensionUri),
			...getWebviewPanelOptions(),
		});

		InlinePanel.currentPanel = new InlinePanel(panel, extensionUri);

		//convert absolutepath into webview uri path
		const cssFile = vscode.Uri.joinPath(extensionUri, "panel-ui", "address-bar.css");
		const jsFile = vscode.Uri.joinPath(extensionUri, "panel-ui", "address-bar.js");
		const cssSrc = panel.webview.asWebviewUri(cssFile);
		const jsSrc = panel.webview.asWebviewUri(jsFile);
		// set HTML content
		panel.webview.html = getHTMLContent(jsSrc, cssSrc, iframeUrl);
		//navigation controller
		new WebComm(panel.webview, cwd);
	}

	showDevTools() {
		vscode.commands.executeCommand("workbench.action.webview.openDeveloperTools");
	}

	dispose() {
		InlinePanel.currentPanel = undefined;

		// Clean up our resources
		this.#panel.dispose();
	}
}