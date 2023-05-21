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
 * @property {object} [declarations]
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
};

//>>>>>>>>>>>>>>>> HTMLElement Update >>>>>>>>>>>>>>>>>>>>>>
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
			console.log(parentElemMap);
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
		const kinDomElem = livePreviewIds.get(updateData.relative.kinNodeId)?.deref();
		if (updateData.relative.relation === "Parent") kinDomElem.append(nodeFrag);
		else if (updateData.relative.relation === "NextSibling")
			kinDomElem.parentElement.insertBefore(nodeFrag, kinDomElem);
		else if (updateData.relative.relation === "BeforeSibling") kinDomElem.after(nodeFrag);
	} else {
		if (updateData.replaceTxtNodeId) {
			/**@type {HTMLElement} */
			const domNode = livePreviewIds.get(updateData.replaceTxtNodeId)?.deref();
			if (!domNode) return;
			domNode.parentElement.replaceChild(nodeFrag, domNode);
		} else {
			const domElem = livePreviewIds.get(updateData.nodeId)?.deref();
			if (!domElem) return;
			domElem.prepend(nodeFrag);
		}
	}
}

/**@param {refreshData} updateData */
function replaceSiblings(updateData) {
	const domNode = livePreviewIds.get(updateData.nodeId)?.deref();
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
	const txtNode = livePreviewIds.get(updateData.nodeId)?.deref();
	if (!txtNode) return;
	txtNode.nodeValue = updateData.txtData;
}

/**@param {refreshData} updateData */
function updateTagName(updateData) {
	/**@type {HTMLElement} */
	const domElem = livePreviewIds.get(updateData.nodeId)?.deref();
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
	/**@type {HTMLElement} */
	const domElem = livePreviewIds.get(updateData.nodeId)?.deref();
	if (!domElem) return;
	const { oldTxt, data } = updateData.attribute;
	domElem.removeAttribute(oldTxt);
	domElem.setAttribute(data.name, data.value);
}

/**@param {refreshData} updateData */
function updateAttrValue(updateData) {
	/**@type {HTMLElement} */
	const domElem = livePreviewIds.get(updateData.nodeId)?.deref();
	if (!domElem) return;
	const { data } = updateData.attribute;
	domElem.setAttribute(data.name, data.value);
}

/**@param {refreshData} updateData */
function removeNodes(updateData) {
	for (const nodeId of updateData.nodeIds) {
		/**@type {HTMLElement} */
		const domElem = livePreviewIds.get(nodeId)?.deref();
		if (!domElem) return;
		domElem.remove();
		livePreviewIds.delete(nodeId);
	}
}

//$$$$$$$$$$$$$$$$$$$$$$$$$$$ CSSRule update $$$$$$$$$$$$$$$$$$$$$$$$$
const notFirefox = navigator.userAgent.indexOf("Firefox") === -1;

/**@param {ruleData} updateData */
function updateRuleSelector(updateData) {
	const parentRule = getParentRule(updateData);
	const rule = parentRule.cssRules[updateData.index];
	if (!rule) return;

	//TODO at-rule conditionalText
	if (rule.selectorText !== updateData.selector) {
		rule.selectorText = updateData.selector;
		parentRule.deleteRule(updateData.index);
		parentRule.insertRule(rule.cssText, updateData.index);
	}
}

/**@param {ruleData} updateData */
function addDeclaration(updateData) {
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
	const rule = getParentRule(updateData).cssRules[updateData.index];
	if (!rule) return;

	const styleMap = rule.styleMap;
	const data = updateData.declarations;
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
		parentRule.deleteRule(ruleData.index);
	}
}

/**@param {ruleData} updateData */
function removeDeclarations(updateData) {
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
