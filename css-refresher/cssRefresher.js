import { RuleLinkList } from "./parser/RuleLinkList.js";
import { CssRule, Declaration } from "./parser/cssRule.js";
import { CssUpdater, State } from "./parser/cssUpdater.js";
import { CharCode, Selector } from "./utils/css-enums.js";

/**
 * @typedef change
 * @type {object}
 * @property {{start:object}} range
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
 * @property {string}[selectorType]
 * @property {Declaration[]|object}[declaration]
 */

/**
 * @typedef document
 * @type {object}
 * @property {string} languageId
 * @property {string} fileName
 * @property {Function} getText
 * @property {Function} getWordRangeAtPosition
 * @property {Function} offsetAt
 * @property {Function} lineAt
 */

const declarationRx = new RegExp(/[a-z-]+:[^;]+;/);

export class CssRefresher extends CssUpdater {
	/**@param {document} document*/
	constructor(document) {
		super(document.getText());
		/**@type {document}*/
		this.document = document;
	}

	/**@param {change} change*/
	getRuleDataAtOffset(change) {
		const { rangeOffset, text } = change;
		const { status, cssRule } = this.getRuleAtPosition(rangeOffset);

		if (text.charCodeAt(0) === CharCode.LineBreak || text.charCodeAt(0) === CharCode.Tab) {
			const nxTDeclarationIdx = RuleLinkList.getNxtDeclarationIdxAfterOffset(cssRule.declarations, rangeOffset);
			this.shiftLinks(cssRule, text.length, status, nxTDeclarationIdx);
			cssRule.parentRule && RuleLinkList.shiftParent(cssRule, rangeOffset, text.length);
			return null;
		}

		if (!text) return this.#removeRuleAndGetData(change, cssRule);
		if (text.includes("{")) {
			const inputInfo = this.#getSelectorTxtInDoc(change);
			if (!inputInfo) return null;
			const ruleData = { start: inputInfo.start, ruleTxt: inputInfo.ruleTxt };
			return this.insertNewRule({ status, cssRule }, ruleData);
		}
		if (status === "previous") return this.shiftLinks(cssRule, text.length, status);

		if (text.endsWith(";")) {
			const inputInfo = this.#getDecTxtByRegInDoc(change, declarationRx);
			if (!inputInfo) return null;
			const declarationData = { start: inputInfo.start, declarationTxt: inputInfo.text };
			return this.addNewDeclaration(cssRule, declarationData);
		}

		if (status === "current") return this.#formCrtRuleData(change, cssRule);
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
			selectorType: Selector[cssRule.type],
		};
	}

	/** @param {CssRule} cssRule, @param {change} change, @returns {refreshData} */
	#formRuleDeclarationsData(change, cssRule) {
		const declaration = this.updateRuleDeclarations(cssRule, change);
		if (!declaration) return;
		return {
			action: "ruleDeclarations",
			parentRule: cssRule.parentRule,
			index: cssRule.index,
			declaration,
		};
	}

	/** @param {change} change, @param {CssRule} crtRule, @returns {object} */
	#removeRuleAndGetData(change, crtRule) {
		const { rangeOffset, rangeLength } = change;
		if (rangeLength > 5) {
			//remove rule
			if (crtRule.start >= rangeOffset && crtRule.end <= rangeOffset + rangeLength) {
				const rmRulesData = this.removeRuleInRange(rangeOffset, rangeOffset + rangeLength);
				if (rmRulesData) {
					return {
						action: "removeRules",
						rmRulesData,
					};
				}
			}

			//remove declaration
			const rmDeclarations = this.removeRuleDeclaration(crtRule, change);
			if (rmDeclarations) {
				return {
					action: "removeDeclarations",
					parentRule: crtRule.parentRule,
					index: crtRule.index,
					rmDeclarations,
				};
			}
		}

		return this.#formCrtRuleData(change, crtRule);
	}

	/** @param {change} change, @returns {{ruleTxt:string,start:number}} */
	#getSelectorTxtInDoc(change) {
		const lineNum = change.range.start.line,
			lineStartPos = change.range.start.with(lineNum, 0);

		const lineTxt = this.document.lineAt(lineNum).text;
		let i = lineTxt.length;
		while (lineTxt.charCodeAt(--i) !== CharCode.openingCurly);
		let selectorEnd = i;
		while (--i) {
			const code = lineTxt.charCodeAt(i);
			if (code === CharCode.LineBreak || code === CharCode.Tab || code === CharCode.Amp) break;
		}
		if (lineTxt.charCodeAt(i) === CharCode.LineBreak || lineTxt.charCodeAt(i) === CharCode.Tab) ++i;
		const ruleTxt = lineTxt.slice(i, selectorEnd) + change.text.slice(change.text.indexOf("{"));
		return ruleTxt ? { ruleTxt, start: this.document.offsetAt(lineStartPos) + i } : null;
	}

	/** @param {change} change, @param {RegExp} regrex, @returns {{text:string,start:number}} */
	#getDecTxtByRegInDoc(change, regrex) {
		const range = this.document.getWordRangeAtPosition(change.range.start, regrex);
		return range ? { text: this.document.getText(range), start: this.document.offsetAt(range.start) } : null;
	}
}
