import { strictEqual } from "node:assert";
import { test, describe, it, before } from "node:test";
import { document } from "../data/css.js";
import { CssRefresher } from "../../cssRefresher.js";
import { findNode } from "../data/snapshot.js";

const cssRefresher = new CssRefresher(document);

describe("updateSelector", () => {
	/*     before(function() {
        
    }) */

	it("updateSelector1", () => {
		function updateRuleSelector(change) {
			const { cssRule } = cssRefresher.getRuleAtPosition(change.rangeOffset);
			const updateData = cssRefresher.updateRuleSelector(cssRule, change);
			strictEqual(updateData, "&.sus");
		}
		updateRuleSelector({ rangeOffset: 64, rangeLength: 4, text: "" });
	});

	it("updateSelector2", () => {
		function updateRuleSelector(change) {
			const { cssRule } = cssRefresher.getRuleAtPosition(change.rangeOffset);
			const updateData = cssRefresher.updateRuleSelector(cssRule, change);
			strictEqual(updateData, "&.sus2yo");
		}
		updateRuleSelector({ rangeOffset: 68, rangeLength: 0, text: "2yo" });
	});
});
