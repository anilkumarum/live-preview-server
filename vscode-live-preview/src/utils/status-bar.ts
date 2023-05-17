// import { performance } from "node:perf_hooks";
import * as vscode from "vscode";

class StatusBar {
	#statusBarItem: vscode.StatusBarItem;
	constructor() {
		this.#statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 2);
		this.#init();
	}

	#init() {
		this.setText(`open in browser`);
		this.#statusBarItem.tooltip = this.#setToolTip();
		this.#statusBarItem.command = "livePreviewServer.start.openBrowser";
		this.#statusBarItem.show();
	}

	#setToolTip() {
		const tooltip = new vscode.MarkdownString(`select browser<br>
		&nbsp;&nbsp;&nbsp;&nbsp;[chrome](command:livePreviewServer.start.chromeBrowser)<br>
		&nbsp;&nbsp;&nbsp;&nbsp;[firefox](command:livePreviewServer.start.firefoxBrowser)<br>
		&nbsp;&nbsp;&nbsp;&nbsp;[other](command:other)`);
		tooltip.supportHtml = true;
		tooltip.isTrusted = true;
		return tooltip;
	}

	setText(text: string) {
		this.#statusBarItem.text = text;
	}

	hide() {
		this.#statusBarItem.hide();
	}
}

export default new StatusBar();
