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
	ruleTxt: "&.popup {\ntext-transform: lowercase;\nposition: absolute;\ntext-align: center;\n}",
});

export const insertRuleData = JSON.stringify({
	action: "insertRule",
	parentRule: null,
	index: 2,
	ruleTxt: "span {\ncolor: aqua;\n}",
});
