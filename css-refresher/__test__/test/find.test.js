import { strictEqual } from "node:assert";
import { test, describe, it } from "node:test";
import { document } from "../data/css.js";
import { CssRefresher } from "../../cssRefresher.js";
import { findNode } from "../data/snapshot.js";
import { RuleLinkList } from "../../parser/RuleLinkList.js";

const cssRefresher = new CssRefresher(document);
const prettyRule = ({ _next, _previous, ...rule }) => JSON.stringify(rule);

test("findNode", (t) => {
	const { cssRule } = cssRefresher.getRuleAtPosition(65);
	strictEqual(prettyRule(cssRule), findNode);
});

describe("findState", () => {
	it("findState1", () => {
		const position = 65;
		const { cssRule } = cssRefresher.getRuleAtPosition(position);
		const state = cssRefresher.getStateInRuleAt(position, cssRule);
		strictEqual(state, "InSelector");
	});

	it("findState2", () => {
		const position = 75;
		const { cssRule } = cssRefresher.getRuleAtPosition(position);
		const state = cssRefresher.getStateInRuleAt(position, cssRule);
		strictEqual(state, "InDeclaration");
	});
});

test("findCrtDeclaration", (t) => {
	const position = 75;
	const { cssRule } = cssRefresher.getRuleAtPosition(position);
	const propIdx = RuleLinkList.getCrtDeclarationIndex(position, cssRule);
	strictEqual(propIdx, 0);
});
