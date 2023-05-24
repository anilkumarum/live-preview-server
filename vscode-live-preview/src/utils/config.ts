import * as vscode from "vscode";
const configMap = vscode.workspace.getConfiguration("livePreviewServer.config");
const customMap = vscode.workspace.getConfiguration("livePreviewServer.custom");

type UserConfig = {
	liveRefresh: boolean;
	customElementHMR: boolean;
	compileTs: boolean;
	defaultBrowser: string;
	serverPort: number;
	baseDir: string;
	updateBrowserPath: object;
	toolTipBrowsers: string[];
};

type UserCustom = {
	httpHeaders: object;
};

export const userConfig: UserConfig = {
	liveRefresh: configMap.get("liveRefresh"),
	customElementHMR: configMap.get("customElementHMRectory"),
	defaultBrowser: configMap.get("defaultBrowserectory"),
	serverPort: configMap.get("serverPort"),
	baseDir: configMap.get("baseDir"),
	compileTs: configMap.get("compileTs"),
	updateBrowserPath: configMap.get("updateBrowserPath"),
	toolTipBrowsers: configMap.get("toolTipBrowsers"),
};

export const userCustom: UserCustom = {
	httpHeaders: customMap.get("httpHeaders"),
};
