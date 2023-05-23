import { CssRule, Declaration } from "./cssRule.js";

export class RuleLinkList {
	constructor() {}

	head = { _next: null };
	/**@type {CssRule}*/
	crtRule = this.head;
	/**@type {Array}*/
	patchRules = [];

	/**@param {CssRule} newRule, @param {boolean} [isPatch]*/
	add(newRule, isPatch) {
		if (this.crtRule._next) {
			newRule._next = this.crtRule._next;
			this.crtRule._next._previous = newRule;
		}
		this.crtRule._next = newRule;
		newRule._previous = this.crtRule;
		this.crtRule = newRule;
	}

	/** @param {number} position, @returns {{status:string,cssRule:CssRule}}*/
	walkForwardUntil(position) {
		let crtRule = this.head;

		while (crtRule._next.start <= position) {
			crtRule = crtRule._next;
			if (!crtRule || !crtRule._next) break;
		}
		const status = position <= crtRule.end ? "current" : "previous";
		return { status, cssRule: crtRule };
	}

	/** @param {CssRule} cssRule,@param {number} position, @returns {CssRule}*/
	walkBackwardUntil(cssRule, position) {
		let crtRule = cssRule;
		if (!crtRule._previous) return null;

		while (crtRule._previous.end >= position) {
			crtRule = crtRule._previous;
			if (!crtRule || !crtRule._previous) break;
		}
		return crtRule.end > position ? crtRule : null;
	}

	/**@param {CssRule} rule, @param {number} offset, @param {boolean} [isInSelector]*/
	shiftLinks(rule, offset, status, declIdx = 0, isInSelector) {
		if (status === "current") {
			rule.end += offset;
			isInSelector && (rule.selectorEnd += offset);
			RuleLinkList.shiftDeclarationForward(rule.declarations, offset, declIdx);
		}

		/**@type {CssRule}*/
		let nxtRule = rule._next;
		while (nxtRule) {
			nxtRule.start += offset;
			nxtRule.selectorEnd += offset;
			RuleLinkList.shiftDeclarationForward(nxtRule.declarations, offset);
			nxtRule.end += offset;
			nxtRule = nxtRule._next;
		}
	}

	/** @param {import("../parser/cssRule.js").Declaration[]} declarations, @param {number} offset*/
	static shiftDeclarationForward(declarations, offset, declIdx = 0) {
		if (declIdx === -1) return;
		for (let index = declIdx; index < declarations.length; index++) {
			const declaration = declarations[index];
			declaration.start += offset;
			declaration.end += offset;
		}
	}

	/**@protected @param {CssRule} crtRule, @param {number} rangeOffset, @param {number} shift*/
	static shiftParent(crtRule, rangeOffset, shift) {
		if (crtRule.end > rangeOffset) crtRule.end += shift;

		let prevRule = crtRule._previous;
		while (prevRule) {
			if (prevRule.end > rangeOffset) prevRule.end += shift;
			prevRule = prevRule._previous;
		}
	}

	/**@param {number} position, @returns {{status:string,cssRule:CssRule}}*/
	getRuleAtPosition(position) {
		//check need to go forward or backward
		const curRule = this.walkForwardUntil(position);
		return curRule;
	}

	/** @param {number} position, @param {CssRule} cssRule, @returns {number}*/
	static getCrtDeclarationIndex(position, cssRule) {
		for (let index = 0; index < cssRule.declarations.length; index++) {
			const declaration = cssRule.declarations[index];
			if (position >= declaration.start && position <= declaration.end) {
				return index;
			}
		}
		return -1;
	}

	/**@param {Declaration[]} declarations, @param {number} position, @returns {number}*/
	static getNxtDeclarationIdxAfterOffset(declarations, position) {
		return declarations.findIndex((declaration) => declaration.start > position);
	}

	/** @param {number} position, @param {CssRule} crtRule, @returns {CssRule}*/
	findParentRule(crtRule, position) {
		const cssRule = this.walkBackwardUntil(crtRule, position);
		return cssRule;
	}

	//DEBUG only
	/* 	prettyPrint(rootRule = this.head) {
		let crtRule = rootRule ?? this.head;
		crtRule._previous && delete crtRule._previous;

		while (crtRule._next) {
			crtRule = crtRule._next;
			if (!crtRule || !crtRule._previous) break;
			delete crtRule._previous;
		}
		console.log(JSON.stringify(rootRule._next));
	} */

	static prettyRule({ _next, _previous, ...rule }) {
		console.log(rule);
	}
}
