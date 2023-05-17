import { strictEqual } from "node:assert";
import { describe, it, before } from "node:test";
import { document } from "../data/html.js";
import HtmlRefresher from "../../htmlRefresher.js";

const htmlRefresher = new HtmlRefresher(document);

describe("updateSelector", () => {
	/*     before(function() {
	    
	}) */

	it("appendTxtNode", () => {
		function updateNode(change) {
			const node = htmlRefresher.getNodeAtPosition(change.rangeOffset);
			const updateData = htmlRefresher.updateTxtNode(node, change);
			strictEqual(updateData, "first update lorem ");
		}

		const change = { rangeOffset: 29, rangeLength: 0, text: "update " };
		updateNode(change);
	});

	it("removeTxtFromTxtNode", () => {
		function updateNode(change) {
			const node = htmlRefresher.getNodeAtPosition(change.rangeOffset);
			htmlRefresher.prettyNode(node);
			const newValue = htmlRefresher.updateTxtNode(node, change);
			strictEqual(newValue, "first lorem ");
			const node2 = htmlRefresher.getNodeAtPosition(change.rangeOffset);
			htmlRefresher.prettyNode(node2);
		}

		const change8 = { rangeOffset: 29, rangeLength: 7, text: "" };
		updateNode(change8);
	});

	it("changeTagName", () => {
		function updateElem(change) {
			const node = htmlRefresher.getNodeAtPosition(change.rangeOffset);
			htmlRefresher.prettyNode(node);
			const newTag = htmlRefresher.updateElemTagName(node, change);
			strictEqual(newTag, "div");
		}

		const change = { rangeOffset: 36, rangeLength: 6, text: "div" };
		updateElem(change);
	});

	it("changeAttrName", () => {
		function updatAttribute(change) {
			const node = htmlRefresher.getNodeAtPosition(change.rangeOffset);
			const attrData = htmlRefresher.updateElemAttribute(node, change);
			strictEqual(JSON.stringify(attrData), JSON.stringify({ oldTxt: "class", prop: "name", data: "id" }));
		}

		const change2 = { rangeOffset: 9, rangeLength: 5, text: "id" };
		updatAttribute(change2);
	});
});
