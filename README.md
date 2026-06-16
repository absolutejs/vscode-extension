# AbsoluteJS VS Code Extension

VS Code extension project for AbsoluteJS. It currently ships HTML and HTMX hover support for island authoring, HTMX-native streaming primitives, and style module import navigation.

It adds hover and autocomplete support for:

- `<absolute-island>`
- `<abs-htmx-stream-slot>`
- `framework`
- `component`
- `hydrate`
- `props`
- `data-absolute-slot`

This project is the dedicated home for AbsoluteJS editor tooling. Today it focuses on plain `.html` files, where TypeScript declarations alone are not enough.

## Install

Install the packaged `.vsix` file from VS Code:

1. Open Extensions
2. Select `...`
3. Choose `Install from VSIX...`

Or use:

```bash
code --install-extension /home/alexkahn/abs/absolutejs-vscode-extension/absolutejs-vscode-0.0.8.vsix
```

## What it adds

- Tag docs for `<absolute-island>` and `<abs-htmx-stream-slot>`
- Attribute docs for island authoring, HTMX streaming authoring, and AbsoluteJS transport markers
- Enumerated value suggestions for framework and hydrate modes
- Go-to-definition from AbsoluteJS style module imports such as `*.module.scss`

## Why this exists

Raw HTML editors do not read framework runtime types or TypeScript DOM declarations for custom element hover the way TSX and SFC tooling does. VS Code HTML custom data is the correct integration point for this experience.
