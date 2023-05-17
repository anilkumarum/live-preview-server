import { strictEqual } from "node:assert";
import { test, describe, it, before } from "node:test";
import { document } from "../data/css.js";
import { CssRefresher } from "../../cssRefresher.js";
import { insertNestedRule, insertRuleData } from "../data/snapshot.js";

const cssRefresher = new CssRefresher(document);

//test may fail due to \t
describe("insertRule", () => {
	/*     before(function() {
	    
	}) */

	it("insertNestedRule", () => {
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

	it("insertNewRule", () => {
		function insertRule(change) {
			const { rangeOffset, rangeLength, text } = change;
			const crtRule = cssRefresher.getRuleAtPosition(rangeOffset);
			const ruleData = { start: rangeOffset, ruleTxt: text, crtRule };
			const insertData = cssRefresher.insertNewRule(crtRule, ruleData);
			strictEqual(JSON.stringify(insertData), insertRuleData);
		}

		insertRule({
			rangeOffset: 108,
			rangeLength: 0,
			text: `span {
                overflow-wrap: break-word;
            }`,
		});
	});
});
