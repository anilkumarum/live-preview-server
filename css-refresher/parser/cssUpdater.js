import CssParser from "./Parser.js";
import { RuleLinkList } from "./RuleLinkList.js";
import { CssRule, Declaration } from "./cssRule.js";

export const State = {
	InSelector: "InSelector",
	InDeclaration: "InDeclaration",
};

export class CssUpdater extends RuleLinkList {
	/**@type {CssParser} */
	#parser;
	/** @param {string} buffer*/
	constructor(buffer) {
		super();
		this.#parser = new CssParser(this);
		this.isParsedSuccess = this.#parser.parse(buffer);
	}

	reParseOnSave() {
		this.#parser.resetIdx();
		this.head = { _next: null };
		this.crtRule = this.head;
		this.#parser.parse(this.document.getText());
	}

	/**@param {{status:string,cssRule:CssRule}} crtRule, @param {{start:number,ruleTxt:string}}ruleData*/
	insertNewRule(crtRule, ruleData) {
		//TODO #childIdx willn't work if newrule isn't add at end
		this.crtRule = crtRule.cssRule;
		const parentRule =
			crtRule.status === "current" ? this.crtRule : this.findParentRule(crtRule.cssRule, ruleData.start);
		parentRule && this.parser.ruleStack.push(parentRule);
		this.parser.parse(ruleData.ruleTxt, ruleData.start);
		const offset = ruleData.ruleTxt.length;
		this.shiftLinks(crtRule.cssRule._next, offset);
		parentRule && RuleLinkList.shiftParent(crtRule.cssRule, ruleData.start, offset);
		return this.crtRule.declarations.length !== 0
			? {
					action: "insertRule",
					parentRule: this.crtRule.parentRule,
					index: this.crtRule.index,
					ruleTxt: getRuleTxt(this.crtRule),
			  }
			: null;
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

		const shift = text.length - rangeLength;
		this.shiftLinks(cssRule, shift, "current", 0, true);
		cssRule.parentRule && RuleLinkList.shiftParent(cssRule, rangeOffset, shift);
		return cssRule.selector;
	}

	/** @param {CssRule} cssRule, @param {import("../cssRefresher.js").change} change, @returns {object} */
	updateRuleDeclarations(cssRule, change) {
		const { rangeOffset, rangeLength, text } = change;
		const propIdx = RuleLinkList.getCrtDeclarationIndex(rangeOffset, cssRule);
		if (propIdx === -1) return;

		/**@type {Declaration} */
		const declaration = cssRule.declarations[propIdx];

		//TODO find property or value
		const status = "current";
		const prop = rangeOffset - declaration.start <= declaration.property.length ? "property" : "value";
		const position =
			prop === "property"
				? rangeOffset - declaration.start
				: rangeOffset - (declaration.start + declaration.property.length + 2); //get value word by regrex
		const oldTxt = declaration[prop];
		if (text) {
			declaration[prop] = declaration[prop].replaceAt(position, rangeLength, text.trim());
			const offset = text.length - rangeLength;
			declaration.end += text.length - rangeLength;
			this.shiftLinks(cssRule, text.length - rangeLength, status, propIdx + 1);
			cssRule.parentRule && RuleLinkList.shiftParent(cssRule, rangeOffset, offset);
		} else {
			declaration[prop] = declaration[prop].replaceAt(position, rangeLength);
			declaration.end -= rangeLength;
			declaration[prop] || cssRule.declarations.splice(propIdx, 1);
			this.shiftLinks(cssRule, rangeLength, status, propIdx + 1);
			cssRule.parentRule && RuleLinkList.shiftParent(cssRule, rangeOffset, -rangeLength);
		}
		//TODO valid declaration,test regrex string:string;
		return { prop, oldTxt, declaration: declaration };
	}

	/**@param {CssRule} crtRule, @param {{start:number,declarationTxt:string}}declarationData*/
	addNewDeclaration(crtRule, { start, declarationTxt }) {
		const [property, value] = declarationTxt.split(":");
		/**@type {CssRule} */
		const cssRule = crtRule;
		const declaration = new Declaration(property.trim(), start);
		declaration.end = start + declarationTxt.length;
		declaration.value = value.trimStart().replace(/;$/, "");

		const nxTDeclarationIdx = RuleLinkList.getNxtDeclarationIdxAfterOffset(cssRule.declarations, start);
		nxTDeclarationIdx === -1
			? cssRule.declarations.push(declaration)
			: cssRule.declarations.splice(nxTDeclarationIdx, 0, declaration);
		this.shiftLinks(cssRule, declarationTxt.length, "current", nxTDeclarationIdx);
		cssRule.parentRule && RuleLinkList.shiftParent(cssRule, start, declarationTxt.length);
		if (!declaration.value) return null;

		if (cssRule.declarations.length !== 1) {
			return {
				action: "addDeclaration",
				parentRule: cssRule.parentRule,
				index: cssRule.index,
				declaration,
			};
		}

		return {
			action: "insertRule",
			parentRule: this.crtRule.parentRule,
			index: this.crtRule.index,
			ruleTxt: getRuleTxt(cssRule),
		};
	}

	/**@param {number} start, @param {number} end, @returns {{parentRule:number[],index:number}[]}*/
	removeRuleInRange(start, end) {
		let { cssRule: crtRule } = this.walkForwardUntil(start);
		let rules = [];
		if (crtRule.start >= start && crtRule.end <= end) {
			rules.push({ parentRule: crtRule.parentRule, index: crtRule.index });
			crtRule._previous._next = crtRule._next;
		}
		if (!crtRule._next) {
			for (const rule of rules) this.parser.updateChildIdx(rule.parentRule);
			return rules.length > 0 ? rules : null;
		}

		while (crtRule._next.start <= end) {
			crtRule = crtRule._next;
			if (crtRule.start >= start && crtRule.end <= end) {
				rules.push({ parentRule: crtRule.parentRule, index: crtRule.index });
				crtRule._previous._next = crtRule._next;
			}
			if (!crtRule || !crtRule._next) break;
		}
		for (const rule of rules) this.parser.updateChildIdx(rule.parentRule);
		return rules.length > 0 ? rules : null;
	}

	/**@param {CssRule} crtRule, @param {import("../cssRefresher.js").change} change,*/
	removeRuleDeclaration(crtRule, change) {
		const start = change.rangeOffset,
			end = change.rangeOffset + change.rangeLength;
		const rmDeclarations = [];
		for (const declaration of crtRule.declarations) {
			if (declaration.start >= start && declaration.end <= end) rmDeclarations.push(declaration.property);
		}
		return rmDeclarations.length > 0 ? rmDeclarations : null;
	}
}

/**@param {CssRule} cssRule*/
function getRuleTxt(cssRule) {
	const ruleInfos = [];
	ruleInfos.push(cssRule.selector + " {");
	for (const declaration of cssRule.declarations) {
		ruleInfos.push(`${declaration.property}: ${declaration.value};`);
	}
	ruleInfos.push("}");
	return ruleInfos.join(" ");
}

// @ts-ignore
String.prototype.replaceAt = function (index, replaceLength = 0, text = "") {
	return this.substring(0, index) + text + this.substring(index + replaceLength);
};
