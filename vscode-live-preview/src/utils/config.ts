import * as vscode from "vscode";
const configMap = vscode.workspace.getConfiguration("livePreviewServer.config");
const customMap = vscode.workspace.getConfiguration("livePreviewServer.custom");

type UserConfig = {
	liveRefresh: boolean;
	customElementHMR: boolean;
	compileTs: boolean;
	statusBarCommand: string;
	defaultBrowser: string;
	serverPort: number;
	baseDir: string;
	updateBrowserPath: object;
	toolTipBrowsers: string[];
};

type UserCustom = {
	httpHeaders: object;
	quickPickBrowsers: string[];
};

export const userConfig: UserConfig = {
	liveRefresh: configMap.get("liveRefresh"),
	customElementHMR: configMap.get("customElementHMR"),
	defaultBrowser: configMap.get("defaultBrowser"),
	statusBarCommand: configMap.get("statusBarCommand"),
	serverPort: configMap.get("serverPort"),
	baseDir: configMap.get("baseDir"),
	compileTs: configMap.get("compileTs"),
	updateBrowserPath: configMap.get("updateBrowserPath"),
	toolTipBrowsers: configMap.get("toolTipBrowsers"),
};

export const userCustom: UserCustom = {
	httpHeaders: customMap.get("httpHeaders"),
	quickPickBrowsers: customMap.get("quickPickBrowsers"),
};

export function configChangeHandler({ affectsConfiguration }) {
	//config check
	const isAffected = affectsConfiguration("livePreviewServer.config");
	if (isAffected) {
		for (const configKey in userConfig) userConfig[configKey] = configMap.get(configKey);
	}
	//custom check
	const isAffected2 = affectsConfiguration("livePreviewServer.custom");
	if (isAffected2) {
		for (const customKey in userCustom) userCustom[customKey] = customMap.get(customKey);
	}
}
