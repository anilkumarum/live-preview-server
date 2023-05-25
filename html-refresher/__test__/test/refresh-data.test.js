import { strictEqual } from "node:assert";
import { test, describe, it } from "node:test";
import { document } from "../data/html.js";
import HtmlRefresher from "../../htmlRefresher.js";
import { refreshElemStart, refreshNewElem } from "../data/snapshot.js";

const htmlRefresher = new HtmlRefresher(document);
const prettyNode = ({ _next, _previous, ...rule }) => JSON.stringify(rule);

describe("findNode", () => {
	test("refreshElemStart", (t) => {
		const change2 = { rangeOffset: 117, rangeLength: 0, text: "l" };
		const data = htmlRefresher.getElemDataAtOffset(change2);
		strictEqual(JSON.stringify(data), refreshElemStart);
	});

	test("refreshNewElem", (t) => {
		const change3 = { rangeOffset: 117, rangeLength: 1, text: "<li>kokal</li>" };
		const data = htmlRefresher.getElemDataAtOffset(change3);
		strictEqual(JSON.stringify(data), refreshNewElem);
	});

	test("addnewElemBtwTxtNode", (t) => {
		const changepa = { rangeOffset: 71, rangeLength: 0, text: "<kbd> ctrl+j</kbd>" };
		const data = htmlRefresher.getElemDataAtOffset(changepa);
		strictEqual(JSON.stringify(data), addnewElemBtwTxtNode);
	});
});
