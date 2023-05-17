//live refresh
/**
 * @typedef refreshData
 * @type {object}
 * @property {string} action
 * @property {number} [nodeId]
 * @property {number[]} [nodeIds]
 * @property {string}[txtData]
 * @property {string}[tagName]
 * @property {object}[attribute]
 * @property {object}[patchNodes]
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
 * @property {object} [declaration]
 * @property {array} [rmRulesData]
 * @property {string} [ruleTxt]
 */

/** @readonly @enum {Function}*/
export const liveActions = {
    insertNewNodes: insertNewNodes,
    updateTxtNode: updateTxtNode,
    updateTagName: updateTagName,
    updateAttrName: updateAttrName,
    updateAttrValue: updateAttrValue,
    removeNodes: removeNodes,
    appendTxtNode: appendTxtNode,
    addTxtNode: addTxtNode,
    ruleSelector: updateRuleSelector,
    addDeclaration: addDeclaration,
    ruleDeclarations: updateRuleDeclarations,
    removeRules: removeRules,
    insertRule: insertRule,
};

//>>>>>>>>>>>>>>>> HTMLElement Update >>>>>>>>>>>>>>>>>>>>>>
/**@param {refreshData} updateData */
function insertNewNodes(updateData) {
    /**@type {HTMLElement} */
    const domElem = livePreviewIds.get(updateData.nodeId)?.deref();
    if (!domElem) return;
    const docFrag = new DocumentFragment();
    for (const nodeItem of updateData.patchNodes) {
        if (nodeItem.type === Node.TEXT_NODE) docFrag.appendChild(new Text(nodeItem.nodeValue))
        else if (nodeItem.type === Node.ELEMENT_NODE) {
            const newDomElem = document.createElement(nodeItem.tagName);
            if (nodeItem.attributes) {
                for (const attr of nodeItem.attributes) newDomElem.setAttribute(attr.name, attr.value);
            }
            docFrag.appendChild(newDomElem);
        }
    }
    domElem.after(docFrag)
}

/**@param {refreshData} updateData */
function appendTxtNode(updateData) {
    const domElem = livePreviewIds.get(updateData.nodeId)?.deref();
    if (!domElem) return;
    domElem.append(new Text(updateData.txtData))
}

/**@param {refreshData} updateData */
function addTxtNode(updateData) {
    const domElem = livePreviewIds.get(updateData.nodeId)?.deref();
    if (!domElem) return;
    domElem.after(new Text(updateData.txtData))
}

/**@param {refreshData} updateData */
function updateTxtNode(updateData) {
    const txtNode = livePreviewIds.get(updateData.nodeId)?.deref();
    if (!txtNode) return;
    txtNode.nodeValue = updateData.txtData
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
    for (const nodeId of updateData.noteIds) {
        /**@type {HTMLElement} */
        const domElem = livePreviewIds.get(nodeId)?.deref();
        if (!domElem) return;
        domElem.remove();
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
    styleMap.set(updateData.declaration.property, updateData.declaration.value);

}

/**@param {ruleData} updateData */
function updateRuleDeclarations(updateData) {
    const rule = getParentRule(updateData).cssRules[updateData.index];
    if (!rule) return;

    const styleMap = rule.styleMap;
    const data = updateData.declarations;
    if (data.prop === "property") {
        try {
            styleMap.delete(data.oldTxt)
        } catch (error) {
            console.error("cannot delete this property:" + data.prop);
        }
    }
    try {
        styleMap.set(data.declaration.property, data.declaration.value);
    } catch (error) {
        console.error(error);
    }
}

/**@param {ruleData} updateData */
function removeRules(updateData) {
    for (const ruleData of updateData.rmRulesData) {
        ruleData.sheetUrl = updateData.sheetUrl;
        const parentRule = getParentRule(ruleData);
        parentRule.deleteRule(updateData.index);
    }
}

/**@param {ruleData} updateData */
function insertRule(updateData) {
    const parentRule = getParentRule(updateData);
    parentRule.insertRule(updateData.ruleTxt, updateData.index);
}

/** @type {CSSStyleSheet} */
let styleSheet;

/**@param {ruleData} updateData, @returns {CSSStyleSheet}*/
function getParentRule(updateData) {
    const { sheetUrl, parentRule: parentRuleArr } = updateData;
    /**@type {CSSStyleSheet} */
    if (!styleSheet || sheetUrl !== new URL(styleSheet.href).pathname) {
        styleSheet = globalThis.liveStyleSheets.get(sheetUrl);
    }

    let parentRule = styleSheet;
    if (parentRuleArr) {
        let i = parentRuleArr.length;
        while (i--) {
            parentRule = parentRule.cssRules[parentRuleArr[i]];
        }
    }
    return parentRule
}