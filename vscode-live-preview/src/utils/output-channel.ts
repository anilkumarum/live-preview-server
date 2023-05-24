import * as vscode from "vscode";

export enum OutputLevel {
	trace = 1,
	debug = 2,
	info = 3,
	warn = 4,
	error = 5,
}
const userLogLevel = OutputLevel.error;

export default class ConsoleOutput {
	#msgChannel: vscode.OutputChannel;

	constructor(channel) {
		this.#msgChannel = vscode.window.createOutputChannel(channel, "javascript");
		this.#msgChannel.show();
	}

	write(method: string, msg: string) {
		OutputLevel[method] >= userLogLevel && this.#msgChannel.show();
		this.#msgChannel.appendLine(`[${new Date().toLocaleTimeString()}] ${method} ${msg}`);
	}

	log(msg: string) {
		this.#msgChannel.appendLine(msg);
	}

	dispose() {
		this.#msgChannel.dispose();
	}
}
