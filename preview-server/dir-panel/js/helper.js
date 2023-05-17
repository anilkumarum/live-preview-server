const CharCode = {
	Dot: 46,
};
/**@param {string} filepath,@returns {string}*/
export function extname(filepath) {
	let i = filepath.length;
	while (i--) {
		if (filepath.charCodeAt(i) === CharCode.Dot) return filepath.slice(i + 1);
	}
}
