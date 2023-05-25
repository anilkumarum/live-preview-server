import { strictEqual } from "node:assert";
import { describe, it, before } from "node:test";
import { document } from "../data/html.js";
import HtmlRefresher from "../../htmlRefresher.js";
import { updateTxtNode, updateTxtNode2 } from "../data/snapshot.js";

const htmlRefresher = new HtmlRefresher(document);
const prettyNode = ({ _next, _previous, ...rule }) => JSON.stringify(rule);

describe("updateSelector", () => {
	/*     before(function() {
	    
	}) */

	it("appendTxtNode", () => {
		function updateNode(change) {
			const node = htmlRefresher.getNearestNodeAt(change.rangeOffset);
			htmlRefresher.updateTxtNode(node, change);
			const newNode = htmlRefresher.getNearestNodeAt(change.rangeOffset + 2);
			strictEqual(prettyNode(newNode), updateTxtNode);
		}

		const change2 = { rangeOffset: 4, rangeLength: 0, text: "this " };
		updateNode(change2);
	});

	it("removeTxtFromTxtNode", () => {
		function updateNode(change) {
			const node = htmlRefresher.getNearestNodeAt(change.rangeOffset);
			htmlRefresher.updateTxtNode(node, change);
			const newNode = htmlRefresher.getNearestNodeAt(change.rangeOffset);
			strictEqual(prettyNode(newNode), updateTxtNode2);
		}

		const changet2 = { rangeOffset: 4, rangeLength: 5, text: "" };
		updateNode(changet2);
	});

	it("changeTagName", () => {
		function updateElem(change) {
			const node = htmlRefresher.getNearestNodeAt(change.rangeOffset);
			htmlRefresher.updateElemTagName(node, change);
			const newNode = htmlRefresher.getNearestNodeAt(change.rangeOffset + 1);
			strictEqual(prettyNode(newNode), updateTagName);
		}

		const change = { rangeOffset: 41, rangeLength: 2, text: "list" };
		updateElem(change);
	});

	it("changeAttrName", () => {
		function updatAttribute(change) {
			const node = htmlRefresher.getNearestNodeAt(change.rangeOffset);
			const attrData = htmlRefresher.updateElemAttribute(node, change);
			strictEqual(JSON.stringify(attrData), JSON.stringify({ oldTxt: "id", prop: "name", data: "data-id" }));
		}

		const change4 = { rangeOffset: 46, rangeLength: 0, text: "data-" };
		updatAttribute(change4);
	});
});
