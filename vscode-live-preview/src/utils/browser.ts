import * as vscode from "vscode";

const defaultBrowser = {
	linux: "xdg-open",
	win32: "explorer",
	darwin: "open",
};

const win32 = {
	Brave: "start brave",
	Chrome: "start chrome",
	Chromium: "start chromium-browser",
	Edge: "start msedge",
	Firefox: "start firefox",
	Opera: "start opera",
	Vivaldi: "start vivaldi",
};

const linux = {
	Brave: "brave-browser",
	Chrome: "google-chrome",
	Chromium: "chromium-browser",
	Edge: "msedge",
	Firefox: "firefox",
	Opera: "opera",
	Vivaldi: "vivaldi",
};

const darwin = {
	Brave: 'open -a "Brave Browser"',
	Chrome: 'open -a "Google Chrome" -g ',
	Chromium: "open -a chromium",
	Edge: 'open -a  "Microsoft Edge"',
	Firefox: "open -a firefox -g ",
	Safari: 'open -a "Brave Browser"',
	Opera: "open -a Opera",
	Vivaldi: "open -a vivaldi",
};

const platforms = {
	linux: linux,
	win32: win32,
	darwin: darwin,
};

function getBrowserCommand(browser: string, platform: string, url: string) {
	url = "http://localhost:" + url;
	if (browser === "Default") return `${defaultBrowser[platform]} ${url}`;
	let browserCmd = `${platforms[platform][browser]} ${url}`;
	platform === "linux" && (browserCmd += " & disown");
	return browserCmd;
}

export function openBrowser(browser = "default", url: string) {
	const terminal = vscode.window.createTerminal(`live preview server`);
	const browserCmd = getBrowserCommand(browser, process.platform, url);
	terminal.sendText(browserCmd);
	setTimeout(() => terminal.dispose(), 2000);
}
