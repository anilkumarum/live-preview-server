import { ServerResponse } from "node:http";
import { stat } from "node:fs/promises";
import { createDirTree, getRedirectRoutes, updateRedirectRoute } from "../utils/dir-panel.js";
import { createFileExtMap, err404, hasExt } from "../utils/file-path.js";
import { serveFile } from "./file-serve.js";
import { errorPage404 } from "../utils/404page.js";
import { clr } from "../utils/color.js";
import path from "node:path";

const liveScripts = new Set(["/client-hmr.js", "/node-id.js", "/live-refresh.js"]);

export default class RouteServer {
	extensionPath;
	/**@param {string} cwd*/
	constructor(cwd) {
		this.cwd = cwd;
		this.docFileExtMap = new Map();
		createFileExtMap(cwd, this.docFileExtMap);
	}

	/**@protected @param {ServerResponse} res*/
	handleGetRequest(request, res, urlPath) {
		if (liveScripts.has(urlPath)) {
			const filepath = path.join(this.extensionPath, "scripts", urlPath);
			serveFile(filepath, res);
		} else {
			const isNavigate = request.headers["sec-fetch-mode"] === "navigate";
			this.serveFileOnRoute(urlPath, isNavigate, res);
		}
	}

	/**@protected @param {string} urlPath, @param {boolean} isNavigate, @param {ServerResponse} res*/
	async serveFileOnRoute(urlPath, isNavigate, res) {
		let fileExt = "";
		if (isNavigate) {
			const fstat = await stat(this.cwd + urlPath).catch((err) => errorPage404(urlPath, res));
			if (!fstat) return;
			if (fstat.isDirectory()) {
				const dirPanelPath = this.extensionPath + "/dir-panel/index.hbs";
				return serveFile(dirPanelPath, res);
			}
			hasExt(urlPath) || (fileExt = this.docFileExtMap.get(urlPath));
			console.log(new Date().toLocaleTimeString().slice(0, -3), urlPath);
		} else if (urlPath.startsWith("/dir-panel")) {
			const filePath = this.extensionPath + urlPath;
			return serveFile(filePath, res);
		} else if (urlPath.startsWith("/dir-data-request")) {
			return await this.sendDirPanelData(urlPath, res);
		}
		const filePath = this.cwd + urlPath + fileExt;
		serveFile(filePath, res);
	}

	/**@param {string} urlPath, @param {ServerResponse} res*/
	async sendDirPanelData(urlPath, res) {
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

	/**@protected @param {ServerResponse} res*/
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
	}
}
