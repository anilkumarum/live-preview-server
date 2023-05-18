import { Element, Node, TxtNode } from "./node.js";

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
};

//curNode  node under cursor
export class NodelinkList {
	constructor() {}

	/**@type {{_next:Element|TxtNode}}*/
	head = { _next: null };
	/**@type {Element|TxtNode}*/
	crtNode = this.head;
	/**@type {Array}*/
	patchNodes = [];

	/** @param {Element|TxtNode} newNode*/
	add(newNode, isPatch) {
		isPatch && this.patchNodes.push(this.getNodeData(newNode));
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
		return position <= crtNode.end ? crtNode : null;
	}

	/** @param {number} position, @returns {Element|TxtNode} */
	walkBackwardUntil(position) {
		let crtNode = this.head;

		while (crtNode._previous.end <= position) {
			crtNode = crtNode._previous;
			if (!crtNode) return null;
		}

		return position <= crtNode.end ? crtNode : null;
	}

	/**@protected @param {number} rangeLength, @param {number} textLength, @param {Element} node*/
	shiftTree(rangeLength, textLength, node) {
		const shift = textLength - rangeLength;
		shift > 0 ? this.shiftForward(node, shift) : this.shiftBackward(node, -shift);
	}

	/**@protected @param {Element|TxtNode} node, @param {number} offset*/
	shiftForward(node, offset, attrIdx = 0) {
		node.end += offset;
		node.attributes && this.#shiftAttrForward(node.attributes, offset, attrIdx);

		/**@type {Element|TxtNode}*/
		let nxtNode = node._next;
		while (nxtNode) {
			nxtNode.start += offset;
			nxtNode.attributes && this.#shiftAttrForward(nxtNode.attributes, offset);
			nxtNode.end += offset;
			nxtNode = nxtNode._next;
		}
	}

	#shiftAttrForward(attributes, offset, attrIdx = 0) {
		for (let index = attrIdx; index < attributes.length; index++) {
			const attr = attributes[index];
			attr.start += offset;
			attr.end += offset;
		}
	}

	/**@protected @param {Element|TxtNode} node, @param {number} offset*/
	shiftBackward(node, offset, attrIdx = 0) {
		node.end -= offset;
		node.attributes && this.#shiftAttrBackward(node.attributes, offset, attrIdx);

		let prevNode = node._previous;
		while (prevNode) {
			prevNode.start -= offset;
			prevNode.attributes && this.#shiftAttrBackward(prevNode.attributes, offset);
			prevNode.end -= offset;
			prevNode = prevNode._previous;
		}
	}

	#shiftAttrBackward(attributes, offset, attrIdx = 0) {
		for (let index = attrIdx; index < attributes.length; index++) {
			const attr = attributes[index];
			attr.start -= offset;
			attr.end -= offset;
		}
	}

	/**@protected @param {Element|TxtNode} crtNode, @param {number} rangeOffset, @param {number} shift*/
	shiftParent(crtNode, rangeOffset, shift) {
		if (crtNode.type === Node.ELEMENT && crtNode.end > rangeOffset) crtNode.end += shift;

		let prevNode = crtNode._previous;
		while (prevNode) {
			if (prevNode.type === Node.ELEMENT && prevNode.end > rangeOffset) prevNode.end += shift;
			prevNode = prevNode._previous;
		}
	}

	/**@param {number} position*/
	getNodeAtPosition(position) {
		//check need to go forward or backward
		const curNode = this.#walkForwardUntil(position);
		return curNode;
	}

	/**@param {number} position, @param {Element} curElement*/
	getStateInElemAt(position, curElement) {
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

	/** @param {number} position, @param {Element} curElement, @returns {number}*/
	getCrtAttrIndex(position, curElement) {
		for (let index = 0; index < curElement.attributes.length; index++) {
			const attribute = curElement.attributes[index];
			if (position >= attribute.start && position <= attribute.end) {
				return index;
			}
		}
		return -1;
	}

	/**@param {number} start, @param {number} end, @returns {number[]}*/
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
	getNodeData({ _next, _previous, ...node }) {
		if (node.type === Node.TEXT) {
			return {
				type: node.type,
				nodeValue: node.nodeValue,
			};
		} else if (node.type === Node.ELEMENT) {
			return {
				type: node.type,
				attributes: node.attributes,
				tagName: node.tagName,
			};
		}
	}

	/* 	prettyPrint(rootNode = this.head) {
		let crtNode = rootNode ?? this.head;
		crtNode._previous && delete crtNode._previous;

		while (crtNode._next) {
			crtNode = crtNode._next;
			if (!crtNode || !crtNode._previous) break;
			delete crtNode._previous;
		}
		console.log(JSON.stringify(rootNode._next));
	}

	prettyNode({ _next, _previous, ...node }) {
		console.log(node);
	} */
}
