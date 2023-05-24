//live refresh
/**
 * @typedef refreshData
 * @type {object}
 * @property {string} action
 * @property {number} [nodeId]
 * @property {number} [replaceTxtNodeId]
 * @property {number[]} [nodeIds]
 * @property {refreshData[]} [siblingDataArr]
 * @property {string}[txtData]
 * @property {string}[tagName]
 * @property {object}[attribute]
 * @property {object}[patchNodes]
 * @property {{relation:string,kinNodeId:number}}[relative]
 */

/**
 * @typedef ruleData
 * @type {object}
 * @property {string} action

 * @property {number[]} parentRule
 * @property {number} index
 * @property {string} sheetUrl
 * @property {string} [selector]
 * @property {string}[selectorType]
 * @property {object} [declaration]
 * @property {array} [rmRulesData]
 * @property {string} [ruleTxt]
 * @property {Array} [rmDeclarations]
 */

/** @readonly @enum {Function}*/
export const liveActions = {
	insertNewNodes: insertNewNodes,
	replaceSiblings: replaceSiblings,
	updateTxtNode: updateTxtNode,
	updateTagName: updateTagName,
	updateAttrName: updateAttrName,
	updateAttrValue: updateAttrValue,
	removeNodes: removeNodes,
	addTxtNode: addTxtNode,
	ruleSelector: updateRuleSelector,
	addDeclaration: addDeclaration,
	ruleDeclarations: updateRuleDeclarations,
	removeRules: removeRules,
	removeDeclarations: removeDeclarations,
	insertRule: insertRule,
	inlineStyle: replaceInlineStyle,
};
//livePreviewIds, setLpsNodeId declare in injected note-id.js
//>>>>>>>>>>>>>>>> HTMLElement Update >>>>>>>>>>>>>>>>>>>>>>
/**@type {HTMLElement} */
var highlightedElem;
/**@param {number}nodeId, @returns {HTMLElement} */
function getElem(nodeId) {
	/* highlightedElem && removeHighlight(highlightedElem); */

	/**@type {HTMLElement} */
	highlightedElem = livePreviewIds.get(nodeId)?.deref();

	if (highlightedElem) {
		if (highlightedElem.nodeType === Node.TEXT_NODE) {
			// highlightedElem.parentElement.classList.add("lps-highlighted");
			highlightedElem.parentElement?.scrollIntoView(true);
		} else {
			// highlightedElem.classList.add("lps-highlighted");
			highlightedElem.scrollIntoView(true);
		}

		// setTimeout(removeHighlight, 4000, highlightedElem);
	}
	return highlightedElem;
}

/**@param {HTMLElement}  highlightedElem*/
/* function removeHighlight(highlightedElem) {
	highlightedElem.nodeType === Node.TEXT_NODE
		? highlightedElem.parentElement.classList.remove("lps-highlighted")
		: highlightedElem?.classList.remove("lps-highlighted");
} */

/**@param {Array} patchNodes */
function getNewNodesFrag(patchNodes) {
	const docFrag = new DocumentFragment();

	const parentElemMap = new Map([[null, docFrag]]);
	for (const nodeItem of patchNodes) {
		//TODO insert nested elem
		if (nodeItem.type === Node.TEXT_NODE) {
			const txtNode = new Text(nodeItem.nodeValue);
			parentElemMap.get(nodeItem.parentId).appendChild(txtNode);
			setLpsNodeId(txtNode);
		} else if (nodeItem.type === Node.ELEMENT_NODE) {
			const newDomElem = document.createElement(nodeItem.tagName);
			if (nodeItem.attributes) {
				for (const attr of nodeItem.attributes) newDomElem.setAttribute(attr.name, attr.value);
			}
			parentElemMap.get(nodeItem.parentId).appendChild(newDomElem);
			setLpsNodeId(newDomElem);
			parentElemMap.set(newDomElem.livePreviewId, newDomElem);
		}
	}
	return docFrag;
}

/**@param {refreshData} updateData */
function insertNewNodes(updateData) {
	const docFrag = getNewNodesFrag(updateData.patchNodes);
	insetNodesIntoDomTree(updateData, docFrag);
}

