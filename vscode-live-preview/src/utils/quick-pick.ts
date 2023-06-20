import { commands, window } from "vscode";
import { userCustom } from "./config.js";
import { LaunchBrowsers } from "./constant.js";
// import { spawn } from "node:child_process";

export async function showQuickPick() {
	const quickPickBrowsers = userCustom.quickPickBrowsers;
	if (typeof quickPickBrowsers !== "object") return window.showErrorMessage("invalid browser list");

	const browser = await window.showQuickPick(Object.keys(quickPickBrowsers));
	if (quickPickBrowsers[browser] === "default") {
		LaunchBrowsers[browser]
			? commands.executeCommand(LaunchBrowsers[browser])
			: window.showErrorMessage("browser command not found");
	} else {
		// const browserProcess = spawn(quickPickBrowsers[browser], {
		// 	detached: true,
		// 	stdio: "ignore",
		// });
		// //browserProcess.on("error", (error) => window.showErrorMessage(`can't launch browser: ${error}`));
		// browserProcess.unref();
		if (quickPickBrowsers[browser]) {
			const terminal = window.createTerminal(`live preview server`);
			terminal.sendText(quickPickBrowsers[browser]);
		}
	}
}
