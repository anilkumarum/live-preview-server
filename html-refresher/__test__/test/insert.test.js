import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { document } from "../data/html.js";
import HtmlRefresher from "../../htmlRefresher.js";
import { insertedElem, insertedTxtNode } from "../data/snapshot.js";
import { NodelinkList } from "../../parser/nodelinkList.js";

const htmlRefresher = new HtmlRefresher(document);
const prettyRule = ({ _next, _previous, ...rule }) => JSON.stringify(rule);

describe("insertRule", () => {
	/*     before(function() {
	    
	}) */

	it("insertTxtNode", () => {
		function insertTxtNode(change) {
			const node = htmlRefresher.getNearestNodeAt(change.rangeOffset);
			htmlRefresher.insertNewTxtNode(node, change);
			const newNode = htmlRefresher.getNearestNodeAt(change.rangeOffset + 2);
			strictEqual(prettyRule(newNode), insertedTxtNode);
		}
		const change2 = { rangeOffset: 4, rangeLength: 0, text: "this" };
		insertTxtNode(change2);
	});

	it("insertNewElem", () => {
		function insertElem(change) {
			const node = htmlRefresher.getNearestNodeAt(change.rangeOffset);
			const state = NodelinkList.getStateInElemAt(change.rangeOffset, node);
			const elemData = { text: change.text, start: change.rangeOffset };
			htmlRefresher.insertNewElems(elemData, node, state);
			const newNode = htmlRefresher.getNearestNodeAt(change.rangeOffset + 2);
			strictEqual(prettyRule(newNode), insertedElem);
		}

		const change2 = { rangeOffset: 52, rangeLength: 0, text: "<var></var>" };
		insertElem(change2);
	});
});
