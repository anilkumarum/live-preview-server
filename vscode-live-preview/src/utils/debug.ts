import * as vscode from "vscode";
import { openBrowser } from "./browser.js";

const debugConfig = (pageUrl: string) => ({
	type: "chrome",
	request: "launch",
	name: "Debug localhost",
	url: pageUrl,
	webRoot: "${workspaceFolder}",
});

async function setLaunchConfig(cwd: string, pageUrl: string) {
	const launchConfig = vscode.workspace.getConfiguration("launch", vscode.workspace.workspaceFolders[0].uri);
	const configurations: vscode.WorkspaceConfiguration = launchConfig.get("configurations");
	const index = configurations.findIndex((config) => config.url === pageUrl);
	index === -1 && configurations.push(debugConfig(pageUrl));
	launchConfig.update("configurations", configurations, vscode.ConfigurationTarget.WorkspaceFolder).then(() => {
		// take action here
	});
}

export async function launchDebug(cwd, port, pagePath) {
	const pageUrl = `http://localhost:${port}${pagePath}`;
	setLaunchConfig(cwd, pageUrl);
	vscode.commands.executeCommand("workbench.action.debug.start");
	openBrowser("chrome", `${port}${pagePath}`);
}
