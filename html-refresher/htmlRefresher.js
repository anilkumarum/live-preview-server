import { HtmlUpdater } from "./parser/htmlUpdater.js";
import { Node, Element, TxtNode, Attribute } from "./parser/node.js";
import { State } from "./parser/nodelinkList.js";

const openTagRx = new RegExp(/<[a_z]>/);
const attrTxtRx = new RegExp(/\s[^=]+=/);

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
 * @property {number} [nodeId]
 * @property {number[]} [nodeIds]
 * @property {string}[txtData]
 * @property {string}[tagName]
 * @property {object}[attribute]
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

export default class HtmlRefresher extends HtmlUpdater {
	/**@param {document} document*/
	constructor(document) {
		super(document.getText());
		this.document = document;
	}

	/**@param {change} change, @returns {refreshData|null}*/
	getElemDataAtOffset(change) {
		const { rangeOffset, text } = change;

		if (text === "\n" || text === "\t") {
			const node = this.getNodeAtPosition(rangeOffset);
			node && this.shiftForward(node, text.length);
			return null;
		}
		const node = this.getNodeAtPosition(rangeOffset);
		if (!node) {
			console.error("node not found at");
			return null;
		}
		const isElem = node.type === Node.ELEMENT;
		const state = isElem ? this.getStateInElemAt(rangeOffset, node) : null;
		if (state === State.InStyle || state === State.InScript) {
			this.shiftTree(change.rangeLength, text.length, node);
			return null;
		}
		if (!text) return this.#removeNodeAndGetData(change, node, state, isElem);

		if (text.includes(">")) {
			//create element
			const elemData = this.#getTxtByRegInDoc(change, openTagRx);
			elemData.text = elemData.text + text.slice(text.indexOf(">"));
			return this.insertNewElems(elemData, node, state);
		}
		if (text.includes("=")) {
			//create attribute
			const attrTxt = this.#getTxtByRegInDoc(change, attrTxtRx);
			const attrData = attrTxt + text.slice(text.indexOf("="));
			return this.addNewAttribute(attrData, node);
		}

		if (!state) return this.#formTxtNodeData(change, node);
		return this.states[state]?.(change, node, state);
	}

	/**@param {change} change, @param {Element|TxtNode} node, @returns {refreshData|null}*/
	#removeNodeAndGetData(change, node, state, isElem) {
		const nodeIds = this.removeElementsInRange(change.rangeOffset, change.rangeOffset + change.rangeLength);
		if (nodeIds)
			return {
				action: "removeNodes",
				nodeIds,
			};

		return isElem ? this.states[state]?.(change, node, state) : this.#formTxtNodeData(change, node);
	}

	states = {
		[State.InTagName]: this.#formElemTagData.bind(this),
		[State.InAttribute]: this.#formElemAttrData.bind(this),
		[State.AfterElemEnd]: this.#formDataForNewTxtNode.bind(this),
		[State.InElement]: this.#formDataForNewTxtNode.bind(this),
	};

	/**@param {change} change, @param {TxtNode} node, @returns {refreshData|null}*/
	#formTxtNodeData(change, node, state) {
		const nodeValue = this.updateTxtNode(node, change);
		return {
			action: "updateTxtNode",
			nodeId: node.id,
			txtData: nodeValue,
		};
	}

	/**@param {change} change, @param {Element} node, @returns {refreshData|null}*/
	#formElemTagData(change, node) {
		const tagName = this.updateElemTagName(node, change);
		return {
			action: "updateTagName",
			nodeId: node.id,
			tagName: tagName,
		};
	}

	/**@param {change} change, @param {Element} node, @returns {refreshData|null}*/
	#formElemAttrData(change, node) {
		const attribute = this.updateElemAttribute(node, change);
		return {
			action: attribute.prop === "name" ? "updateAttrName" : "updateAttrValue",
			nodeId: node.id,
			attribute: attribute,
		};
	}

	/**@param {change} change, @param {Element} node, @returns {refreshData|null}*/
	#formDataForNewTxtNode(change, node, state) {
		this.insertNewTxtNode(node, change);
		return {
			action: state === State.InElement ? "appendTxtNode" : "addTxtNode",
			nodeId: node.id,
			txtData: change.text,
		};
	}

	/**@param {change} change, @param {RegExp} regrex, @returns {{text:string,start:number}} */
	#getTxtByRegInDoc(change, regrex) {
		const range = this.document.getWordRangeAtPosition(change.range.start, regrex);
		return { text: this.document.getText(range), start: this.document.offsetAt(range.start) };
	}
}
