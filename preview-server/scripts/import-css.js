//because firefox throw syntax error if use import assertions
/** @param {string} filePath, @returns {Promise<CSSStyleSheet>}*/
export const getImportedCss = async (filePath) => (await import(filePath, { assert: { type: "css" } })).default;
