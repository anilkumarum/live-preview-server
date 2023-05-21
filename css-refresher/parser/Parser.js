import { RuleType } from "../utils/css-enums.js";
import { CssRule, Declaration } from "./cssRule.js";
import { CssUpdater } from "./cssUpdater.js";
import { Tokenizer } from "./Tokenizer.js";

export default class CssParser {
	/**@type {Declaration}*/
	#declaration;
	ruleStack = [];
	#tokenizer;
	#childIdx = { null: -1 };

	/**@param {CssUpdater} cssUpdater*/
	constructor(cssUpdater) {
		this.cssUpdater = cssUpdater;
		this.#tokenizer = new Tokenizer();
		this.#setListener();
	}

	/**@param {string} buffer, @param {number} [offset], @returns {boolean}*/
	parse(buffer, offset) {
		this.offset = offset;
		const isFinish = this.#tokenizer.consume(buffer, offset);
		return this.ruleStack.length === 0 || isFinish;
	}

	#getRuleIndex() {
		let parentRule = null;
		if (this.ruleStack.length !== 0) {
			const idx = this.ruleStack.at(-1).index;
			parentRule = this.ruleStack.at(-1).parentRule ? [...this.ruleStack.at(-1).parentRule, idx] : [idx];
		}
		const parentId = String(parentRule);
		this.#childIdx[parentId] ??= -1;
		const ruleIndex = ++this.#childIdx[parentId];
		return { ruleIndex, parentRule };
	}

	/**@param {string} selector, @param {number} start, @param {number} end*/
	#createStyleRule(selector, start, end, args) {
		const type = args[0] || RuleType.STYLE_RULE;
		const { ruleIndex, parentRule } = this.#getRuleIndex();
		const rule = new CssRule(type, selector.trimEnd(), start, end, ruleIndex, parentRule);
		this.cssUpdater.add(rule, this.offset > 0);
		this.ruleStack.push(rule);
	}

	/** @param {string} property, @param {number} start*/
	#addRuleProperty(property, start) {
		this.#declaration = new Declaration(property, start);
	}

	/** @param {string} value, @param {number} end*/
	#addDeclaration(value, _, end) {
		this.#declaration.value = value;
		this.#declaration.end = end;
		this.ruleStack.at(-1).declarations.push(this.#declaration);
		this.#declaration = null;
	}

	/** @param {number} end*/
	#closeRuleBlock(_, __, end) {
		this.ruleStack.at(-1).end = end + 1; //include }
		this.ruleStack.pop();
	}

	#setListener() {
		this.#tokenizer.on("openrule", this.#createStyleRule.bind(this));
		this.#tokenizer.on("addproperty", this.#addRuleProperty.bind(this));
		this.#tokenizer.on("declaration", this.#addDeclaration.bind(this));
		this.#tokenizer.on("closerule", this.#closeRuleBlock.bind(this));
	}
}
