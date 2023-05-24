// import { performance } from "node:perf_hooks";
import * as vscode from "vscode";
import { userConfig } from "./config.js";
import { Command, LaunchBrowsers } from "./constant.js";

class StatusBar {
	#statusBarItem: vscode.StatusBarItem;
	constructor() {
		this.#statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 2);
		this.setStartCommand();
	}

	setStartCommand() {
		this.#statusBarItem.text = `$(globe) Browser`;
		this.#statusBarItem.tooltip = this.#setToolTip();
		this.#statusBarItem.command = Command.LaunchDefault;
		this.#statusBarItem.show();
	}

	#setToolTip() {
		const tooltip = new vscode.MarkdownString(`Select browser<br>${this.getBrowserList()}`);
		tooltip.supportHtml = true;
		tooltip.isTrusted = true;
		return tooltip;
	}

	getBrowserList() {
		//TODO other quickpick item
		let browsers = userConfig.toolTipBrowsers.map(
			(browser) =>
				`&nbsp;&nbsp;&nbsp;&nbsp;[${browser}](command:${LaunchBrowsers[browser ?? Command.LaunchDefault]})`
		);

		return browsers.join("<br>");
	}

	setCloseCommand() {
		this.#statusBarItem.text = "Close Server";
		this.#statusBarItem.command = Command.CloseServer;
		this.#statusBarItem.tooltip = "close live preview server";
	}

	hide() {
		this.#statusBarItem.hide();
	}
}

export default new StatusBar();
