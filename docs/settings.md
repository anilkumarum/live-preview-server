# Settings

### `livePreviewServer.config.liveRefresh`

Default status : `true`
When you type key, **LPS** update immediately. No need to save file to see change.\
Live refresh work with `.html` and `.css` file.\
It is enable by default. You can turn on/off by setting `true/false`.

### `livePreviewServer.config.customElementHMR`

Default status : `false`
Toggle `hmr` on custom web components

> Note:
> File name must be same as custom element tagName
> e.g filename for `custom-popup` is `custom-popup.js`

### `livePreviewServer.config.serverPort`

Default port: `2200`. \
Enter any port between _2000_ and _65535_

### `livePreviewServer.config.baseDir`

Default base directory : `current workspace folder`
Set base directory.

### `livePreviewServer.config.defaultBrowser`

Change default browser

### `livePreviewServer.config.statusBarCommand`

Default Command: Open Default browser
command execute on status bar click
Change statusBar Command
You can change command to open browser quick pick list

### `livePreviewServer.config.toolTipBrowsers`

Default browsers: `["Chrome","Firefox","other"]`.\
When you hover over `LPS` status bar. Browser list will display.\
Add or remove browsers in tooltip browser list.

### `livePreviewServer.config.updateBrowserPath`

### `livePreviewServer.config.compileTs`

Default status : `false`.
Typescript support out of box.
Set `True` for enable typescript.
Before enable, make sure Typescript installed globally by running `tsc --version`
If not, then run command `npm install -g typescript`

### `livePreviewServer.custom.httpHeaders`

Deafult custom headers: `null`
Add own custom headers in **key:value** format.
example:

```json
{
	"Cross-Origin-Opener-Policy": "same-origin",
	"Cross-Origin-Embedder-Policy": "require-corp"
}
```
