import { createServer, Server, ServerResponse } from "node:http";
import { clr } from "./utils/color.js";
import RouteServer from "./services/route-server.js";
import { docLangId } from "./utils/file-path.js";
import { join } from "node:path";
import { getNextOpenPort } from "./utils/port.js";

/**
 * @typedef change
 * @type {object}
 * @property {{start:object}} range
 * @property {number} rangeOffset
 * @property {number} rangeLength
 * @property {string} text
 */

/**
 * @typedef document
 * @type {object}
 * @property {string} languageId
 * @property {string} fileName
 * @property {Function} getText
 * @property {Function} getWordRangeAtPosition
 * @property {Function} offsetAt
 */

/** @param {ServerResponse} res */
function connectClient(res) {
	console.info(`\x1B[47m%s\x1B[0m`, " client connected ");
	console.info(clr["cyan"], "waiting for file change");
	res.writeHead(200, {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "GET,OPTIONS",
		"Access-Control-Allow-Private-Network": "true",
		"Access-Control-Allow-Headers": "Cache-Control",
		"Content-Type": "text/event-stream",
		"Cache-Control": "no-cache",
		Connection: "keep-alive",
	});
	res.write(`data:hmr connected\n\n`);
}

const created = (port) => console.info(clr["green"], `preview-server ready at ${port} port.`);

let HtmlRefresher, CssRefresher;
async function loadRefresher() {
	HtmlRefresher = (await import("../html-refresher/index.mjs")).HtmlRefresher;
	CssRefresher = (await import("../css-refresher/index.mjs")).CssRefresher;
}

export class PreviewServer extends RouteServer {
	/** @type {Server}*/
	#server;
	/** @type {ServerResponse}*/
	#res;

	/**@param {string}cwd, @param {string}extensionPath */
	constructor(cwd, extensionPath, isLiveFresh = true) {
		super(cwd);
		this.extensionPath = join(extensionPath, "preview-server");
		isLiveFresh && loadRefresher();
		this.liveRefresher = new Map();
	}

	/** @param {number} port*/
	async startServer(port) {
		return new Promise((resolve, reject) => {
			// port = await getNextOpenPort(port);
			this.#server = createServer().listen(port, created.bind(null, port));
			this.#server.on("request", this.#onRequest);
			this.#server.once("error", () => reject("cannot start server at port " + port));
			this.#server.once("listening", () => resolve(port));
		});
	}

	/** @type {import("node:http").RequestListener} */
	#onRequest = (request, res) => {
		const [urlPath, searchParams] = request.url.split("?", 2);
		if (urlPath === "/ws") {
			this.#res = res;
			return connectClient(res);
		}

		request.method === "GET"
			? this.handleGetRequest(request, res, urlPath)
			: this.handleOtherReqest(request, res, urlPath);
	};

	closeServer() {
		this.#server.close();
	}

	/** @param {document} textDoc*/
	onTxtDocumentOpen(textDoc) {
		if (docLangId.has(textDoc.languageId)) this.liveRefresher.set(textDoc.fileName, new HtmlRefresher(textDoc));
		else if (textDoc.languageId === "css") this.liveRefresher.set(textDoc.fileName, new CssRefresher(textDoc));
	}

	/** @param {string} filePath */
	reloadOnSave = (filePath) => {
		if (!this.#res) return;
		filePath = filePath.replace(this.cwd, "");
		this.#res.write(`data:${filePath}\n\n`);
	};

	//for liverefresh
	/** @param {object} data*/
	setJsonRes(data) {
		this.#res.write(`data:${JSON.stringify(data)}\n\n`);
	}

	/** @param {object} change, @param {document} document*/
	updateElementAtPosition = (change, document) => {
		if (!this.liveRefresher) return console.error("live refresh not enabled");
		const htmlRefresher = this.liveRefresher.get(document.fileName);
		// if (!htmlRefresher) this.onTxtDocumentOpen(document);

		const updateData = htmlRefresher.getElemDataAtOffset(change);
		updateData && this.setJsonRes(updateData);
	};

	/** @param {change} change, @param {document} document*/
	updateRuleAtPosition = (change, document) => {
		if (!this.liveRefresher) return console.error("live refresh not enabled");
		const cssRefresher = this.liveRefresher.get(document.fileName);
		// if (!cssRefresher) this.onTxtDocumentOpen(document);

		const updateData = cssRefresher.getRuleDataAtOffset(change);
		if (updateData) {
			updateData.sheetUrl = this.getRelativePath(document.fileName);
			this.setJsonRes(updateData);
		}
	};

	/** @param {string} filePath*/
	getRelativePath(filePath) {
		return filePath.slice(this.cwd.length);
	}
}
