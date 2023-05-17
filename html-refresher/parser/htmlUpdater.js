import HTMLParser from "./Parser.js";
import { Attribute, Element, TxtNode } from "./node.js";
import { NodelinkList } from "./nodelinkList.js";

const attrRx = new RegExp(/\s([^=]+)="([^"]+)/);

export class HtmlUpdater extends NodelinkList {
	/** @param {string} buffer*/
	constructor(buffer) {
		super();
		this.parser = new HTMLParser(this);
		this.isParsedSuccess = this.parser.parse(buffer);
	}

	//parse elem str and insert node
	/**@protected @param {{text:string,start:number}} elemData, @param {Element|TxtNode} node*/
	insertNewElems(elemData, node, state) {
		this.crtNode = node;
		this.parser.parse(elemData.text, elemData.start);
		if (this.crtNode._next) {
			this.crtNode._next.start += elemData.text.length;
			this.shiftForward(this.crtNode._next, elemData.text.length);
		}
		return this.patchNodes.length > 0
			? { action: "insertNewNodes", patchNodes: this.patchNodes, nodeId: node.id, state }
			: null;
	}

	/**@protected @param {Element} node, @param {import("../htmlRefresher.js").change} change*/
	insertNewTxtNode(node, change) {
		this.crtNode = node;
		const end = change.text.length + change.rangeOffset + 1;
		const newNode = new TxtNode(change.text, change.rangeOffset + 1, end);
		this.add(newNode, false); //patch->false
	}

	//String.prototype.replaceAt
	/**@param {Element|TxtNode} curNode*/
	#updateProp(curNode, prop, { rangeOffset, rangeLength, text }) {
		const position = rangeOffset - curNode.start;
		curNode[prop] = curNode[prop].replaceAt(position, rangeLength, text);
		this.shiftTree(rangeLength, text.length, curNode);
	}

	/**@protected  @param {TxtNode} curNode, @param {import("../htmlRefresher.js").change} change, @returns {string}*/
	updateTxtNode(curNode, change) {
		this.#updateProp(curNode, "nodeValue", change);
		return curNode.nodeValue;
	}

	/**@protected  @param {Element} curElement, @param {import("../htmlRefresher.js").change} change, @returns {string}*/
	updateElemTagName(curElement, change) {
		this.#updateProp(curElement, "tagName", change);
		return curElement.tagName;
	}

	/**@protected  @param {Element} curElement, @param {import("../htmlRefresher.js").change} change, @returns {object}*/
	updateElemAttribute(curElement, change) {
		const { rangeOffset, rangeLength, text } = change;
		curElement.attributes ??= [];
		const attrIdx = this.getCrtAttrIndex(rangeOffset, curElement);
		if (attrIdx === -1) return;

		const attribute = curElement.attributes[attrIdx];
		const prop = rangeOffset - attribute.start <= attribute.name.length ? "name" : "value";
		const oldTxt = attribute[prop];
		const position =
			prop === "name"
				? rangeOffset - attribute.start
				: rangeOffset - (attribute.start + attribute.name.length + 2);

		if (text) {
			attribute[prop] = attribute[prop].replaceAt(position, rangeLength, text);
			attribute.end += text.length - rangeLength;
			this.shiftForward(curElement, text.length - rangeLength, attrIdx + 1);
		} else {
			attribute[prop] = attribute[prop].replaceAt(position, rangeLength);
			attribute.end -= rangeLength;
			this.shiftBackward(curElement, rangeLength, attrIdx + 1);
		}
		return { oldTxt, prop, data: attribute };
	}

	/**@protected @param {{start:number,text:string}} attrData, @param {Element} node, @returns {object}*/
	addNewAttribute(attrData, node) {
		const [_, attrName, attrValue] = attrData.text.match(attrRx);
		const attribute = new Attribute(attrName, attrData.start);
		attribute.end = attrData.start + attrData.text.length;
		attribute.value = attrValue;
		return {
			action: "addNewAttr",
			nodeId: node.id,
			attribute: attribute,
		};
	}
}

// @ts-ignore
String.prototype.replaceAt = function (index, replaceLength = 0, text = "") {
	return this.substring(0, index) + text + this.substring(index + replaceLength);
};
