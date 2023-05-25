function openRedirectLink() {
	location.assign(this.previousElementSibling.value);
}

const pathRx = new RegExp(/^\/[/.a-zA-Z0-9-]+$/);

export class RedirectRoute extends HTMLElement {
	constructor(route) {
		super();
		this.route = route;
	}

	openFileLink() {
		location.assign(this.route.filePath);
	}

	addInputBox({ target }) {
		if (target.open) {
			target.lastElementChild.appendChild(this.redirectItem(""));
			target.removeEventListener("toggle", this.toggleEvtCb);
		}
	}

	addRedirect(filePath, { target }) {
		const redirectPath = target.value;
		if (!redirectPath || !pathRx.test(redirectPath)) return console.error("invalid path");
		const payload = {
			filePath,
			redirectPath: redirectPath,
		};

		fetch("/dir-data-request/add-redirect-route", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		})
			.then((response) => {
				response.ok && response.text();
				this.addInputBox({ target });
				target.classList.add("saved");
				toast("path saved");
			})
			.then((data) => console.log(data))
			.catch((err) => console.error(err));
	}

	redirectItem(redirect) {
		return html`<li>
			<input
				type="text"
				value="${redirect}"
				placeholder="enter new path: /blog/first-blog"
				pattern="^/[/.a-zA-Z0-9-]+$"
				required />
			<hp-icon pt="open-link" @click=${openRedirectLink}></hp-icon>
		</li>`;
	}

	render() {
		return html`<details class="redirect-route" @toggle=${this.toggleEvtCb}>
			<summary>
				<hp-icon pt="file-link"></hp-icon>
				<div><a href=${this.route.filePath}>${this.route.filePath}</a></div>
				<hp-icon pt="open-link" @click=${this.openFileLink.bind(this)}></hp-icon>
			</summary>
			<ul class="redirect-path-list" @change=${this.addRedirect.bind(this, this.route.filePath)}>
				${this.route.redirects.map(this.redirectItem)}
			</ul>
		</details>`;
	}

	connectedCallback() {
		this.toggleEvtCb = this.addInputBox.bind(this);
		this.replaceChildren(this.render());
	}
}

customElements.define("redirect-route", RedirectRoute);
