import { readdir, writeFile } from "node:fs/promises";
import { ServerResponse } from "node:http";
import { serveFile } from "../services/file-serve.js";

class FilePath {
	/**@param {string} name, @param {string} path, @param {boolean} isDirectory */
	constructor(name, path, isDirectory) {
		this.id = name;
		this.name = name;
		this.isDirectory = isDirectory;
		this.path = path;
		isDirectory && (this.files = []);
	}
}

/**@param {string} cwd*/
export async function createDirTree(cwd) {
	const dirTree = { root: [] };

	let promises = [];
	async function walkDir(dirPath, openDir) {
		const dirents = await readdir(cwd + dirPath, { withFileTypes: true });

		for (const dirent of dirents) {
			const direntPath = `${dirPath}/${dirent.name}`;
			if (dirent.isDirectory()) {
				const folderPath = new FilePath(dirent.name, direntPath, true);
				openDir.push(folderPath);
				promises.push(walkDir(direntPath, folderPath.files));
			} else {
				openDir.push(new FilePath(dirent.name, direntPath, false));
			}
		}
	}
	promises.push(walkDir("", dirTree.root));
	await Promise.all(promises).catch((err) => console.error(err));
	await new Promise((r) => setTimeout(r, 100)); //fix later
	return dirTree;
}

/**@param {string} cwd, @param {Map} docFileExtMap, @param {ServerResponse} res*/
export async function getRedirectRoutes(cwd, docFileExtMap, res) {
	const filePath = cwd + "/.vscode/redirects.json";
	const jsonData = await import(filePath, { assert: { type: "json" } }).catch((err) => {
		console.error("no file");
	});
	let redirects = jsonData ? jsonData.default : {};

	let redirectRoutes = [];
	docFileExtMap.forEach((value, key) => {
		const docPath = key + value;
		const rediretItem = {
			filePath: docPath,
			redirects: redirects[docPath] || [],
		};
		redirectRoutes.push(rediretItem);
	});
	return redirectRoutes;
}

//PUT request
/**@param {string} cwd, @param {string} data*/
export async function updateRedirectRoute(cwd, data) {
	const reqData = JSON.parse(data);
	const redirectFilePath = cwd + "/.vscode/redirects.json";
	const jsonData = await import(redirectFilePath, { assert: { type: "json" } }).catch((err) => {
		console.error("redirects.json not find");
	});
	const redirectData = jsonData ? jsonData.default : {};

	redirectData[reqData.filePath] ??= [];
	redirectData[reqData.filePath].push(reqData.redirectPath);
	await writeFile(redirectFilePath, JSON.stringify(redirectData));
}
