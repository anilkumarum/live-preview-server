import CssParser from "./Parser.js";
import { RuleLinkList } from "./RuleLinkList.js";
import { CssRule, Declaration } from "./cssRule.js";

export const State = {
	InSelector: "InSelector",
	InDeclaration: "InDeclaration",
};

const isFirefox = false;

export class CssUpdater extends RuleLinkList {
	/** @param {string} buffer*/
	constructor(buffer) {
		super();
		this.parser = new CssParser(this);
		this.isParsedSuccess = this.parser.parse(buffer);
	}

	/**@param {{status:string,cssRule:CssRule}} crtRule, @param {{start:number,ruleTxt:string}}ruleData*/
	insertNewRule(crtRule, ruleData) {
		//TODO #childIdx willn't work if newrule isn't add at end
		this.crtRule = crtRule.cssRule;
		const parentRule =
			crtRule.status === "current" ? this.crtRule : this.findParentRule(crtRule.cssRule, ruleData.start);
		parentRule && this.parser.ruleStack.push(parentRule);
		this.parser.parse(ruleData.ruleTxt, ruleData.start);
		this.shiftForward(crtRule.cssRule._next, ruleData.ruleTxt.length);
		//this.prettyPrint();
		return {
			action: "insertRule",
			parentRule: crtRule.cssRule.parentRule,
			index: this.crtRule.index,
			ruleTxt: ruleData.ruleTxt.replaceAll(/\t/g, ""),
		};
	}

	/** @param {number} position, @param {CssRule} cssRule*/
	getStateInRuleAt(position, cssRule) {
		if (position <= cssRule.selectorEnd) return State.InSelector;
		return position < cssRule.end ? State.InDeclaration : null;
	}

	/** @param {CssRule} cssRule, @param {import("../cssRefresher.js").change} change, @returns {string} */
	updateRuleSelector(cssRule, change) {
		const { rangeOffset, rangeLength, text } = change;
		const offset = rangeOffset - cssRule.start;
		cssRule.selector = cssRule.selector.replaceAt(offset, rangeLength, text);
		if (text) this.shiftForward(cssRule, text.length - rangeLength, 0, true);
		else this.shiftBackward(cssRule, text.length - rangeLength, 0, true);
		return cssRule.selector;
	}

	/** @param {CssRule} cssRule, @param {import("../cssRefresher.js").change} change, @returns {object} */
	updateRuleDeclarations(cssRule, change) {
		const { rangeOffset, rangeLength, text } = change;
		const propIdx = this.getCrtDeclarationIndex(rangeOffset, cssRule);
		if (propIdx === -1) return;

		/**@type {Declaration} */
		const declaration = cssRule.declarations[propIdx];

		//TODO find property or value
		const prop = rangeOffset - declaration.start <= declaration.property.length ? "property" : "value";
		const position =
			prop === "property"
				? rangeOffset - declaration.start
				: rangeOffset - (declaration.start + declaration.property.length + 2); //get value word by regrex
		const oldTxt = declaration[prop];
		if (text) {
			declaration[prop] = declaration[prop].replaceAt(position, rangeLength, text.trim());
			declaration.end += text.length - rangeLength;
			this.shiftForward(cssRule, text.length - rangeLength, propIdx + 1);
		} else {
			declaration[prop] = declaration[prop].replaceAt(position, rangeLength);
			declaration.end -= rangeLength;
			declaration[prop] || cssRule.declarations.splice(propIdx, 1);
			this.shiftBackward(cssRule, rangeLength, propIdx + 1);
		}
		//TODO valid declaration,test regrex string:string;
		return !isFirefox ? { prop, oldTxt, declaration: declaration } : cssRule.declarations;
	}

	/**@param {CssRule} crtRule, @param {{start:number,declarationTxt:string}}declarationData*/
	addNewDeclaration(crtRule, { start, declarationTxt }) {
		const [property, value] = declarationTxt.split(":");
		/**@type {CssRule} */
		const cssRule = crtRule;
		const declaration = new Declaration(property.trim(), start);
		declaration.end = start + declarationTxt.length;
		declaration.value = value.trimStart().replace(/;$/, "");

		const nxTDeclarationIdx = this.getNxtDeclarationIdxAfterOffset(cssRule.declarations, start);
		cssRule.declarations.splice(nxTDeclarationIdx, 0, declaration);
		this.shiftForward(cssRule, declarationTxt.length, nxTDeclarationIdx);

		return {
			action: "addDeclaration",
			parentRule: cssRule.parentRule,
			index: cssRule.index,
			declaration,
		};
	}

	/**@param {number} start, @param {number} end, @returns {{parentRule:number[],index:number}[]}*/
	removeRuleInRange(start, end) {
		let { cssRule: crtRule } = this.walkForwardUntil(start);
		let rules = [];
		while (crtRule._next.start <= end) {
			crtRule = crtRule._next;
			if (crtRule.start >= start && crtRule.end <= end) {
				rules.push({ parentRule: crtRule.parentRule, index: crtRule.index });
				crtRule._previous._next = crtRule._next;
			}
			if (!crtRule || !crtRule._next) break;
		}

		return rules.length > 0 ? rules : null;
	}
}

// @ts-ignore
String.prototype.replaceAt = function (index, replaceLength = 0, text = "") {
	return this.substring(0, index) + text + this.substring(index + replaceLength);
};
