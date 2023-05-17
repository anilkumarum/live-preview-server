import { strictEqual } from "node:assert";
import { test, describe, it } from "node:test";
import { document } from "../data/html.js";
import HtmlRefresher from "../../htmlRefresher.js";
import { findNode1, findNode2 } from "../data/snapshot.js";

const htmlRefresher = new HtmlRefresher(document);
const prettyRule = ({ _next, _previous, ...rule }) => JSON.stringify(rule);

describe("findNode", () => {
	test("findNode", (t) => {
		const node = htmlRefresher.getNodeAtPosition(31);
		strictEqual(prettyRule(node), findNode1);
	});

	test("findNode", (t) => {
		const node = htmlRefresher.getNodeAtPosition(41);
		strictEqual(prettyRule(node), findNode2);
	});
});

describe("findSate", () => {
	it("findSate18", () => {
		const position = 18;
		const node = htmlRefresher.getNodeAtPosition(position);
		const state = htmlRefresher.getStateInElemAt(position, node);
		strictEqual(state, "InAttribute");
	});

	it("findSate37", () => {
		const position = 37;
		const node = htmlRefresher.getNodeAtPosition(position);
		const state = htmlRefresher.getStateInElemAt(position, node);
		strictEqual(state, "InTagName");
	});

	it("findSate43", () => {
		const position = 43;
		const node = htmlRefresher.getNodeAtPosition(position);
		const state = htmlRefresher.getStateInElemAt(position, node);
		strictEqual(state, "InElement");
	});

	it("findSate52", () => {
		const position = 52;
		const node = htmlRefresher.getNodeAtPosition(position);
		const state = htmlRefresher.getStateInElemAt(position, node);
		strictEqual(state, "AfterElemEnd");
	});
});
