import { strictEqual } from "node:assert";
import { test, describe, it, before } from "node:test";
import { document } from "../data/html.js";
import HtmlRefresher from "../../htmlRefresher.js";
import { insertedElem, insertedTxtNode } from "../data/snapshot.js";

const htmlRefresher = new HtmlRefresher(document);
const prettyRule = ({ _next, _previous, ...rule }) => JSON.stringify(rule);

describe("insertRule", () => {
	/*     before(function() {
	    
	}) */

	it("insertTxtNode", () => {
		function insertTxtNode(change) {
			const node = htmlRefresher.getNodeAtPosition(change.rangeOffset);
			htmlRefresher.insertNewTxtNode(node, change);
			const newNode = htmlRefresher.getNodeAtPosition(change.rangeOffset + 2);
			strictEqual(prettyRule(newNode), insertedTxtNode);
		}
		const change2 = { rangeOffset: 52, rangeLength: 0, text: "this is porem text" };
		insertTxtNode(change2);
	});

	it("insertNewElem", () => {
		function insertElem(change) {
			const node = htmlRefresher.getNodeAtPosition(change.rangeOffset);
			const state = htmlRefresher.getStateInElemAt(change.rangeOffset, node);
			const elemData = { text: change.text, start: change.rangeOffset };
			const data = htmlRefresher.insertNewElems(elemData, node, state);
			const newNode = htmlRefresher.getNodeAtPosition(change.rangeOffset + 2);
			strictEqual(prettyRule(newNode), insertedElem);
		}

		const change2 = { rangeOffset: 43, rangeLength: 0, text: "<var></var>" };
		insertElem(change2);
	});
});
