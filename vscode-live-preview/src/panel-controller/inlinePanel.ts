import * as vscode from "vscode";
import { getHTMLContent, getWebviewOptions, getWebviewPanelOptions } from "./helper.js";
import { WebComm } from "./webcomm.js";
import ConsoleOutput from "../utils/output-channel.js";

export class InlinePanel {
	static currentPanel: InlinePanel | undefined;
	static closePreview: Function;
	static console: ConsoleOutput;

	constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this.#panel = panel;
		this.#extensionUri = extensionUri;
		this.#panel.onDidDispose(() => this.dispose(), null);
	}

	#panel: vscode.WebviewPanel;
	#extensionUri: vscode.Uri;
	static column: vscode.ViewColumn = vscode.ViewColumn.Two;

	static openPanel(
		extensionUri: vscode.Uri,
		iframeUrl: string,
		cwd: string,
		port: number,
		closePreview: Function
	) {
		if (InlinePanel.currentPanel) {
			InlinePanel.currentPanel.#panel.reveal(InlinePanel.column);
			return;
		}

		const panel = vscode.window.createWebviewPanel("liveHTMLPreview", "liveHTMLPreview", InlinePanel.column, {
			...getWebviewOptions(extensionUri),
			...getWebviewPanelOptions(),
		});

		InlinePanel.currentPanel = new InlinePanel(panel, extensionUri);
		InlinePanel.closePreview = closePreview;

		//convert absolutepath into webview uri path
		const cssFile = vscode.Uri.joinPath(extensionUri, "panel-ui", "address-bar.css");
		const jsFile = vscode.Uri.joinPath(extensionUri, "panel-ui", "address-bar.js");
		const cssSrc = panel.webview.asWebviewUri(cssFile);
		const jsSrc = panel.webview.asWebviewUri(jsFile);
		// set HTML content
		panel.webview.html = getHTMLContent(jsSrc, cssSrc, iframeUrl, port);
		InlinePanel.console = new ConsoleOutput();
		InlinePanel.console.create("LPS Preview Console");
		//navigation controller
		new WebComm(panel.webview, cwd, InlinePanel.console);
	}

	dispose() {
		InlinePanel.currentPanel = undefined;
		InlinePanel.closePreview();
		InlinePanel.console.dispose();
		// Clean up our resources
		this.#panel.dispose();
	}
}
