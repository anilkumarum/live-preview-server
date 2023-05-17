//NOTE
// don't add "" in reactive attribute
//event listener must be at last
const attrRx = new RegExp(/\s\.(.*)=$/);
const childFrag = new Map();
const reactAttrs = new Map();
const funcMap = new Map();
const objMap = new Map();
let reactNode;
let reactAttr;
let reactValFn;
let reactFragFn;
let reactStyle;
let reactCmt;

const extractor = {
	strings: null,
	stringArr: null,

	extract(strings, ...keys) {
		this.strings = strings;
		this.stringArr = [strings[0]];

		const length = keys.length;
		for (let i = 0; i < length; i++) {
			const key = keys[i];
			//extract function and reactive arrow function
			if (key instanceof Function) key.name ? this.extractFunc(key, i) : this.extractReactfn(key, i);
			//extract one childfragment
			else if (key instanceof DocumentFragment) childFrag.set(this.setComment(i), key);
			//extract array of childfragment
			else if (Array.isArray(key)) this.extractArray(key, i);
			//extract promise
			// else if (key instanceof Promise) this.extractPromise(key, i);
			//extract object
			else if (typeof key === "object") this.setObjHolder(key, i);
			else this.stringArr.push(key, strings[i + 1]);
		}
		const parseStr = "".concat(...this.stringArr);
		this.strings = null;
		this.stringArr = null;
		return parseStr;
	},

	extractFunc(key, i) {
		const funName = String(Math.random()).slice(9);
		funcMap.set(funName, key);
		this.stringArr.push(funName, this.strings[i + 1]);
	},

	extractReactfn(key, i) {
		//=  check for any attribute or : for style attribute reactor
		if (this.strings[i].endsWith("=") || this.strings[i].endsWith(":")) this.setReactHolder(key, i);
		else if (this.strings[i].endsWith(">")) childFrag.set(this.setComment(i), key);
		else if (this.strings[i].trim().endsWith(">")) childFrag.set(this.setComment(i, "?^"), key);
		else childFrag.set(this.setComment(i), key);
		//TODO improve this
	},

	extractArray(key, i) {
		//check array in attribute
		const comment = this.setComment(i);
		if (this.strings[i].endsWith("=")) this.setObjHolder(key, i);
		//extract map block array or array.map block
		else if (key[1] ?? key[0] instanceof DocumentFragment) childFrag.set(comment, key);
		else this.stringArr.push(...key, this.strings[i + 1]);
	},

	setObjHolder(key, i) {
		const objName = this.strings[i].match(attrRx)[1];
		objMap.set(objName, key);
		this.stringArr.push(objName, this.strings[i + 1]);
	},

	setComment(i, type = "?") {
		const cmtName = ` ${type}${String(Math.random()).slice(9)} `;
		this.stringArr.push(`<!--${cmtName}--> `, this.strings[i + 1]);
		return cmtName;
	},

	extractPromise(promise, i) {
		const cmtName = this.setComment(i, "");
		promise.then((value) => fragment.setPromiseFrag(cmtName, value));
	},

	setReactHolder(key, i) {
		const attrName = "%" + String(Math.random()).slice(9);
		reactAttrs.set(attrName, key);
		this.stringArr.push(attrName, this.strings[i + 1]);
	},
};

