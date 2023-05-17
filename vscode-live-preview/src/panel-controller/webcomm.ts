import * as vscode from "vscode";
import { getDirListings } from "./helper.js";

export class WebComm {
	constructor(private webview: vscode.Webview, private cwd: string) {
		webview.onDidReceiveMessage((message) => this.handlers[message.command](message));
	}

	handlers = {
		sendDirListing: async (message) => {
			const dirListings = await getDirListings(this.cwd + message.dirPath);
			this.webview.postMessage({ type: "completionList", dirListings });
		},
	};
}
