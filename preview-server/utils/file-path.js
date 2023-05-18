import { readdir } from "node:fs/promises";
import { ServerResponse } from "node:http";

const CharCode = {
	Dot: 46,
	Slash: 0x2f, // /
};
/**@param {string} filepath,@returns {string}*/

/**@param {string} filepath*/
export function extname(filepath) {
	let i = filepath.length;
	while (i--) {
		if (filepath.charCodeAt(i) === CharCode.Dot) return filepath.slice(i);
	}
}

/**@param {string} filepath, @returns {boolean}*/
export function hasExt(filepath) {
	let i = filepath.length;
	while (i--) {
		const code = filepath.charCodeAt(i);
		if (code === CharCode.Dot) return true;
		if (code === CharCode.Slash) return false;
		//TODO add support for firefox
	}
}

/**@param {string} filepath*/
export function splitExt(filepath) {
	let i = filepath.length;
	while (i--) {
		if (filepath.charCodeAt(i) === CharCode.Dot) return [filepath.slice(0, i), filepath.slice(i)];
	}
}

export const docExtension = new Set([".html", ".stml", ".htm", ".htmlx"]);
export const docLangId = new Set(["html", "stml", "htm", "htmlx"]);

/**@param {string} cwd, @param {Map<string,string>} fileExtMap*/
export async function createFileExtMap(cwd, fileExtMap) {
	let promises = [];
	async function walkDir(dirPath) {
		const dirents = await readdir(cwd + dirPath, { withFileTypes: true });

		for (const dirent of dirents) {
			const direntPath = `${dirPath}/${dirent.name}`;
			if (dirent.isDirectory()) promises.push(walkDir(direntPath));
			else {
				const pathData = splitExt(direntPath);
				if (pathData && docExtension.has(pathData[1])) fileExtMap.set(pathData[0], pathData[1]);
			}
		}
	}
	promises.push(walkDir(""));
	await Promise.all(promises).catch((err) => console.error(err));
}

/**@param {string} filePath, @param {ServerResponse} res*/
export function err404(filePath, res) {
	res.writeHead(404);
	res.end("file not found");
}
