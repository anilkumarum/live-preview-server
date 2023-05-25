import HTMLParser from "./Parser.js";
import { Attribute, Element, Node, TxtNode } from "./node.js";
import { NodelinkList, State } from "./nodelinkList.js";

const attrRx = new RegExp(/([^=]+)="([^"]+)/);

export class HtmlUpdater extends NodelinkList {
	/**@type {HTMLParser} */
	#parser;
	/** @param {string} buffer*/
	constructor(buffer) {
		super();
		this.#parser = new HTMLParser(this);
		/**@type {boolean} */
		this.isParsedSuccess = this.#parser.parse(buffer);
	}

	reParseOnSave() {
		this.head = { _next: null };
		this.crtNode = this.head;
		Node.nodeCount = -1;
		this.#parser.parse(this.document.getText());
	}

	//parse elem str and insert node
	/**@protected @param {{text:string,start:number}} elemData, @param {Element|TxtNode} node*/
	insertNewElems(elemData, node) {
		this.crtNode = node;
		this.patchNodes.length = 0;
		this.#parser.parse(elemData.text, elemData.start);
		const offset = elemData.text.length;
		NodelinkList.shiftParent(node, elemData.start, elemData.text.length);
		if (this.crtNode._next) {
			this.crtNode._next.start += offset;
			this.shiftTree(this.crtNode._next, offset);
		}
		if (this.patchNodes.length === 0) return null;
		return this.patchNodes;
	}

	/**@protected @param {Element} node, @param {import("../htmlRefresher.js").change} change*/
	insertNewTxtNode(node, change, state) {
		this.crtNode = node;
		const end = change.text.length + change.rangeOffset;
		const newNode = new TxtNode(change.text, change.rangeOffset, end);
		this.add(newNode, false); //patch->false

		const offset = change.text.length - change.rangeLength;
		state === State.InElement && (node.end += offset);
		this.shiftTree(node._next, offset);
		NodelinkList.shiftParent(node, change.rangeOffset, offset);
	}

	//String.prototype.replaceAt
	/**@param {Element|TxtNode} curNode*/
	#updateProp(curNode, prop, { rangeOffset, rangeLength, text }) {
		const position = rangeOffset - curNode.start;
		curNode[prop] = curNode[prop].replaceAt(position, rangeLength, text);
		this.shiftTree(curNode, text.length - rangeLength);
	}

	/**@protected  @param {TxtNode} curNode, @param {import("../htmlRefresher.js").change} change, @returns {string}*/
	updateTxtNode(curNode, change) {
		this.#updateProp(curNode, "nodeValue", change);
		NodelinkList.shiftParent(curNode, change.rangeOffset, change.text.length - change.rangeLength);
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
		const attrIdx = NodelinkList.getCrtAttrIndex(rangeOffset, curElement);
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
			this.shiftTree(curElement, text.length - rangeLength, attrIdx + 1);
		} else {
			attribute[prop] = attribute[prop].replaceAt(position, rangeLength);
			attribute.end -= rangeLength;
			this.shiftTree(curElement, -rangeLength, attrIdx + 1);
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