/**@param {refreshData} updateData, @param {Text|DocumentFragment} nodeFrag */
function insetNodesIntoDomTree(updateData, nodeFrag) {
	if (updateData.relative) {
		const kinDomElem = getElem(updateData.relative.kinNodeId);
		if (!kinDomElem) return console.error(updateData.relative.kinNodeId + "node not found");
		if (updateData.relative.relation === "Parent") kinDomElem.append(nodeFrag);
		else if (updateData.relative.relation === "NextSibling")
			kinDomElem.parentElement.insertBefore(nodeFrag, kinDomElem);
		else if (updateData.relative.relation === "BeforeSibling") kinDomElem.after(nodeFrag);
	} else {
		if (updateData.replaceTxtNodeId) {
			const domNode = getElem(updateData.replaceTxtNodeId);
			if (!domNode) return;
			domNode.parentElement.replaceChild(nodeFrag, domNode);
		} else {
			const domElem = getElem(updateData.nodeId);
			if (!domElem) return;
			domElem.prepend(nodeFrag);
		}
	}
}

/**@param {refreshData} updateData */
function replaceSiblings(updateData) {
	const domNode = getElem(updateData.nodeId);
	if (!domNode) return;

	/**@type {Element} */
	let sibling = domNode;
	for (const sibData of updateData.siblingDataArr) {
		switch (sibData.action) {
			case "updateTxtNode":
				sibling.nodeValue = sibData.txtData;
				break;

			case "insertNewNodes":
				const docFrag = getNewNodesFrag(sibData.patchNodes);
				sibling.after(docFrag);
				sibling = sibling.nextElementSibling;
				break;

			case "addTxtNode":
				const txtNode = new Text(sibData.txtData);
				setLpsNodeId(txtNode);
				sibling.after(txtNode);
				sibling = sibling.nextElementSibling;
				break;
		}
	}
}

/**@param {refreshData} updateData */
function addTxtNode(updateData) {
	const txtNode = new Text(updateData.txtData);
	setLpsNodeId(txtNode);
	insetNodesIntoDomTree(updateData, txtNode);
}

/**@param {refreshData} updateData */
function updateTxtNode(updateData) {
	const txtNode = getElem(updateData.nodeId);
	if (!txtNode) return;
	txtNode.nodeValue = updateData.txtData;
}

/**@param {refreshData} updateData */
function updateTagName(updateData) {
	const domElem = getElem(updateData.nodeId);
	if (!domElem) return;
	const newDomElem = document.createElement(updateData.tagName);
	for (const attr of domElem.attributes) {
		newDomElem.setAttribute(attr.name, attr.value);
	}

	newDomElem.append(...domElem.childNodes);
	domElem.replaceWith(newDomElem);
	livePreviewIds.set(updateData.nodeId, new WeakRef(newDomElem));
}

/**@param {refreshData} updateData */
function updateAttrName(updateData) {
	const domElem = getElem(updateData.nodeId);
	if (!domElem) return;
	const { oldTxt, data } = updateData.attribute;
	domElem.removeAttribute(oldTxt);
	domElem.setAttribute(data.name, data.value);
}

/**@param {refreshData} updateData */
function updateAttrValue(updateData) {
	const domElem = getElem(updateData.nodeId);
	if (!domElem) return;
	const { data } = updateData.attribute;
	domElem.setAttribute(data.name, data.value);
}

/**@param {refreshData} updateData */
function removeNodes(updateData) {
	for (const nodeId of updateData.nodeIds) {
		const domElem = getElem(nodeId);
		if (!domElem) return;
		domElem.remove();
		livePreviewIds.delete(nodeId);
	}
}

/**@param {refreshData} updateData */
function replaceInlineStyle(updateData) {
	const domElem = getElem(updateData.nodeId);
	if (!domElem) return;
	const styleElem = document.createElement("style");
	styleElem.textContent = updateData.styleData;
	domElem.replaceWith(styleElem);
}

/* document.body.addEventListener("click", highlightNodeInVscode);
function highlightNodeInVscode({ target }) {
	//TODO websocket message will better
	fetch(`/view/highlight-node-vscode?node=${target.livePreviewId}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
	})
		.then((response) => response.ok && response.json())
		.then((data) => console.log(data))
		.catch((err) => console.error(err));
} */

//$$$$$$$$$$$$$$$$$$$$$$$$$$$ CSSRule update $$$$$$$$$$$$$$$$$$$$$$$$$
const isFirefox = navigator.userAgent.indexOf("Firefox") !== -1;

