export const findNode1 = JSON.stringify({ type: 3, start: 4, end: 8, id: 1, nodeValue: "data" });

export const findNode2 = JSON.stringify({
	type: 1,
	start: 15,
	end: 120,
	id: 2,
	tagName: "ul",
	attributes: [{ name: "class", start: 18, end: 29, value: "list" }],
});

export const findNode3 = JSON.stringify({
	type: 1,
	start: 89,
	end: 114,
	id: 5,
	tagName: "li",
	attributes: [{ name: "id", start: 92, end: 98, value: "02" }],
});

export const findNode4 = JSON.stringify({ type: 3, start: 100, end: 110, id: 6, nodeValue: "todo list " });

export const insertedTxtNode = JSON.stringify({ type: 3, start: 4, end: 12, id: 7, nodeValue: "this" });

export const insertedElem = JSON.stringify({
	type: 1,
	start: 53,
	end: 62,
	id: 8,
	tagName: "var",
	attributes: null,
});

export const updateTxtNode = JSON.stringify({ type: 3, start: 4, end: 13, id: 1, nodeValue: "this data" });
export const updateTxtNode2 = JSON.stringify({ type: 3, start: 4, end: 8, id: 1, nodeValue: "data" });

export const updateTagName = JSON.stringify({
	type: 1,
	start: 41,
	end: 80,
	id: 3,
	tagName: "list",
	attributes: [{ name: "id", start: 46, end: 52, value: "01" }],
});

export const refreshElemStart = JSON.stringify({
	action: "addTxtNode",
	relative: { relation: "Parent", kinNodeId: 2 },
	txtData: "l",
});

export const refreshNewElem = JSON.stringify({
	action: "insertNewNodes",
	patchNodes: [
		{ type: 1, attributes: null, tagName: "li", parentId: null },
		{ type: 3, nodeValue: "kokal", parentId: 8 },
	],
	replaceTxtNodeId: 7,
});

export const addnewElemBtwTxtNode = JSON.stringify({
	action: "replaceSiblings",
	nodeId: 4,
	siblingDataArr: [
		{ action: "updateTxtNode", txtData: "support full html t" },
		{
			action: "insertNewNodes",
			patchNodes: [
				{ type: 1, attributes: null, tagName: "kbd", parentId: null },
				{ type: 3, nodeValue: "ctrl+j", parentId: 10 },
			],
		},
		{ action: "addTxtNode", txtData: "ags" },
	],
});