const fragment = {
	replaceChildFrag(cmtNode, docFrag) {
		if (Array.isArray(docFrag)) cmtNode.parentNode.replaceChildren(cmtNode, ...docFrag);
		else cmtNode.parentNode.replaceChild(docFrag, cmtNode.nextSibling);
	},

	insertReactChildFrag(cmtNode, frag) {
		reactCmt = cmtNode;
		reactFragFn = frag;
		const siblingFrag = reactFragFn();
		if (siblingFrag instanceof Promise) siblingFrag.then((docFrag) => this.replaceChildFrag(cmtNode, docFrag));
		else reactCmt.after(siblingFrag || new Comment(String(Math.random()).slice(9)));
		reactFragFn = reactCmt = null;
	},

	insertReactTxtCnt(cmtNode, frag) {
		reactNode = new Text();
		reactValFn = frag;
		reactNode.textContent = reactValFn();
		cmtNode.parentNode.replaceChild(reactNode, cmtNode);
		reactNode = reactValFn = null;
	},

	setChildFragment(domFrag) {
		const nodeIterator = document.createNodeIterator(domFrag, NodeFilter.SHOW_COMMENT, (node) =>
			node.nodeValue?.startsWith(" ?") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
		);

		let cmtNode;
		while ((cmtNode = nodeIterator.nextNode())) {
			const frag = childFrag.get(cmtNode.nodeValue);
			if (frag) {
				if (frag instanceof Function) {
					cmtNode.nodeValue.startsWith(" ?^")
						? this.insertReactChildFrag(cmtNode, frag)
						: this.insertReactTxtCnt(cmtNode, frag);
				} else Array.isArray(frag) ? cmtNode.after(...frag) : cmtNode.parentNode.replaceChild(frag, cmtNode);
			}
		}
	},

	setPromiseFrag(cmtName, docFrag, rootElem) {
		//must change document.body with rootElem
		const nodeIterator = document.createNodeIterator(document.body, NodeFilter.SHOW_COMMENT, (node) =>
			node.nodeValue === cmtName ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
		);

		const cmtNode = nodeIterator.nextNode();
		cmtNode && this.replaceChildFrag(cmtNode, docFrag);
	},
};

const attrParser = {
	mutatNodes: {
		INPUT: "change",
		DETAILS: "toggle",
		DIALOG: "close",
		SELECT: "change",
	},

	"@": (node, attr, attrMap) => {
		node.addEventListener(attr.name.slice(1), funcMap.get(attr.value));
		// attrParser.mutatNodes[node.tagName] && (node["bindEvent"] = attr.name.slice(1));//!test
		attrMap.removeNamedItem(attr.name);
		return true;
	},

	attrProp: (node, attr, attrMap) => {
		reactNode = node;
		reactAttr = attr.name.slice(1);
		reactValFn = reactAttrs.get(attr.value);
		if (!reactValFn) return console.error(`${attr.name} value is not a function or not found`);
		attrMap.removeNamedItem(attr.name);
		node[reactAttr] = reactValFn();
		reactNode = reactAttr = reactValFn = null;
	},

	".": (node, attr, attrMap) => {
		node.tagName === "INPUT" && (node["bindEvent"] = attrParser.mutatNodes[node.tagName]); //!test
		attrParser.attrProp(node, attr, attrMap);
		return true;
	},

	"?": (node, attr, attrMap) => {
		attrParser.mutatNodes[node.tagName] && (node["bindEvent"] = attrParser.mutatNodes[node.tagName]); //!test
		attrParser.attrProp(node, attr, attrMap);
		return true;
	},

	r: (node, attr, attrMap) => {
		if (attr.name !== "ref") return;
		reactAttrs.get(attr.value)?.(node);
		attrMap.removeNamedItem(attr.name);
		return true;
	},

	s: (node, attr) => {
		if (attr.name !== "style") return;
		reactNode = node;
		reactAttr = attr.name;
		const styles = attr.value.split(";");

		for (const style of styles) {
			const [key, value] = style.split(":");
			if (value?.startsWith("%")) {
				reactStyle = key;
				reactValFn = reactAttrs.get(value);
				node.style.setProperty(key, reactValFn());
			}
		}
		reactNode = reactAttr = reactStyle = reactValFn = null;
		return true;
	},

	"%": (node, attr) => {
		reactNode = node;
		reactAttr = attr.name;
		reactValFn = reactAttrs.get(attr.value);
		node.setAttribute(attr.name, reactValFn());
		reactNode = reactAttr = reactValFn = null;
	},

	parseNodeAttr(node) {
		const attrMap = node.attributes;
		let i = attrMap.length;
		while (i--) {
			const attr = attrMap[i];
			this[attr.name.at(0)]?.(node, attr, attrMap) || (attr.value.startsWith("%") && this["%"]?.(node, attr));
		}
	},
};

/**
 *
 * @param {TemplateStringsArray} strings
 * @param  {any[]} keys
 * @returns {DocumentFragment}
 */