/**@param {ruleData} updateData */
function updateRuleSelector(updateData) {
	const parentRule = getParentRule(updateData);
	const rule = parentRule.cssRules[updateData.index];
	if (!rule) return;

	const selector = updateData.selectorType || "selectorText";
	if (rule[selector] !== updateData.selector) {
		rule[selector] = updateData.selector;
		parentRule.deleteRule(updateData.index);
		parentRule.insertRule(rule.cssText, updateData.index);
	}
}

/**@param {ruleData} updateData */
function addDeclaration(updateData) {
	if (isFirefox) return console.error("live refresh doesn't support in firefox");
	const rule = getParentRule(updateData).cssRules[updateData.index];
	if (!rule) return;

	const styleMap = rule.styleMap;
	try {
		styleMap.set(updateData.declaration.property, updateData.declaration.value);
	} catch (error) {
		console.error(error.message);
	}
}

/**@param {ruleData} updateData */
function updateRuleDeclarations(updateData) {
	if (isFirefox) return console.error("live refresh doesn't support in firefox");
	const rule = getParentRule(updateData).cssRules[updateData.index];
	if (!rule) return;

	const styleMap = rule.styleMap;
	const data = updateData.declaration;
	if (data.prop === "property") {
		try {
			styleMap.delete(data.oldTxt);
		} catch (error) {
			console.error("cannot delete this property:" + data.prop);
		}
	}
	try {
		styleMap.set(data.declaration.property, data.declaration.value);
	} catch (error) {
		console.error(error.message);
	}
}

/**@param {ruleData} updateData */
function removeRules(updateData) {
	for (const ruleData of updateData.rmRulesData) {
		ruleData.sheetUrl = updateData.sheetUrl;
		const parentRule = getParentRule(ruleData);
		try {
			parentRule.deleteRule(ruleData.index);
		} catch (error) {
			console.error(error.message);
		}
	}
}

/**@param {ruleData} updateData */
function removeDeclarations(updateData) {
	if (isFirefox) return console.error("live refresh doesn't support in firefox");
	const rule = getParentRule(updateData).cssRules[updateData.index];
	if (!rule) return;

	const styleMap = rule.styleMap;
	for (const property of updateData.rmDeclarations) {
		try {
			styleMap.delete(property);
		} catch (error) {
			console.error(error.message);
		}
	}
}

/**@param {ruleData} updateData */
function insertRule(updateData) {
	const parentRule = getParentRule(updateData);
	try {
		parentRule.insertRule(updateData.ruleTxt, updateData.index);
	} catch (error) {
		console.error(error.message);
	}
}

/** @type {CSSStyleSheet} */
let styleSheet;

/**@param {ruleData} updateData, @returns {CSSStyleSheet}*/
function getParentRule(updateData) {
	const { sheetUrl, parentRule: parentRuleArr } = updateData;
	/**@type {CSSStyleSheet} */
	if (!styleSheet || sheetUrl !== new URL(styleSheet.href).pathname) {
		styleSheet = liveStyleSheets.get(sheetUrl);
	}

	let parentRule = styleSheet;
	if (parentRuleArr) {
		let i = parentRuleArr.length;
		while (i--) {
			parentRule = parentRule.cssRules[parentRuleArr[i]];
		}
	}
	return parentRule;
}

//add highlight style
const cssStyleSheet = new CSSStyleSheet();
cssStyleSheet.replace(`.lps-highlighted {
	position: relative;
}

.lps-highlighted::before {
	content: "";
	position: absolute;
	inset: 0;
	z-index: 1;
	box-shadow: 1px 1px 0 0 rgba(11, 146, 236, 0.3), -1px -1px 0 0 rgba(11, 146, 236, 0.3);
	background-color: rgba(11, 146, 236, 0.02);
	border-radius: 2px;
	animation: highlight 4000ms ease-in-out;
}

@keyframes highlight {

	0%,
	100% {
		background-color: rgba(11, 146, 236, 0.1);
	}

	30% {
		background-color: rgba(11, 146, 236, 0.3);
	}
}

#lps-status-info {
	border-radius: 10%/25%;
	padding: 0.4em 0.6em;
	color: white;
	background-color: red;
	position: fixed;
	bottom: 1em;
	right: 1em;
}`);

document.adoptedStyleSheets = [...document.adoptedStyleSheets, cssStyleSheet];
