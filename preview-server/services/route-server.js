import { IncomingMessage, ServerResponse } from "node:http";
import { stat } from "node:fs/promises";
import { join } from "node:path";
import { createDirTree, getRedirectRoutes, updateRedirectRoute } from "../utils/dir-panel.js";
import { createFileExtMap, err404, hasExt, sendStyleSheets } from "../utils/file-path.js";
import { serveFile } from "./file-serve.js";
import { errorPage404 } from "../utils/404page.js";
import { transformTS } from "../utils/tsTranspile.js";
// import { highlightVsLine } from "../utils/highlight.cjs";

const liveScripts = new Set(["/client-hmr.js", "/live-refresh.js"]);
const panelPage = "/dir-panel/index.hbs";

export default class RouteServer {
	extensionPath;
	userCustom;
	userConfig;
	/** @type {Map<string,object>}*/
	liveRefresher;
	logger;
	crtPageUrl;
	resourceFileMap = new Map();
	/**@protected @param {string} cwd*/
	constructor(cwd) {
		this.cwd = cwd;
		this.docFileExtMap = new Map();
		createFileExtMap(cwd, this.docFileExtMap);
	}

	/**@protected @param {IncomingMessage}request,  @param {ServerResponse} res*/
	handleGetRequest(request, res, urlPath) {
		if (liveScripts.has(urlPath)) {
			const filepath = join(this.extensionPath, "scripts", urlPath);
			serveFile(filepath, res);
		}
		// else if (urlPath === "/get-adopted-style-sheets") sendStyleSheets().then((data) => res.end(data));
		else {
			const isNavigate = request.headers["sec-fetch-mode"] === "navigate";
			const isEmbedded = request.headers["sec-fetch-dest"] === "iframe";
			this.serveFileOnRoute(urlPath, isNavigate, isEmbedded, res);
		}
	}

	/**@protected @param {string} urlPath, @param {boolean} isNavigate, @param {boolean} isEmbedded, @param {ServerResponse} res*/
	async serveFileOnRoute(urlPath, isNavigate, isEmbedded, res) {
		let fileExt = "";

		if (isNavigate) {
			hasExt(urlPath) || (fileExt = this.docFileExtMap.get(urlPath) || "");
			if (urlPath === "/paths") return serveFile(join(this.extensionPath, panelPage), res);
			const fstat = await stat(join(this.cwd, urlPath + fileExt)).catch((err) => {
				errorPage404(urlPath, res);
				this.logger.log(`[${new Date().toLocaleTimeString()}] ${urlPath} 404 error`);
			});
			if (!fstat) return;
			this.resourceFileMap.clear();
			//TODO add support for index.html file
			res.setHeader("X-Powered-By", "Live Preview Server");
			if (fstat.isDirectory() || urlPath === "/paths") {
				const dirPanelPath = join(this.extensionPath, panelPage);
				return serveFile(dirPanelPath, res);
			}
			//inject user custom headers
			this.userCustom.httpHeaders && this.#addCustomHeaders(res);
			if (urlPath !== this.crtPageUrl) this.logger.log(`[${new Date().toLocaleTimeString()}] ${urlPath}`);
			this.crtPageUrl = urlPath;
		} else if (urlPath.startsWith("/dir-panel")) {
			const filePath = join(this.extensionPath, urlPath);
			return serveFile(filePath, res);
		} else if (urlPath.startsWith("/dir-data-request")) {
			return await this.#sendDirPanelData(urlPath, res);
		} else if (this.userConfig.compileTs && urlPath.endsWith(".ts")) {
			try {
				const compiledTs = await transformTS(this.cwd + urlPath);
				res.writeHead(200, { "Content-Type": "text/javascript" });
				return res.end(compiledTs);
			} catch (error) {
				return err404(urlPath, res);
			}
		}

		const filePath = join(this.cwd, urlPath + fileExt);
		serveFile(filePath, res, isEmbedded);
		this.resourceFileMap.set(filePath);
	}

	/**@param {ServerResponse} res*/
	#addCustomHeaders(res) {
		const headers = this.userCustom.httpHeaders;
		if (!headers) return;
		for (const key in headers) {
			headers[key] && res.setHeader(key, headers[key]);
		}
	}

	/**@param {string} urlPath, @param {ServerResponse} res*/
	async #sendDirPanelData(urlPath, res) {
		let dirData;
		switch (urlPath) {
			case "/dir-data-request/dirs-tree":
				dirData = await createDirTree(this.cwd);
				break;

			case "/dir-data-request/redirect-routes":
				dirData = await getRedirectRoutes(this.cwd, this.docFileExtMap, res);
				break;
		}

		res.writeHead(200, { "Content-Type": "json" });
		res.write(JSON.stringify(dirData));
		res.end();
	}

	/**@protected @param {IncomingMessage}request, @param {ServerResponse} res*/
	handleOtherReqest(request, res, urlPath) {
		let data = "";
		request.on("data", (chunk) => (data += chunk));
		request.on("end", async () => {
			if (urlPath === "/dir-data-request/add-redirect-route") {
				await updateRedirectRoute(this.cwd, data);
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end('{"status":"saved success"}');
			} else err404(urlPath, res);
		});
		//highlight node in vscode from browser
		if (request.method === "PATCH" && request.url.startsWith("/view/highlight-node-vscode")) {
			const params = new URLSearchParams(request.url);
			const nodeId = params.get("node");
			const htmlRefresher = this.liveRefresher.get(this.cwd + request.headers.referer);
			if (htmlRefresher) {
				const node = htmlRefresher.findNodeById(nodeId);
				// highlightVsLine(node.start,node.end);
			}
		}
	}
}
