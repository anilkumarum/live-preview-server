import { HtmlUpdater } from "./parser/htmlUpdater.js";
import { Node, Element, TxtNode } from "./parser/node.js";
import { NodelinkList, State } from "./parser/nodelinkList.js";
import { CharCode } from "./utils/html-enums.js";

/**
 * @typedef change
 * @type {object}
 * @property {{start:object,with:Function}} range
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
 * @property {object}[relative]
 */

/**
 * @typedef document
 * @type {object}
 * @property {string} languageId
 * @property {string} fileName
 * @property {Function} getText
 * @property {Function} getWordRangeAtPosition
 * @property {Function} lineAt
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
		const node = this.getNearestNodeAt(rangeOffset);

		if (text.charCodeAt(0) === CharCode.LineBreak || text.charCodeAt(0) === CharCode.Tab) {
			this.shiftTree(node, text.length), NodelinkList.shiftParent(node, change.rangeOffset, text.length);
			return null;
		}
		//add new element
		if (text.endsWith(">")) return this.#formNewNodesData(change, node);

		const isElem = node.type === Node.ELEMENT;
		const state = isElem ? NodelinkList.getStateInElemAt(rangeOffset, node) : null;
		if (state === State.InStyle || state === State.InScript) {
			this.shiftTree(node, text.length - change.rangeLength);
			return null;
		}
		if (!text) return this.#removeNodeAndGetData(change, node, state, isElem);

		if (text.endsWith('""')) {
			const attrData = text !== '""' ? this.#getAttrTxt(change) : { start: change.rangeOffset, text };
			return this.addNewAttribute(attrData, node);
		}

		if (!state) return this.#formTxtNodeData(change, node);
		return this.#states[state]?.(change, node, state);
	}

	/**@param {change} change, @param {Element|TxtNode} node, @returns {refreshData}*/
	#formNewNodesData(change, node) {
		const { rangeOffset, rangeLength, text } = change;
		rangeLength === 0 || this.updateTxtNode(node, { text: "", rangeLength, rangeOffset });
		const elemData = text.startsWith("<") ? { text, start: rangeOffset } : this.#getFullElemTxt(change);

		const insertElemData = { action: "insertNewNodes", patchNodes: null };
		if (elemData.start > node.end) {
			insertElemData.relative = NodelinkList.findRelativeNode(node, elemData.start);
		}
		if (insertElemData.relative || node.type === Node.TEXT) {
			const isTxtEmpty = node.nodeValue === "";

			if (isTxtEmpty) {
				insertElemData.patchNodes = this.insertNewElems(elemData, node._previous);
				insertElemData.replaceTxtNodeId = node.id;
			} else return this.#formSiblingData(change, node);
		} else {
			//add nodes between text data
			insertElemData.patchNodes = this.insertNewElems(elemData, node);
			insertElemData.nodeId = node.id;
		}

		return insertElemData;
	}

	/**@param {change} change, @param {Element|TxtNode} node, @returns {refreshData}*/
	#formSiblingData(change, node) {
		//TODO add support for rangeLength >0
		const { rangeOffset, text } = change;
		const updateDataArr = { action: "replaceSiblings", nodeId: node.id, siblingDataArr: [] };
		//update left txt node value
		const endText = node.nodeValue.slice(rangeOffset - node.start);
		const change1 = { text: "", rangeLength: endText.length, rangeOffset };
		const leftTxtValue = this.updateTxtNode(node, change1);
		updateDataArr.siblingDataArr.push({
			action: "updateTxtNode",
			txtData: leftTxtValue,
		});
		//insert new elems
		const elemData = { text, start: rangeOffset };
		const patchNodes = this.insertNewElems(elemData, node);
		const insertElemData = { action: "insertNewNodes", patchNodes };
		updateDataArr.siblingDataArr.push(insertElemData);
		//insert txtnode with right side endText
		const txtNode = new TxtNode(endText, rangeOffset + text.length);
		//if isPatch is true-> replace this.patchNodes
		this.crtNode.id === patchNodes[0].id || (this.crtNode = this.findNodeById(patchNodes[0]));
		this.add(txtNode, false);
		updateDataArr.siblingDataArr.push({
			action: "addTxtNode",
			txtData: txtNode.nodeValue,
		});
		return updateDataArr;
	}

	/**@param {change} change, @param {Element|TxtNode} node, @returns {refreshData|null}*/
	#removeNodeAndGetData(change, node, state, isElem) {
		const nodeIds = this.removeElementsInRange(change.rangeOffset, change.rangeOffset + change.rangeLength);
		if (nodeIds)
			return {
				action: "removeNodes",
				nodeIds,
			};

		return isElem ? this.#states[state]?.(change, node, state) : this.#formTxtNodeData(change, node);
	}

	#states = {
		[State.InTagName]: this.#formElemTagData.bind(this),
		[State.InAttribute]: this.#formElemAttrData.bind(this),
		[State.AfterElemEnd]: this.#formDataForNewTxtNode.bind(this),
		[State.InElement]: this.#formDataForNewTxtNode.bind(this),
	};

	/**@param {change} change, @param {TxtNode} node, @returns {refreshData|null}*/
	#formTxtNodeData(change, node) {
		if (change.rangeOffset > node.end) {
			const relative = NodelinkList.findRelativeNode(node, change.rangeOffset);
			const txtNode = new TxtNode(change.text, change.rangeOffset, change.rangeOffset + change.text.length);
			this.crtNode = node;
			this.add(txtNode, false);
			return {
				action: "addTxtNode",
				relative,
				txtData: txtNode.nodeValue,
			};
		}
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
	#formDataForNewTxtNode(change, node) {
		this.insertNewTxtNode(node, change);
		return {
			action: "addTxtNode",
			nodeId: node.id,
			txtData: change.text,
		};
	}

	/**@param {change} change, @returns {{text:string,start:number}} */
	#getFullElemTxt(change) {
		const { lineSelTxt, lineStartPos } = this.#getLineSelTxt(change);

		let i = lineSelTxt.length;
		while (--i) {
			if (lineSelTxt.charCodeAt(i) === CharCode.Lt && lineSelTxt.charCodeAt(i + 1) !== CharCode.Slash) {
				const elemTxt = lineSelTxt.slice(i);
				return { text: elemTxt, start: this.document.offsetAt(lineStartPos) + i };
			}
		}
	}

	/**@param {change} change, @returns {{text:string,start:number}} */
	#getAttrTxt(change) {
		const { lineSelTxt, lineStartPos } = this.#getLineSelTxt(change);
		let i = lineSelTxt.length;
		while (--i) {
			if (lineSelTxt.charCodeAt(i) === CharCode.Space) {
				const elemTxt = lineSelTxt.slice(i + 1);
				return { text: elemTxt, start: this.document.offsetAt(lineStartPos) + i + 1 };
			}
		}
	}

	/**@param {change} change, @returns {{lineSelTxt:string,lineStartPos:object}} */
	#getLineSelTxt(change) {
		const { range, text } = change,
			lineNum = range.start.line,
			lineStartPos = range.start.with(lineNum, 0),
			charLength = range.start.character + text.length,
			insertedEditPos = range.start.with(lineNum, charLength),
			elemRange = range.with(lineStartPos, insertedEditPos),
			lineSelTxt = this.document.getText(elemRange);
		return { lineSelTxt, lineStartPos };
	}
}
