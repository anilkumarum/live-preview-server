export const nodestr = `<section class="sheet">first lorem <header></header></section>`;
export const document = {
	getText(range) {
		if (range) return nodestr.slice(range.start, range.end);
		return nodestr;
	},
	languageId: "html",
	fileName: "samples/index.html",
	getWordRangeAtPosition(start, regrex) {
		const chunk = nodestr.slice(start);
		const [matched] = chunk.match(regrex);
		return { start, end: start + matched.length };
	},
};
