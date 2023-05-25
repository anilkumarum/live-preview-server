import { strictEqual } from "node:assert";
import { test, describe, it, before } from "node:test";
import { document } from "../data/html.js";
import HtmlRefresher from "../../htmlRefresher.js";

const htmlRefresher = new HtmlRefresher(document);

describe("updateSelector", () => {
	/*     before(function() {
        
    }) */

	it("removeNode", () => {
		function removeTxtNode(change) {
			const { rangeOffset, rangeLength } = change;
			const data = htmlRefresher.removeElementsInRange(rangeOffset, rangeOffset + rangeLength);
			strictEqual(String(data), "5,6");
		}

		const rmchange = { rangeOffset: 88, rangeLength: 27, text: "" };
		removeTxtNode(rmchange);
	});

	it("removeElem", () => {});
});
