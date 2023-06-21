import { createServer, Server, ServerResponse } from "node:http";
import RouteServer from "./services/route-server.js";
import { docLangId } from "./utils/file-path.js";
import { join } from "node:path";

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
let HtmlRefresher, CssRefresher;
async function loadRefresher() {
	HtmlRefresher = (await import("../html-refresher/index.js")).HtmlRefresher;
	CssRefresher = (await import("../css-refresher/index.js")).CssRefresher;
}

export class PreviewServer extends RouteServer {
	/** @type {Server}*/
	#server;
	/** @type {ServerResponse}*/
	#res;
	/** @type {number}*/
	port;
	isRunning = false;
	clientConnect;

	/**@param {string}cwd, @param {string}extensionPath, @param {object}userConfig, @param {object}userCustom */
	constructor(cwd, extensionPath, userConfig, logger, userCustom) {
		super(cwd);
		this.extensionPath = join(extensionPath, "preview-server");
		userConfig.liveRefresh && loadRefresher();
		this.liveRefresher = new Map();
		this.userCustom = userCustom;
		this.userConfig = userConfig;
		this.logger = logger;
		this.isLiveFresh = userConfig.liveRefresh;
	}

	/** @param {number} port*/
	async startServer(port) {
		return new Promise((resolve, reject) => {
			if (this.isRunning) return resolve(port);
			this.port = port;
			this.#server = createServer().listen(port, () => {
				this.logger.create("LPS server log");
				this.logger.log(`🔴 Preview server running at ${port} port`);
			});
			this.#server.on("request", this.#onRequest);
			this.#server.once("error", (err) => {
				this.#server.close();
				reject(err["code"]);
			});
			this.#server.once("listening", () => {
				this.isRunning = true;
				this.logger.log(`Local: http://localhost:${port}/paths`);
				resolve(port);
			});
			this.#server.once("close", () => {
				this.isRunning = false;
				this.#res?.end();
				this.logger.log("Live Server Stopped");
				this.logger.dispose();
			});
			process.once("exit", this.#server.close);
		});
	}

	/** @param {ServerResponse} res */
	#connectClient(res) {
		if (!this.clientConnect) {
			this.logger.log("✅ 'Client connected'");
			this.logger.log("⌛ Waiting for file change...");
			this.clientConnect = true;
		}
		res.writeHead(200, {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET,OPTIONS",
			"Access-Control-Allow-Private-Network": "true",
			"Access-Control-Allow-Headers": "Cache-Control",
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
		});
		res.write(`event:notice\ndata:LPS Hmr connected\n\n`);
	}

	/** @type {import("node:http").RequestListener} */
	#onRequest = (request, res) => {
		const [urlPath, searchParams] = request.url.split("?", 2);
		if (urlPath === "/lps-sse") {
			this.#res = res;
			return this.#connectClient(res);
		}

		request.method === "GET"
			? this.handleGetRequest(request, res, urlPath)
			: this.handleOtherReqest(request, res, urlPath);
	};

	closeServer() {
		this.logger.log("Live Server Stopping...");
		this.#server.close();
	}

	/** @param {document} textDoc*/
	changePageUrl(textDoc) {
		if (!docLangId.has(textDoc.languageId)) return;
		const pageUrl = this.#getRelativePath(textDoc.fileName);
		if (pageUrl === this.crtPageUrl) return;
		this.#res?.write(`event:pagenav\ndata:${pageUrl}\n\n`);
	}

	/** @param {document} textDoc*/
	reloadOnSave = (textDoc) => {
		const absolutePath = textDoc.fileName;
		if (!this.resourceFileMap.has(absolutePath)) return;

		if (this.liveRefresher && this.liveRefresher.has(absolutePath)) {
			this.liveRefresher.get(absolutePath).reParseOnSave();
		}
		const filePath = this.#getRelativePath(absolutePath);
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
		//console.log(updateData);
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
		if (!HtmlRefresher) await new Promise((r) => setTimeout(r, 100)); //temp
		if (this.liveRefresher.has(textDoc.fileName)) return;

		if (docLangId.has(textDoc.languageId)) this.liveRefresher.set(textDoc.fileName, new HtmlRefresher(textDoc));
		else if (textDoc.languageId === "css") this.liveRefresher.set(textDoc.fileName, new CssRefresher(textDoc));
	}

	/** @param {string} filePath*/
	#getRelativePath(filePath) {
		return filePath.slice(this.cwd.length);
	}
}
