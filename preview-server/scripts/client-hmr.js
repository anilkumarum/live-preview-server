import { liveActions } from "/live-refresh.js";

const evtSource = new EventSource(`http://localhost:${location.port}/ws`);
addEventListener("beforeunload", () => evtSource.close());

/** @param {MessageEvent} event */
evtSource.onmessage = async (event) => {
	const data = event.data;
	if (data.startsWith("{")) {
		const actionData = JSON.parse(data);
		// console.log(actionData);
		return liveActions[actionData.action](actionData);
	}
	const fileType = data.split(".").pop();
	updateFiles[fileType] ? updateFiles[fileType](data) : reload();
};
evtSource.addEventListener("notice", (event) => {
	const data = event.data;
	if (data.startsWith("hmr")) return console.info("%c" + data, "color:cyan");
	// if(data.startsWith("config"))
});

evtSource.addEventListener("pagenav", (event) => {
	location.assign(event.data);
});
evtSource.onerror = () => evtSource.close();

const updateFiles = {
	css: updateCSSSheet,
	js: updateJsModule,
	json: reload,
	svg: reload,
	png: replaceImage,
	jpeg: replaceImage,
	jpg: replaceImage,
	webp: replaceImage,
	avif: replaceImage,
	pdf: reload,
};

//helper function
/**@param {string} filePath, @returns {string}*/
const getFileName = (filePath) => filePath.slice(filePath.lastIndexOf("/") + 1);

/** @type {number}*/
var timeoutID;
function reload() {
	timeoutID && clearTimeout(timeoutID);
	timeoutID = setTimeout(() => location.reload(), 1000);
}

//helper data
//ctmElem (customElements) -> true
const searchParams = new URL(import.meta.url).searchParams,
	checkCtmElem = searchParams.get("ctmElem"),
	notFirefox = navigator.userAgent.indexOf("Firefox") === -1;

//replace image
/** @param {string} filePath*/
function replaceImage(filePath) {
	const imgName = getFileName(filePath);
	const srcUrl = `${filePath}?t=${Date.now()}`;

	/**@type {NodeListOf<HTMLImageElement>}*/
	const imageElems = document.querySelectorAll(`img[src=${imgName}]`);
	for (const imgElem of imageElems) {
		imgElem.src = srcUrl;
	}
}

//%%%%%%%%%% ----- Update CSS File ---------%%%%%%%%%%
/**@type {Map<string, CSSStyleSheet>} */
globalThis.liveStyleSheets = new Map();
const adoptedSheets = new Map();
// const inlineStyles = new Map();

function setStyleSheets() {
	for (let index = 0; index < document.styleSheets.length; index++) {
		const styleSheet = document.styleSheets[index];
		if (styleSheet.ownerNode.tagName === "LINK") {
			liveStyleSheets.set(new URL(styleSheet.href).pathname, styleSheet);
		}
		/* else if (styleSheet.ownerNode.tagName === "STYLE") {
            const previewId = styleSheet.ownerNode.dataset.previewId;
            inlineStyles.set(Number(previewId), document.styleSheets[index]);
        } */
	}
}
window.addEventListener("load", setStyleSheets);

/** @param {string} filePath*/
function updateCSSSheet(filePath) {
	//TODO separate root path and workspace path
	liveStyleSheets.has(filePath) ? swapStyleLinks(filePath) : notFirefox ? swapStyleSheet(filePath) : reload();
}

/** @param {string} filePath*/
async function swapStyleLinks(filePath) {
	const oldLinkEl = liveStyleSheets.get(filePath).ownerNode;
	/**@type {HTMLLinkElement} */
	const nwLinkTag = oldLinkEl.cloneNode();
	nwLinkTag.href = `${filePath}?t=${Date.now()}`;
	// Once loaded, remove the old link element (with some delay, to avoid FOUC)
	nwLinkTag.addEventListener("load", setNewSheet, { once: true });
	oldLinkEl.after(nwLinkTag);
	console.log("%c" + getFileName(filePath) + " hot reloaded", "color:dodgerblue");

	function setNewSheet() {
		oldLinkEl.remove();
		for (const sheet of document.styleSheets) {
			if (sheet.ownerNode === nwLinkTag) {
				liveStyleSheets.set(filePath, sheet);
				break;
			}
		}
	}
}

//not for firefox
/** @param {string} filePath*/
async function swapStyleSheet(filePath) {
	//TODO support adoptedSheets
	/* 	const filename = getFileName(filePath);
	let existSheet;
	if (adoptedSheets.has(filePath)) existSheet = adoptedSheets.get(filePath);
	else {
		const style = await (await import("./import-css.js")).getImportedCss(filePath);
		existSheet = document.adoptedStyleSheets.find((sheet) => sheet === style);
		if (!existSheet) {
			const customElem = document.querySelector(filename.split(".", 1)[0]);
			if (customElem && customElem.shadowRoot)
				existSheet = customElem.shadowRoot.adoptedStyleSheets?.find((sheet) => sheet === style);
		}
	}

	if (existSheet) {
		adoptedSheets.set(filePath, existSheet);
		try {
			const response = await fetch(filePath);
			if (response.ok) {
				existSheet.replace(response.text());
				console.log("%c" + filename + " hot reloaded", "color:dodgerblue");
			}
		} catch (error) {
			console.log(error);
		}
	} else reload(); */
}

//$$$$$$$ Update js File $$$$$$$
/** @param {string} filename*/
function checkComponent(filename) {
	return customElements.get(filename.split(".", 1)[0]);
}

/** @param {string} filePath*/
async function updateJsModule(filePath) {
	const jsModuleUrl = `${filePath}?t=${Date.now()}`;
	const filename = filePath.slice(filePath.lastIndexOf("/") + 1);

	//check file is web components file
	if (checkComponent(filePath)) {
		await import(jsModuleUrl).catch((err) => console.error(err));
		console.log("%c" + filename + "component hot reloaded", "color:yellow");
	} else reload();
}
