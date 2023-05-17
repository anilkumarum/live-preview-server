export class Node {
	static ELEMENT = 1;
	static TEXT = 3;
	static nodeCount = -1;

	/**@param {number} nodeType, @param {number} start*/
	constructor(nodeType, start) {
		this.type = nodeType || Node.TEXT;
		this.start = start;
		this.end = null;
		this._previous = null;
		this._next = null;
		this.id = ++Node.nodeCount;
	}
}

export class Element extends Node {
	/**@param {string} tagName, @param {number} start*/
	constructor(tagName, start) {
		super(Node.ELEMENT, start);
		this.tagName = tagName;
		/**@type {Attribute[]} */
		this.attributes = null;
	}
}

export class TxtNode extends Node {
	/**@param {string} nodeValue, @param {number} start*/
	constructor(nodeValue, start, end) {
		super(Node.TEXT, start);
		this.nodeValue = nodeValue;
		this.end = end;
	}
}

export class Attribute {
	/**@param {string} name, @param {number} start*/
	constructor(name, start) {
		this.name = name;
		this.start = start;
		this.end = null;
		this.value = null;
	}
}
