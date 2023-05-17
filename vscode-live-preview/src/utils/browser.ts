import * as vscode from "vscode";

const defaultBrowser = {
	linux: "xdg-open",
	win32: "explorer",
	darwin: "open",
};

const win32 = {
	chrome: "start chrome",
	firefox: "start firefox",
	brave: "start brave",
};

const linux = {
	chrome: "google-chrome",
	firefox: "firefox",
	brave: "brave-browser",
};

const darwin = {
	chrome: 'open -a "Google Chrome" -g ',
	firefox: "open -a firefox -g ",
	brave: 'open -a "Brave Browser"',
};

const platforms = {
	linux: linux,
	win32: win32,
	darwin: darwin,
};

function getBrowserCommand(browser, platform, url) {
	url = "http://localhost:" + url;
	if (browser === "default") return `${defaultBrowser[platform]} ${url}`;
	let browserCmd = `${platforms[platform][browser]} ${url}`;
	platform === "linux" && (browserCmd += " &");
	return browserCmd;
}

export function openBrowser(browser = "default", url: string) {
	const terminal = vscode.window.createTerminal(`live preview server`);
	const browserCmd = getBrowserCommand(browser, process.platform, url);
	terminal.sendText(browserCmd);
	setTimeout(() => terminal.dispose(), 1000);
}
