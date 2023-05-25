import { strictEqual } from "node:assert";
import { test, describe, it } from "node:test";
import { document } from "../data/html.js";
import HtmlRefresher from "../../htmlRefresher.js";
import { findNode1, findNode2, findNode3 } from "../data/snapshot.js";
import { NodelinkList } from "../../parser/nodelinkList.js";

const htmlRefresher = new HtmlRefresher(document);
const prettyRule = ({ _next, _previous, ...rule }) => JSON.stringify(rule);

describe("findNode", () => {
	test("findNode", (t) => {
		const node = htmlRefresher.getNearestNodeAt(6);
		strictEqual(prettyRule(node), findNode1);
	});

	test("findNode", (t) => {
		const node = htmlRefresher.getNearestNodeAt(16);
		strictEqual(prettyRule(node), findNode2);
	});

	test("findNode", (t) => {
		const node = htmlRefresher.getNearestNodeAt(24);
		strictEqual(prettyRule(node), findNode2);
	});
	test("findNode", (t) => {
		const node = htmlRefresher.getNearestNodeAt(89);
		strictEqual(prettyRule(node), findNode3);
	});

	test("findNode", (t) => {
		const node = htmlRefresher.getNearestNodeAt(89);
		strictEqual(prettyRule(node), findNode3);
	});
});

describe("findSate", () => {
	it("findSate2", () => {
		const position = 2;
		const node = htmlRefresher.getNearestNodeAt(position);
		const state = NodelinkList.getStateInElemAt(position, node);
		strictEqual(state, "InTagName");
	});

	it("findSate19", () => {
		const position = 19;
		const node = htmlRefresher.getNearestNodeAt(position);
		const state = NodelinkList.getStateInElemAt(position, node);
		strictEqual(state, "InAttribute");
	});

	it("findSate43", () => {
		const position = 43;
		const node = htmlRefresher.getNearestNodeAt(position);
		const state = NodelinkList.getStateInElemAt(position, node);
		strictEqual(state, "InTagName");
	});

	// 	it("findSate76", () => {//TODO tagEnd test
	// 	const position = 76;
	// 	const node = htmlRefresher.getNearestNodeAt(position);
	// 	const state = NodelinkList.getStateInElemAt(position, node);
	// 	strictEqual(state, "InAttribute");
	// });
});

describe("findRelative", () => {
	it("findSate84", () => {
		const position = 84;
		const node = htmlRefresher.getNearestNodeAt(position);
		const relative = NodelinkList.findRelativeNode(node, position);
		strictEqual(JSON.stringify(relative), JSON.stringify({ relation: "NextSibling", kinNodeId: 5 }));
	});

	it("findSate115", () => {
		const position = 115;
		const node = htmlRefresher.getNearestNodeAt(position);
		const relative = NodelinkList.findRelativeNode(node, position);
		strictEqual(JSON.stringify(relative), JSON.stringify({ relation: "Parent", kinNodeId: 2 }));
	});
});
