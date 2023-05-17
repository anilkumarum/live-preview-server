globalThis.register = (elemTag, Class) => customElements?.define(elemTag, Class);
globalThis.eId = document.getElementById.bind(document);

//dispatch new event
globalThis.fireEvent = (target, eventName, detail) =>
	target.dispatchEvent(detail ? new CustomEvent(eventName, { detail }) : new CustomEvent(eventName));
// addEventListener wrapper:
globalThis.$on = (target, type, callback) => target.addEventListener(type, callback);
globalThis.$onO = (target, type, callback) => target.addEventListener(type, callback, { once: true });
// Get element by CSS selector:
globalThis.$ = (selector, scope) => (scope || document).querySelector(selector);

/* const snackbar = document.createElement("output");
snackbar.hidden = true;
document.body.appendChild(snackbar);
globalThis.toast = (msg) => {
	snackbar.hidden = false;
	snackbar.innerText = msg;
	setTimeout(() => (snackbar.hidden = true), 4100);
}; */
