import { strictEqual } from "node:assert";
import { test, describe, it, before } from "node:test";
import { document2 } from "../data/css.js";
import { CssRefresher } from "../../cssRefresher.js";
import { findNode } from "../data/snapshot.js";

const cssRefresher = new CssRefresher(document2);

describe("updateSelector", () => {
	/*     before(function() {
        
    }) */

	it("removeDeclaration", () => {
		function removeDeclaration(change) {
			const { cssRule } = cssRefresher.getRuleAtPosition(change.rangeOffset);
			const removeData = cssRefresher.updateRuleDeclarations(cssRule, change);
			const reqData = `{"prop":"property","oldTxt":"color","declaration":{"property":"","start":53,"value":"white","end":52}}`;
			strictEqual(JSON.stringify(removeData), reqData);
		}

		removeDeclaration({ rangeOffset: 53, rangeLength: 13, text: "" });
	});

	it("removeDeclaration", () => {});
});
