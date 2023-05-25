import { strictEqual } from "node:assert";
import { test, describe, it, before } from "node:test";
import { document } from "../data/css.js";
import { CssRefresher } from "../../cssRefresher.js";
import {
	addDeclarationData,
	insertNestedRule,
	insertNestedRuleParent,
	insertRuleData,
} from "../data/snapshot.js";

const cssRefresher = new CssRefresher(document);
const prettyRule = ({ _next, _previous, ...rule }) => JSON.stringify(rule);
const prettyRuleNoDec = ({ _next, _previous, declarations, ...rule }) => JSON.stringify(rule);

//test may fail due to \t
describe("insertRule", () => {
	/*     before(function() {
	    
	}) */
	/* 	it("addDeclaration", () => {
		function addDeclaration(change) {
			const { cssRule } = cssRefresher.getRuleAtPosition(change.rangeOffset);
			const declarationData = { start: change.rangeOffset, declarationTxt: change.text };
			cssRefresher.addNewDeclaration(cssRule, declarationData);
			strictEqual(JSON.stringify(cssRule.declarations), addDeclarationData);
		}

		addDeclaration({ rangeOffset: 42, rangeLength: 0, text: "text-transform: lowercase;" });
	}); */
	//compare output data after insert nested rule
	/* it("insertNestedRule", () => {
		function insertRule(change) {
			const { rangeOffset, rangeLength, text } = change;
			const crtRule = cssRefresher.getRuleAtPosition(rangeOffset);
			const ruleData = { start: rangeOffset, ruleTxt: text, crtRule };
			const insertData = cssRefresher.insertNewRule(crtRule, ruleData);
			strictEqual(JSON.stringify(insertData), insertNestedRule);
		}

		insertRule({
			rangeOffset: 105,
			rangeLength: 0,
			text: `&.popup {
            text-transform: lowercase;
            position: absolute;
            text-align: center;
        }`,
		});
	});

	it("RemoveRule", () => {
		function removeRule(change) {
			const updateData = cssRefresher.removeRuleInRange(
				change.rangeOffset,
				change.rangeOffset + change.rangeOffset
			);
			strictEqual(JSON.stringify(updateData), JSON.stringify([{ parentRule: [0], index: 1 }]));
		}
		removeRule({ rangeOffset: 105, rangeLength: 81, text: "" });
	});

	//compare parent rule  after insert nested rule
	it("insertNestedRuleParent", () => {
		function insertRule(change) {
			const { rangeOffset, rangeLength, text } = change;
			const crtRule = cssRefresher.getRuleAtPosition(rangeOffset);
			const ruleData = { start: rangeOffset, ruleTxt: text, crtRule };
			cssRefresher.insertNewRule(crtRule, ruleData);
			strictEqual(prettyRuleNoDec(crtRule.cssRule._previous), insertNestedRuleParent);
		}

		insertRule({
			rangeOffset: 105,
			rangeLength: 0,
			text: `&.popup {
            text-transform: lowercase;
            position: absolute;
            text-align: center;
        }`,
		});
	}); */

	it("insertRuleData", () => {
		function insertRule(change) {
			const { rangeOffset, rangeLength, text } = change;
			const crtRule = cssRefresher.getRuleAtPosition(rangeOffset);
			const ruleData = { start: rangeOffset, ruleTxt: text, crtRule };
			const insertData = cssRefresher.insertNewRule(crtRule, ruleData);
			strictEqual(JSON.stringify(insertData), insertRuleData);
		}

		insertRule({
			rangeOffset: 189,
			rangeLength: 0,
			text: `span {
                overflow-wrap: break-word;
            }`,
		});
	});
});
