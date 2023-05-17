export class CssRule {
	/**@param {number} type, @param {string} selector, @param {number} start, @param {Array|null} parentRule*/
	constructor(type, selector, start, end, index, parentRule) {
		this.type = type;
		this.selector = selector;
		/**@type {Declaration[]} */
		this.declarations = [];
		this.start = start;
		/**@type {number} */
		this.selectorEnd = end;
		this.end = null;
		/**@type {CssRule} */
		this._previous = null;
		/**@type {CssRule} */
		this._next = null;
		/**@type {string} */
		this.name = null;
		/**@type {number[]} */
		this.parentRule = parentRule;
		/**@type {number} */
		this.index = index;
	}
}

export class Declaration {
	/**@param {string} property, @param {number} start*/
	constructor(property, start) {
		/**@type {string} */
		this.property = property;
		/**@type {number} */
		this.start = start;
		/**@type {string} */
		this.value = null;
		/**@type {number} */
		this.end = null;
	}
}
