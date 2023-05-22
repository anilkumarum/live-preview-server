## Dependency-free native nodejs live preview server

- Updates your files instantly while typing on your keyboard
- Don't need to live vscode. Embedded inline preview
- Url path completion intellisense in embedded preview
- file extension (.html) don't require in url
- link multiple custom routes on any file url
- option to choose browser in status bar
- 10x-30x less memory consumption due to dynamic loading and no dependency.

⚠️ WARNING: This extension is still under development! ⚠️

# Features

### HTML File Previewing

### Page url path completion intellisense

### Embedded Preview

### Live Refreshing

### External Browser Previewing

### External Browser Debugging

### Console Output Channel (For Embedded Preview)

## Some gotchas in live refresh

- live refresh not update on boolean attribute e.g hidden
  solution: add `=""`. example: `hidden=""`

- CSS live refresh doesn't update in html file
  solution: Use css file

# Issue Tracking

Please file issues against the [Live Preview Server repository](https://github.com/anilkumarum/live-preview-server/issues).
