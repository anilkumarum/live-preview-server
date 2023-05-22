import * as vscode from "vscode";
import { getDirListings } from "./helper.js";
import ConsoleOutput from "../utils/output-channel.js";

export class WebComm {
	console = new ConsoleOutput("LPS Preview Console");

	constructor(private webview: vscode.Webview, private cwd: string) {
		webview.onDidReceiveMessage((message) => this.handlers[message.command](message));
	}

	handlers = {
		sendDirListing: async (message) => {
			const dirListings = await getDirListings(this.cwd + message.dirPath);
			this.webview.postMessage({ type: "completionList", dirListings });
		},

		openDevTools() {
			vscode.commands.executeCommand("workbench.action.webview.openDeveloperTools");
		},

		console: (message) => {
			this.console.write(message.type, message.args);
		},
	};
}