export function html(strings, ...keys) {
	const htmlStr = extractor.extract(strings, ...keys);
	const domFrag = document.createRange().createContextualFragment(htmlStr);

	//set listener and pass object/array to
	for (const node of domFrag.querySelectorAll("*")) node.hasAttributes() && attrParser.parseNodeAttr(node);

	//set nested document fragment
	childFrag.size > 0 && fragment.setChildFragment(domFrag);

	clearMap();
	return domFrag;
}

/**
 *
 * @param {TemplateStringsArray} strings
 * @param  {any[]} keys
 * @returns {HTMLCollectionOf<SVGElement>|SVGElement}
 */
export function svg(strings, ...keys) {
	const svgStr = extractor.extract(strings, ...keys);
	const svgFrag = document.createRange().createContextualFragment(`<svg>${svgStr}</svg>`).firstElementChild;

	//set listener and pass object/array to
	for (const node of svgFrag.querySelectorAll("*")) node.hasAttributes() && attrParser.parseNodeAttr(node);

	//set nested document fragment
	childFrag.size > 0 && fragment.setChildFragment(svgFrag);

	clearMap();
	return svgFrag.childElementCount === 1 ? svgFrag.firstElementChild : svgFrag.children;
}

function clearMap() {
	childFrag.clear();
	reactAttrs.clear();
	funcMap.clear();
	objMap.clear();
}

/**
 * @param {Array} reactArr
 * @param {(value:any,index:number)=>DocumentFragment} cb
 * @returns {DocumentFragment[]}
 */
export function map(reactArr, cb) {
	Object.defineProperty(reactArr, "yieldfn", { value: cb });

	/**@type{DocumentFragment[]}*/
	const domArr = reactArr.map(cb);
	const comment = new Comment(` #${String(Math.random()).slice(9)} `);
	// @ts-ignore
	domArr.unshift(comment);
	Object.defineProperty(reactArr, "comment", { value: comment });
	return domArr;
}

//& reactive object
globalThis.$on ??= (target, type, callback) => target.addEventListener(type, callback); //temp
const bindAttrs = new Set(["value", "checked", "open"]);
function setBinding(reactNode, attr, targetObj, prop) {
	const nodeAttr = reactNode["valueAsNumber"] ? "valueAsNumber" : attr;
	$on(reactNode, reactNode["bindEvent"], function () {
		targetObj[prop] = this[nodeAttr];
	});
}

function setValue(reactData) {
	if (reactData.cmtNode) return setSibling(reactData);
	const node = reactData.node;
	if (reactData.attr) {
		if (reactData.style) reactData.node.style.setProperty(reactData.style, reactData.valFn());
		else if (node[reactData.attr] !== undefined && node instanceof HTMLElement)
			node[reactData.attr] = reactData.valFn();
		else node.setAttribute(reactData.attr, reactData.valFn());
	} else node.textContent = reactData.valFn();
}

function setSibling({ cmtNode, fragfn }) {
	const siblingFrag = fragfn();

	if (siblingFrag instanceof Promise)
		siblingFrag.then((docFrag) => fragment.replaceChildFrag(cmtNode, docFrag));
	else fragment.replaceChildFrag(cmtNode, siblingFrag || new Comment(String(Math.random()).slice(9)));
}

function insertReactData(target, prop, reactData) {
	if (target._reactMap.has(prop)) {
		const reactItem = target._reactMap.get(prop);
		Array.isArray(reactItem) ? reactItem.push(reactData) : target._reactMap.set(prop, [reactItem, reactData]);
	} else target._reactMap.set(prop, reactData);
}

