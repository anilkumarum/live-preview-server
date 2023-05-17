import { ServerResponse } from "node:http";
import { open, readFile } from "node:fs/promises";
import { pipeline } from "stream";
import { fileTypes } from "../utils/mime-type.js";
import { clientScript, nodeIdsScript } from "../scripts/node-id.js";
import { docExtension, extname } from "../utils/file-path.js";

const Doctype = new Uint8Array([
	60, 33, 68, 79, 67, 84, 89, 80, 69, 32, 104, 116, 109, 108, 62, 10, 60, 104, 116, 109, 108, 32, 108, 97, 110,
	103, 61, 34, 101, 110, 34, 62,
]);

/** @param {string} filePath, @param {ServerResponse} res */
export async function serveFile(filePath, res) {
	try {
		const fd = await open(filePath);
		if (fd) {
			const fileExt = extname(filePath);
			res.writeHead(200, { "Content-Type": fileTypes[fileExt] });
			const stream = fd.createReadStream();

			if (docExtension.has(fileExt)) {
				stream.push(Doctype);
				stream.push(clientScript);
				stream.push(nodeIdsScript);
			}
			pipeline(stream, res, (err) => err && console.log(err));
		}
	} catch (error) {
		res.writeHead(404);
		res.end("file not found");
	}
}
