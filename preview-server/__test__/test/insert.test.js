import { strictEqual } from "node:assert";
import { describe, it, before } from "node:test";
import { PreviewServer } from "../../server.mjs";
import { appendTxtNodeInElem } from "../data/snapshot.js";
import { document } from "../data/html.js";

const previewServer = new PreviewServer(process.cwd(), process.cwd());
await new Promise((r) => setTimeout(r, 1000));

previewServer.onTxtDocumentOpen(document);

describe("appendTextNode", () => {
	/*     before(function() {
	    
	}) */

	it("appendTxtNode", () => {
		function updateElementAtPosition() {
			const htmlRefresher = previewServer.liveRefresher.get(document.fileName);
			const updateData = htmlRefresher.getElemDataAtOffset(change);
			strictEqual(JSON.stringify(updateData), appendTxtNodeInElem);
		}
		const change = { rangeOffset: 43, rangeLength: 0, text: "this is porem text" };
		updateElementAtPosition(change, document);
	});
});