export function react(targetObj) {
	if (Array.isArray(targetObj)) return reactArr(targetObj);
	Object.defineProperty(targetObj, "_reactMap", { value: new Map(), enumerable: false });

	for (const key in targetObj)
		if (targetObj[key] && typeof targetObj[key] === "object")
			targetObj[key] = Array.isArray(targetObj[key]) ? reactArr(targetObj[key]) : react(targetObj[key]);

	return new Proxy(targetObj, {
		get(target, prop, _) {
			let reactData;
			if (reactNode) {
				reactData = { node: reactNode, attr: reactAttr, valFn: reactValFn, style: reactStyle };
				bindAttrs.has(reactAttr) && reactNode["bindEvent"] && setBinding(reactNode, reactAttr, target, prop);
			} else if (reactCmt) reactData = { fragfn: reactFragFn, cmtNode: reactCmt };

			reactData && insertReactData(target, prop, reactData);
			return Reflect.get(...arguments);
		},

		set(target, prop, value) {
			if (typeof value !== "object" && target[prop] === value) return true;
			Reflect.set(target, prop, value);
			const reactData = target._reactMap.get(prop);

			if (reactData) {
				if (Array.isArray(reactData)) reactData.forEach(setValue);
				else reactData.cmtNode ? setSibling(reactData) : setValue(reactData);
			}
			return true;
		},

		deleteProperty(target, prop) {
			const reactData = target._reactMap.get(prop);
			Array.isArray(reactData)
				? reactData.forEach((data, idx) => data.node.isConnected || reactData.splice(idx, 1))
				: target._reactMap.delete(prop);
			delete target[prop];
			return true;
		},
	});
}

/** @param {Array} targetArr */
function reactArr(targetArr) {
	if (!Array.isArray(targetArr)) return console.error("input object must be array");
	const updateItem = (index) => {
		const parentEl = targetArr.comment.parentNode;
		targetArr.updateItem
			? targetArr.updateItem(parentEl.children[index], targetArr[index])
			: parentEl.replaceChild(getItems(targetArr[index]), parentEl.children[index]);
	};

	const getItems = (items) =>
		Array.isArray(items) ? items.map((item) => targetArr.yieldfn(item)) : targetArr.yieldfn(items);

	function spliceItem(start, deletcount, items) {
		deletcount > 0 &&
			[...Array(deletcount)].forEach((_, i) => targetArr.comment.parentNode.children[start + i].remove());
		if (items) {
			const childItems = getItems(items);
			start === 0
				? Array.isArray(childItems)
					? targetArr.comment.after(...childItems)
					: targetArr.comment.after(childItems)
				: targetArr.comment.parentNode.children[start - 1].after(childItems);
		}
	}

	const modifiers = {
		push: () =>
			function (items) {
				targetArr.push.apply(targetArr, arguments);
				const childItems = getItems(items);
				Array.isArray(childItems)
					? targetArr.comment.after(...childItems)
					: targetArr.comment.after(childItems);
			},

		pop: () =>
			function () {
				targetArr.pop.apply(targetArr, arguments);
				targetArr.comment.parentNode.lastElementChild.remove();
			},
		splice: () =>
			function (start, deletcount, items) {
				targetArr.splice.apply(targetArr, arguments);
				spliceItem(start, deletcount, items);
			},
		shift: () =>
			function () {
				targetArr.shift.apply(targetArr, arguments);
				spliceItem(0, 1);
			},
		unshift: () =>
			function (...items) {
				targetArr.unshift.apply(targetArr, arguments);
				spliceItem(0, 0, items);
			},
		reverse: () =>
			function () {
				targetArr.reverse.apply(targetArr, arguments);
				targetArr.comment.parentNode.append(...Array.from(targetArr.comment.parentNode.childNodes).reverse());
			},

		filter: () =>
			function () {
				const items = targetArr.filter.apply(targetArr, arguments);
				const childItems = getItems(items);
				targetArr.comment.parentNode.replaceChildren(...childItems);
			},
	};

	return new Proxy(targetArr, {
		get(target, prop, receiver) {
			if (modifiers[prop]) return modifiers[prop]();
			if (isFinite(prop) && targetArr.comment) setTimeout(updateItem.bind(this, Number(prop)), 0);
			return Reflect.get(...arguments);
		},

		deleteProperty(target, prop) {
			target.comment.parentNode.children[Number(prop)].remove();
			delete target[prop];
			return true;
		},

		defineProperty(target, key, descriptor) {
			Object.defineProperty(target, key, descriptor);
			return Reflect.get(...arguments);
		},
	});
}

globalThis.html = html;
globalThis.svg = svg;
globalThis.map = map;
globalThis.react = react;
