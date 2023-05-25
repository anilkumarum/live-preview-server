// const { readFile } = require("node:fs/promises");
import { readFile } from "node:fs/promises";

const ModuleKind = {
	ES2022: 7,
	ESNext: 99,
};

const ScriptTarget = {
	ES2022: 9,
	ESNext: 99,
	Latest: 99,
};

const JsxEmit = {
	None: 0,
	Preserve: 1,
	React: 2,
	ReactNative: 3,
	ReactJSX: 4,
	ReactJSXDev: 5,
};

const tscConfig = {
	compilerOptions: {
		module: ModuleKind.ESNext,
		jsx: JsxEmit.None,
		target: ScriptTarget.ESNext,
	},
};

let typescriptPath = "/usr/local/lib/node_modules/typescript";
process.platform === "win32" &&
	(typescriptPath = `C:\\Users\\${process.env.USERNAME}\\AppData\\Roaming\\npm\\node_modules`);

/**@param {string}filePath, @returns {Promise<string>} */
export async function transformTS(filePath) {
	// exports.transformTS = transformTS;
	// async function transformTS(filePath) {
	try {
		const { transpileModule } = require(typescriptPath);
		const content = await readFile(filePath, { encoding: "utf8" });
		const result = transpileModule(content, tscConfig);
		if (!result.outputText) return "cannot compile";
		return result.outputText;
	} catch (error) {
		return error.message;
	}
}
