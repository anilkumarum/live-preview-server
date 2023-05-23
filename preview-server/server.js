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
function connectClient(res, logger) {
	logger.log("✅ 'Client connected'");
	logger.log("⌛ Waiting for file change...");
	res.writeHead(200, {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "GET,OPTIONS",
		"Access-Control-Allow-Private-Network": "true",
		"Access-Control-Allow-Headers": "Cache-Control",
		"Content-Type": "text/event-stream",
		"Cache-Control": "no-cache",
		Connection: "keep-alive",
	});
	res.write(`event:notice\ndata:lps hmr connected\n\n`);
}

const created = (logger, port) => logger.log(`🔴 Preview server running at ${port} port`);

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
	/** @type {number}*/
	port;
	isRunning = false;

	/**@param {string}cwd, @param {string}extensionPath, @param {object}userConfig, @param {object}userCustom */
	constructor(cwd, extensionPath, userConfig, logger, userCustom) {
		super(cwd);
		this.extensionPath = join(extensionPath, "preview-server");
		userConfig.liveRefresh && loadRefresher();
		this.liveRefresher = new Map();
		this.userCustom = userCustom;
		this.logger = logger;
		this.isLiveFresh = userConfig.liveRefresh;
	}

	/** @param {number} port*/
	async startServer(port) {
		return new Promise((resolve, reject) => {
			if (this.isRunning) return resolve(port);
			this.port = port;
			// port = await getNextOpenPort(port);
			this.#server = createServer().listen(port, created.bind(null, this.logger, port));
			this.#server.on("request", this.#onRequest);
			this.#server.once("error", () => reject("cannot start server at port " + port));
			this.#server.once("listening", () => {
				this.isRunning = true;
				resolve(port);
			});
			this.#server.once("close", () => {
				this.isRunning = false;
				this.logger.log("Live Server Stopped");
				this.logger.dispose();
			});
		});
	}

	/** @type {import("node:http").RequestListener} */
	#onRequest = (request, res) => {
		const [urlPath, searchParams] = request.url.split("?", 2);
		if (urlPath === "/ws") {
			this.#res = res;
			return connectClient(res, this.logger);
		}

		request.method === "GET"
			? this.handleGetRequest(request, res, urlPath)
			: this.handleOtherReqest(request, res, urlPath);
	};

	closeServer() {
		this.#server.close();
	}

	/** @param {document} textDoc*/
	onTxtDocumentActive(textDoc) {
		if (!docLangId.has(textDoc.languageId)) return;
		const pageUrl = this.#getRelativePath(textDoc.fileName);
		this.#res?.write(`event:pagenav\ndata:${pageUrl}\n\n`);
	}

	/** @param {string} filePath */
	reloadOnSave = (filePath) => {
		filePath = this.#getRelativePath(filePath);
		this.#res?.write(`data:${filePath}\n\n`);
	};

	//for liverefresh
	/** @param {object} data*/
	#setJsonRes(data) {
		this.#res?.write(`data:${JSON.stringify(data)}\n\n`);
	}

	/** @param {object} change, @param {document} document*/
	updateElementAtPosition = (change, document) => {
		if (!this.liveRefresher) return console.error("live refresh not enabled");
		const htmlRefresher = this.liveRefresher.get(document.fileName);
		// if (!htmlRefresher) this.onTxtDocumentOpen(document);
		const updateData = htmlRefresher.getElemDataAtOffset(change);
		// console.log(updateData);
		updateData && this.#setJsonRes(updateData);
	};

	/** @param {change} change, @param {document} document*/
	updateRuleAtPosition = (change, document) => {
		if (!this.liveRefresher) return console.error("live refresh not enabled");
		const cssRefresher = this.liveRefresher.get(document.fileName);
		// if (!cssRefresher) this.onTxtDocumentOpen(document);

		const updateData = cssRefresher.getRuleDataAtOffset(change);
		// console.log(updateData);
		if (updateData) {
			updateData.sheetUrl = this.#getRelativePath(document.fileName);
			this.#setJsonRes(updateData);
		}
	};

	/** @param {document} textDoc*/
	async parseLiveRefresher(textDoc) {
		if (!this.isLiveFresh) return;
		if (!HtmlRefresher) await new Promise((r) => setTimeout(r, 100));
		if (docLangId.has(textDoc.languageId)) this.liveRefresher.set(textDoc.fileName, new HtmlRefresher(textDoc));
		else if (textDoc.languageId === "css") this.liveRefresher.set(textDoc.fileName, new CssRefresher(textDoc));
	}

	/** @param {string} filePath*/
	#getRelativePath(filePath) {
		return filePath.slice(this.cwd.length);
	}
}