import { document } from "./samples/html.js";
import { PreviewServer } from "./server.mjs";

const previewServer = new PreviewServer(process.cwd(), process.cwd());
await new Promise((r) => setTimeout(r, 1000));

previewServer.onTxtDocumentOpen(document);

const htmlRefresher = previewServer.liveRefresher.get(document.fileName);
function updateElementAtPosition(change, document) {
	const updateData = htmlRefresher.getElemDataAtOffset(change);
	console.log(updateData);
}
/* const change = { rangeOffset: 43, rangeLength: 0, text: "t" };
updateElementAtPosition(change, document);

const change2 = { rangeOffset: 44, rangeLength: 0, text: "h" };
updateElementAtPosition(change2, document); */

const change2 = { rangeOffset: 220, rangeLength: 0, text: "v", range: { start: 220 } };
updateElementAtPosition(change2);

const changeta = { rangeOffset: 220, rangeLength: 1, text: "<var></var>", range: { start: 220 } };
updateElementAtPosition(changeta);

const changeth = { rangeOffset: 225, rangeLength: 0, text: "i", range: { start: 225 } };
updateElementAtPosition(changeth);
// htmlRefresher.prettyPrint();

// htmlRefresher.prettyPrint();

//test with this data
/* {range: r, rangeOffset: 220, rangeLength: 0, text: 'v'}
extensionHostProcess.js:104
{range: r, rangeOffset: 220, rangeLength: 1, text: '<var></var>'}
extensionHostProcess.js:104
{range: r, rangeOffset: 225, rangeLength: 0, text: 'i'} */
