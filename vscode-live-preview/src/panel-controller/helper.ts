import * as vscode from "vscode";
import { readdir } from "node:fs/promises";

export function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
	return {
		enableScripts: true,
		localResourceRoots: [vscode.Uri.joinPath(extensionUri, "panel-ui")],
	};
}

export function getWebviewPanelOptions() {
	return {
		retainContextWhenHidden: true,
		enableFindWidget: true,
	};
}

export function getHTMLContent(jsSrc: vscode.Uri, cssSrc: vscode.Uri, iframeUrl, port = 3300) {
	return `<!DOCTYPE html>
	<html lang="en">
	
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎯</text></svg>">
		<title>Live html preview </title>
        <link rel="stylesheet" href="${cssSrc}">
	</head>

	
	<body>
        <style>
            body {
                padding: 0;
                background-color: #fff;
            }
        </style>
            
        <script type="module" src="${jsSrc}"></script>
        <address-bar port="${port}"></address-bar>
        <main>
            <iframe id="hostedContent" src="http://localhost:${port}${iframeUrl}" frameborder="0"></iframe>
        </main>
        
	</body>
	
	</html>`;
}

//TODO cache suggestion list
export async function getDirListings(dirPath: string): Promise<{ name: string; isDirectory: boolean }[]> {
	try {
		const dirents = await readdir(dirPath, { withFileTypes: true });
		const dirListings = dirents.map((dirent) => ({ name: dirent.name, isDirectory: dirent.isDirectory() }));
		return dirListings;
	} catch (error) {
		return [];
	}
}
