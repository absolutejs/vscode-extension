# Publishing `absolutejs-vscode`

Use this once Microsoft account access is working again.

## Project Path

```bash
cd /home/alexkahn/abs/absolutejs-vscode-extension
```

## Local Packaging

Build the VSIX:

```bash
bunx @vscode/vsce package
```

That produces:

```text
/home/alexkahn/abs/absolutejs-vscode-extension/absolutejs-vscode-0.0.2.vsix
```

Install locally:

```bash
code --install-extension /home/alexkahn/abs/absolutejs-vscode-extension/absolutejs-vscode-0.0.2.vsix
```

If you are using VS Code Remote / WSL, you may still need to reload the remote window after install.

## Marketplace Publisher

Publisher id:

```text
AbsoluteJS
```

Marketplace portal:

```text
https://marketplace.visualstudio.com/manage/publishers
```

## Getting the PAT

You need an Azure DevOps Personal Access Token with marketplace publish permissions.

Start here:

```text
https://aex.dev.azure.com/me
```

If Azure DevOps asks you to create or select an organization, complete that first.

Then go to:

```text
https://dev.azure.com/<your-org>/_usersSettings/tokens
```

Create a new token with:

- Organization: `All accessible organizations` if available
- Scope: `Marketplace (Manage)`

If Microsoft account verification blocks you:

- verify the account at `https://account.live.com/proofs/manage`
- add or confirm phone/email/authenticator methods
- retry PAT creation after Azure DevOps org access works

## Publish

From the extension project:

```bash
VSCE_PAT=your_token bunx @vscode/vsce publish
```

If you want to verify access first:

```bash
VSCE_PAT=your_token bunx @vscode/vsce verify-pat AbsoluteJS
```

## Current Extension Scope

This extension currently provides:

- hover/docs for `<absolute-island>`
- hover/docs for `framework`, `component`, `hydrate`, and `props`
- HTML custom data for raw `.html` and HTMX authoring

This repo is intended to grow into the broader AbsoluteJS VS Code extension, not just HTML island support.

## Packaging Note

There is a small compatibility shim at:

```text
/home/alexkahn/abs/absolutejs-vscode-extension/extension/extension.js
```

`vsce` currently expects that nested entrypoint path during packaging for this
project layout. The real extension logic lives in:

```text
/home/alexkahn/abs/absolutejs-vscode-extension/extension.js
```

If the extension later moves to a bundled layout, this shim can be removed and
`package.json#main` can point directly at the bundled file.
