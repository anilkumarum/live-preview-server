import { extname } from "/dir-panel/js/helper.js";
import commonCss from "/dir-panel/style/common.css" assert { type: "css" };
import pathTreecss from "/dir-panel/style/path-tree.css" assert { type: "css" };

const treeRoute = eId("tree-route");
$on(treeRoute.nextElementSibling, "click", goToUrl);

function setPath(path) {
	treeRoute.value = path;
}

function goToUrl() {
	location.assign(treeRoute.value);
}

export class PathTree extends HTMLElement {
	notesTree;
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.adoptedStyleSheets = [commonCss, pathTreecss];

		this.selected = "root";
		this.parentId = null;
	}

	pathRoute(pathArr) {
		return pathArr.map((path) =>
			path.isDirectory
				? html`<li>
						<details open>
							<summary>
								<div class="path-item" @mouseenter=${setPath.bind(null, path.path)}>
									<hp-icon pt="folder"></hp-icon>
									<span> ${path.name}</span>
								</div>
							</summary>
							<ul>
								${this.pathRoute(path.files)}
							</ul>
						</details>
				  </li>`
				: html`<li>
						<div class="path-item" @mouseenter=${setPath.bind(this, path.path)} @click=${goToUrl}>
							<hp-icon pt="${extname(path.name) ?? "file"}"></hp-icon>
							<span>${path.name}</span>
						</div>
				  </li>`
		);
	}

	// @ts-ignore
	render() {
		return html`<ul>
			${this.pathRoute(this.notesTree.root)}
		</ul>`;
	}

	async connectedCallback() {
		const res = await fetch("/dir-data-request/dirs-tree");
		res.ok && (this.notesTree = await res.json());
		this.shadowRoot.replaceChildren(this.render());
	}
}

customElements.define("path-tree", PathTree);
