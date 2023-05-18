import { CssRule, Declaration } from "./parser/cssRule.js";
import { CssUpdater, State } from "./parser/cssUpdater.js";

/**
 * @typedef change
 * @type {object}
 * @property {{start:number}} range
 * @property {number} rangeOffset
 * @property {number} rangeLength
 * @property {string} text
 */

/**
 * @typedef refreshData
 * @type {object}
 * @property {string} action
 * @property {number[]} parentRule
 * @property {number} index
 * @property {string}[selector]
 * @property {Declaration[]|object}[declarations]
 */

/**
 * @typedef document
 * @type {object}
 * @property {string} languageId
 * @property {string} fileName
 * @property {Function} getText
 * @property {Function} getWordRangeAtPosition
 * @property {Function} offsetAt
 */

const declarationRx = new RegExp(/[^:]+:[^;]+;/),
	selectorRx = new RegExp(/[^{}]+{/),
	selectorTxtRx = new RegExp(/[^{}]+/);

export class CssRefresher extends CssUpdater {
	/**@param {document} document*/
	constructor(document) {
		super(document.getText());
		this.document = document;
		console.log("css parsed");
	}

	/**@param {change} change*/
	getRuleDataAtOffset(change) {
		const { rangeOffset, rangeLength, text } = change;
		if (text === "\n" || text === "\t") {
			const { cssRule } = this.getRuleAtPosition(rangeOffset);
			return cssRule && this.shiftForward(cssRule, 1);
		}

		const crtRule = this.getRuleAtPosition(rangeOffset);
		if (!text) return this.#removeRuleAndGetData(change, crtRule.cssRule);
		if (text.includes("{")) {
			const { text: selectorTxt, start } = this.#getTxtByRegInDoc(change, selectorTxtRx);
			const ruleTxt = selectorTxt + text.slice(text.indexOf("{"));
			const ruleData = { start, ruleTxt };
			return this.insertNewRule(crtRule, ruleData);
		}
		if (text.includes(";")) {
			const { text: declarationTxt, start } = this.#getTxtByRegInDoc(change, declarationRx);
			const declarationData = { start, declarationTxt };
			return this.addNewDeclaration(crtRule.cssRule, declarationData);
		}
		return crtRule.status === "current" && this.#formCrtRuleData(change, crtRule.cssRule);
	}

	/** @param {change} change, @param {CssRule} cssRule, @returns {refreshData} */
	#formCrtRuleData(change, cssRule) {
		cssRule ??= this.getRuleAtPosition(change.rangeOffset)["cssRule"];
		const state = this.getStateInRuleAt(change.rangeOffset, cssRule);
		if (state === State.InSelector) return this.#formRuleSelectorData(change, cssRule);
		if (state === State.InDeclaration) return this.#formRuleDeclarationsData(change, cssRule);
	}

	/** @param {CssRule} cssRule,@param {change} change, @returns {refreshData} */
	#formRuleSelectorData(change, cssRule) {
		const selector = this.updateRuleSelector(cssRule, change);
		if (!selector) return;
		return {
			action: "ruleSelector",
			parentRule: cssRule.parentRule,
			index: cssRule.index,
			selector,
		};
	}

	/** @param {CssRule} cssRule, @param {change} change, @returns {refreshData} */
	#formRuleDeclarationsData(change, cssRule) {
		const declarations = this.updateRuleDeclarations(cssRule, change);
		if (!declarations) return;
		return {
			action: "ruleDeclarations",
			parentRule: cssRule.parentRule,
			index: cssRule.index,
			declarations,
		};
	}

	/** @param {change} change, @param {CssRule} crtRule, @returns {object} */
	#removeRuleAndGetData(change, crtRule) {
		const { rangeOffset, rangeLength } = change;
		if (rangeLength > 5) {
			const rmRulesData = this.removeRuleInRange(rangeOffset, rangeOffset + rangeLength);
			if (rmRulesData) {
				return {
					action: "removeRules",
					rmRulesData,
				};
			}
		}

		return this.#formCrtRuleData(change, crtRule);
	}

	/** @param {change} change, @param {RegExp} regrex, @returns {{text:string,start:number}} */
	#getTxtByRegInDoc(change, regrex) {
		const range = this.document.getWordRangeAtPosition(change.range.start, regrex);
		return { text: this.document.getText(range), start: this.document.offsetAt(range.start) };
	}
}
