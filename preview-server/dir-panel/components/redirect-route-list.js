import { RedirectRoute } from "/dir-panel/components/redirect-route.js";
import commonCss from "/dir-panel/style/common.css" assert { type: "css" };
import redirectCss from "/dir-panel/style/redirect-routes.css" assert { type: "css" };

export class RedirectRouteList extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.adoptedStyleSheets = [commonCss, redirectCss];
	}

	render() {
		return this.redirectRoutes.map((route) => new RedirectRoute(route));
	}

	async connectedCallback() {
		const res = await fetch("/dir-data-request/redirect-routes");
		res.ok && (this.redirectRoutes = await res.json());
		this.shadowRoot.replaceChildren(...this.render());
	}
}

customElements.define("redirect-route-list", RedirectRouteList);
