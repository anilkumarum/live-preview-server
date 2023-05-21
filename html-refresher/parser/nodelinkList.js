import { Attribute, Element, Node, TxtNode } from "./node.js";

/** @readonly @enum {string}*/
export const State = {
	InTagName: "InTagName",
	InAttribute: "InAttribute",
	InElement: "InElement",
	InText: "InText",
	InTagEnd: "InTagEnd",
	AfterElemEnd: "AfterElemEnd",
	InStyle: "InStyle",
	InScript: "InSscript",
	AfterNode: "AfterNode",
	BeforeNode: "BeforeNode",
	InParent: "InParent",
};

//curNode  node under cursor
export class NodelinkList {
	constructor() {}

	/**@protected @type {{_next:Element|TxtNode}}*/
	head = { _next: null };
	/**@protected @type {Element|TxtNode}*/
	crtNode = this.head;
	/**@protected @type {Array}*/
	patchNodes = [];

	/** @param {Element|TxtNode} newNode, @param {boolean} isPatch*/
	add(newNode, isPatch, parentId = null) {
		isPatch && this.patchNodes.push(NodelinkList.#getNodeData(newNode, parentId));
		if (this.crtNode._next) {
			newNode._next = this.crtNode._next;
			this.crtNode._next._previous = newNode;
		}
		this.crtNode._next = newNode;
		newNode._previous = this.crtNode;
		this.crtNode = newNode;
	}

	/** @param {number} position, @returns {Element|TxtNode} */
	#walkForwardUntil(position) {
		let crtNode = this.head;

		while (crtNode._next.start <= position) {
			crtNode = crtNode._next;
			if (!crtNode || !crtNode._next) break;
		}
		return crtNode;
	}

	/**@protected @param {Element|TxtNode} node, @param {number} offset*/
	shiftTree(node, offset, attrIdx = 0) {
		node.end += offset;
		node.attributes && NodelinkList.#shiftAttrForward(node.attributes, offset, attrIdx);

		/**@type {Element|TxtNode}*/
		let nxtNode = node._next;
		while (nxtNode) {
			nxtNode.start += offset;
			nxtNode.attributes && NodelinkList.#shiftAttrForward(nxtNode.attributes, offset);
			nxtNode.end += offset;
			nxtNode = nxtNode._next;
		}
	}

	/**@param {Attribute[]} attributes, @param {number} offset*/
	static #shiftAttrForward(attributes, offset, attrIdx = 0) {
		for (let index = attrIdx; index < attributes.length; index++) {
			const attr = attributes[index];
			attr.start += offset;
			attr.end += offset;
		}
	}

	/**@protected @param {Element|TxtNode} crtNode, @param {number} rangeOffset, @param {number} shift*/
	static shiftParent(crtNode, rangeOffset, shift) {
		if (crtNode.type === Node.ELEMENT && crtNode.end > rangeOffset) crtNode.end += shift;

		let prevNode = crtNode._previous;
		while (prevNode) {
			if (prevNode.type === Node.ELEMENT && prevNode.end > rangeOffset) prevNode.end += shift;
			prevNode = prevNode._previous;
		}
	}

	/**@protected @param {number} position*/
	getNearestNodeAt(position) {
		//TODO check need to go forward or backward
		const curNode = this.#walkForwardUntil(position);
		return curNode;
	}

	/**@protected @param {Element|TxtNode} crtNode, @param {number}position, @returns {{relation:string,kinNodeId:number}}}*/
	static findRelativeNode(crtNode, position) {
		if (crtNode._next) {
			return {
				relation: "NextSibling",
				kinNodeId: crtNode._next.id,
			};
		}

		return {
			relation: "Parent",
			kinNodeId: NodelinkList.#findParent(crtNode, position),
		};
	}

	/**@param {Element|TxtNode} crtNode, @param {number}position, @returns {number}*/
	static #findParent(crtNode, position) {
		while (crtNode.end < position) {
			crtNode = crtNode._previous;
		}
		return crtNode.id;
	}

	/**@protected @param {number}nodeId, @returns {Element|TxtNode}*/
	findNodeById(nodeId) {
		let curNode = this.crtNode;
		while ((curNode = curNode._previous)) {
			if (curNode.id === nodeId) return curNode;
		}

		curNode = this.head;
		while ((curNode = curNode._next)) {
			if (curNode.id === nodeId) return curNode;
		}
	}

	/**@protected @param {number} position, @param {Element} curElement*/
	static getStateInElemAt(position, curElement) {
		if (!curElement) return null;
		//+1 for include > or space
		const tagNamePos = curElement.start + curElement.tagName.length + 1;
		if (curElement.attributes && position < curElement.attributes.at(-1)?.end + 1) {
			if (position < tagNamePos) return State.InTagName;
			return State.InAttribute;
		}
		if (position < tagNamePos) return State.InTagName;
		if (position === curElement.end) return State.AfterElemEnd;

		if (position < curElement.end - curElement.tagName.length + 2) {
			if (curElement.tagName === "style") return State.InStyle;
			if (curElement.tagName === "script") return State.InScript;
			return State.InElement;
		} else return State.InTagEnd;
	}

	/**@protected  @param {number} position, @param {Element} curElement, @returns {number}*/
	static getCrtAttrIndex(position, curElement) {
		for (let index = 0; index < curElement.attributes.length; index++) {
			const attribute = curElement.attributes[index];
			if (position >= attribute.start && position <= attribute.end) {
				return index;
			}
		}
		return -1;
	}

	/**@protected @param {number} start, @param {number} end, @returns {number[]}*/
	removeElementsInRange(start, end) {
		let crtNode = this.#walkForwardUntil(start);
		let noteIds = [];
		while (crtNode._next.start <= end) {
			crtNode = crtNode._next;
			if (crtNode.start >= start && crtNode.end <= end) {
				noteIds.push(crtNode.id);
				crtNode._previous._next = crtNode._next;
			}
			if (!crtNode || !crtNode._next) break;
		}

		return noteIds.length > 0 ? noteIds : null;
	}

	/**@returns {object}*/
	static #getNodeData({ _next, _previous, ...node }, parentId) {
		if (node.type === Node.TEXT) {
			return {
				type: node.type,
				nodeValue: node.nodeValue,
				parentId,
			};
		} else if (node.type === Node.ELEMENT) {
			return {
				type: node.type,
				attributes: node.attributes,
				tagName: node.tagName,
				parentId,
			};
		}
	}

	static prettyNode({ _next, _previous, ...node }) {
		console.log(node);
	}
}
