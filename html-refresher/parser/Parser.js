import { Tokenizer } from "./Tokenizer.js";
import { Attribute, Element, Node, TxtNode } from "./node.js";
import { HtmlUpdater } from "./htmlUpdater.js";
import { voidElements } from "../utils/html-enums.js";

export default class HTMLParser {
	/**@type {Element[]} */
	#elemStack = [];

	/**@param {HtmlUpdater} htmlUpdater*/
	constructor(htmlUpdater) {
		this.htmlUpdater = htmlUpdater;
		this.tokenizer = new Tokenizer();
		this.#setListener();
	}

	/**@param {string} buffer, @param {number} [offset], @returns {boolean}*/
	parse(buffer, offset) {
		this.offset = offset;
		const isSuccess = this.tokenizer.consume(buffer, offset);
		return this.#elemStack.length !== 0 || isSuccess;
	}

	/** @param {string} tagName, @param {number} start */
	#openNewElement(tagName, start) {
		const element = new Element(tagName, start);
		this.htmlUpdater.add(element, this.offset > 0);
		this.#elemStack.push(element);
	}

	/** @param {string} attrName, @param {number} start*/
	#setAttrName(attrName, start) {
		this.attribute = new Attribute(attrName, start);
	}

	/** @param {string} attrVal, @param {number} end*/
	#setAttrValue(attrVal, _, end) {
		this.#elemStack.at(-1).attributes ??= [];
		this.attribute.end = end;
		this.attribute.value = attrVal;
		this.#elemStack.at(-1).attributes.push(this.attribute);
		this.attribute = null;
	}

	/** @param {string} content, @param {number} start, @param {number} end */
	#addTextNode(content, start, end) {
		if (content.length === 0) return;
		const textNode = new TxtNode(content, start, end);
		this.htmlUpdater.add(textNode);
	}

	/** @param {string} data, @param {number} start, @param {number} end */
	#setStyleTag(data, start, end) {
		const rules = data.slice(0, -7);
		// this.#elemStack.at(-1).cssRules = rules;
		this.#closeCrtElement(start);
	}

	/** @param {number} end*/
	#setSelfCloseElem(end) {
		this.#closeCrtElement(end);
	}

	/** @param {number} position*/
	#closeCrtElement(position) {
		this.#elemStack.at(-1).end = position + 1; //include >
		this.#elemStack.pop();
	}

	#setListener() {
		this.tokenizer.on("openelem", this.#openNewElement.bind(this));
		this.tokenizer.on("attrname", this.#setAttrName.bind(this));
		this.tokenizer.on("attrvalue", this.#setAttrValue.bind(this));
		this.tokenizer.on("text", this.#addTextNode.bind(this));
		this.tokenizer.on("styleelem", this.#setStyleTag.bind(this));
		this.tokenizer.on("selfcloseelem", this.#setSelfCloseElem.bind(this));
		this.tokenizer.on("closeelem", this.#closeCrtElement.bind(this));
		this.tokenizer.on("error", (err) => console.error(err));
	}
}
