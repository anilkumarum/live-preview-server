import * as vscode from "vscode";
const configMap = vscode.workspace.getConfiguration("livePreviewServer.config");

type UserConfig = {
	liveRefresh: boolean;
	customElementHMR: boolean;
	defaultBrowser: string;
	serverPort: number;
	baseDir: string;
	updateBrowserPath: object;
};

type UserCustom = {};

export const userConfig: UserConfig = {
	liveRefresh: configMap.get("liveRefresh"),
	customElementHMR: configMap.get("customElementHMRectory"),
	defaultBrowser: configMap.get("defaultBrowserectory"),
	serverPort: configMap.get("serverPort"),
	baseDir: configMap.get("baseDir"),
	updateBrowserPath: configMap.get("updateBrowserPath"),
};

export const userCustom: UserCustom = {
	httpHeaders: configMap.get("httpHeaders"),
};
