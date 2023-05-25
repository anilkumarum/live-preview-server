export const findNode = JSON.stringify({
	type: 1,
	selector: "&.success",
	declarations: [
		{
			property: "background-color",
			start: 74,
			value: "limegreen",
			end: 101,
		},
	],
	start: 60,
	selectorEnd: 70,
	end: 104,
	name: null,
	parentRule: [0],
	index: 0,
});

export const insertNestedRule = JSON.stringify({
	action: "insertRule",
	parentRule: [0],
	index: 1,
	ruleTxt: "&.popup { text-transform: lowercase; position: absolute; text-align: center; }",
});

export const insertNestedRuleParent = JSON.stringify({
	type: 1,
	selector: "div",
	start: 0,
	selectorEnd: 4,
	end: 187,
	name: null,
	parentRule: null,
	index: 0,
});

export const addDeclarationData = JSON.stringify([
	{ property: "height", start: 7, value: "100%", end: 19 },
	{
		property: "padding-left",
		start: 22,
		value: "0.4em",
		end: 41,
	},
	{
		property: "text-transform",
		start: 68,
		value: "lowercase",
		end: 94,
	},
	{ property: "color", start: 70, value: "white", end: 82 },
]);

export const insertRuleData = JSON.stringify({
	action: "insertRule",
	parentRule: null,
	index: 2,
	ruleTxt: "span { overflow-wrap: break-word; }",
});
