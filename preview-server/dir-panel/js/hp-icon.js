import icons from "/dir-panel/assets/icons.json" assert { type: "json" };

class HPIcon extends HTMLElement {
	/* 	static get observedAttributes() {
		return ["pt"];
	} */

	constructor() {
		super();
	}

	render(path) {
		return `<svg  viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg">${icons[path]}</svg>`;
	}

	connectedCallback() {
		this.innerHTML = this.render(this.getAttribute("pt"));
	}

	/* 	attributeChangedCallback(name, _, newIcon) {
		name === "pt" &&
			icons[newIcon] &&
			this.firstElementChild &&
			(this.firstElementChild.innerHTML = icons[newIcon]);
	} */
}

customElements.define("hp-icon", HPIcon);
