const vscode = require("vscode");
const path = require("path");

const SCRIPT_LANGUAGES = [
  "javascript",
  "javascriptreact",
  "typescript",
  "typescriptreact"
];

const STYLE_MODULE_PATTERN = /\.module\.(?:scss|sass|less|styl|stylus)$/i;

const islandTagDoc = new vscode.MarkdownString(
  [
    "```html",
    "<absolute-island framework=\"react\" component=\"ReactCounter\" hydrate=\"load\" props='{\"initialCount\":0}'></absolute-island>",
    "```",
    "",
    "Platform-native AbsoluteJS island element for HTML and HTMX host pages.",
    "AbsoluteJS lowers this element into SSR island markup and the client bootstrap hydrates it according to the `hydrate` mode."
  ].join("\n")
);
islandTagDoc.isTrusted = false;

const htmxStreamSlotTagDoc = new vscode.MarkdownString(
  [
    "```html",
    "<abs-htmx-stream-slot src=\"/htmx/cards/summary\">",
    "  <article class=\"card-fallback\">Loading...</article>",
    "</abs-htmx-stream-slot>",
    "```",
    "",
    "Platform-native AbsoluteJS HTMX streaming primitive.",
    "AbsoluteJS lowers this element into native HTMX markup so the browser performs a normal `hx-get` fragment request."
  ].join("\n")
);
htmxStreamSlotTagDoc.isTrusted = false;

const islandAttributeDocs = new Map([
  [
    "framework",
    "Target framework runtime for this island component. Valid values: `react`, `vue`, `svelte`, `angular`."
  ],
  [
    "component",
    "Registry component name to render for this island."
  ],
  [
    "hydrate",
    "Client hydration timing. `load` hydrates immediately, `idle` waits for idle time, `visible` waits for intersection, and `none` renders static HTML only."
  ],
  [
    "props",
    "JSON-serialized props payload passed to the island component. In HTML, prefer single quotes around the attribute so the JSON can keep its double quotes."
  ]
]);

const globalAttributeDocs = new Map([
  [
    "data-absolute-slot",
    "Marks a DOM node as an AbsoluteJS streaming slot placeholder or slot root. AbsoluteJS uses it to find and patch the correct region during out-of-order streaming."
  ]
]);

const htmxStreamSlotAttributeDocs = new Map([
  [
    "src",
    "HTMX fragment endpoint to request for this slot. AbsoluteJS lowers the tag to `hx-get`."
  ],
  [
    "trigger",
    "Optional HTMX trigger. Defaults to `load`."
  ],
  [
    "swap",
    "Optional HTMX swap strategy. Defaults to `outerHTML`."
  ],
  [
    "target",
    "Optional HTMX target selector. Defaults to `this`."
  ]
]);

function buildHover(text) {
  const markdown = new vscode.MarkdownString(text);
  markdown.isTrusted = false;
  return new vscode.Hover(markdown);
}

function getWordAt(document, position) {
  const range = document.getWordRangeAtPosition(position, /[A-Za-z0-9_-]+/);
  return range ? document.getText(range) : "";
}

function isInsideAbsoluteIsland(document, position) {
  const line = document.lineAt(position.line).text;
  const before = line.slice(0, position.character + 1);
  return before.includes("<absolute-island") || before.includes("</absolute-island");
}

function isInsideAbsoluteHTMXStreamSlot(document, position) {
  const line = document.lineAt(position.line).text;
  const before = line.slice(0, position.character + 1);
  return before.includes("<abs-htmx-stream-slot") || before.includes("</abs-htmx-stream-slot");
}

function provideHover(document, position) {
  const word = getWordAt(document, position);
  if (!word) return null;

  if (word === "absolute-island") {
    return new vscode.Hover(islandTagDoc);
  }

  const globalAttributeDoc = globalAttributeDocs.get(word);
  if (globalAttributeDoc) {
    return buildHover(`**${word}**\n\n${globalAttributeDoc}`);
  }

  if (word === "abs-htmx-stream-slot") {
    return new vscode.Hover(htmxStreamSlotTagDoc);
  }

  if (isInsideAbsoluteIsland(document, position)) {
    const attributeDoc = islandAttributeDocs.get(word);
    if (!attributeDoc) return null;

    return buildHover(`**${word}**\n\n${attributeDoc}`);
  }


  if (isInsideAbsoluteHTMXStreamSlot(document, position)) {
    const attributeDoc = htmxStreamSlotAttributeDocs.get(word);
    if (!attributeDoc) return null;

    return buildHover(`**${word}**\n\n${attributeDoc}`);
  }

  return null;
}

function getQuotedStringRangeAtPosition(document, position) {
  const line = document.lineAt(position.line).text;
  const quoteRanges = [];
  const quotePattern = /(['"])(?:(?=(\\?))\2.)*?\1/g;
  let match;

  while ((match = quotePattern.exec(line)) !== null) {
    const raw = match[0];
    const start = match.index;
    const end = start + raw.length;
    if (
      position.character > start &&
      position.character < end - 1
    ) {
      quoteRanges.push({
        range: new vscode.Range(
          position.line,
          start + 1,
          position.line,
          end - 1
        ),
        text: raw.slice(1, -1)
      });
    }
  }

  return quoteRanges[0] ?? null;
}

function getQuotedStringRanges(document, lineNumber) {
  const line = document.lineAt(lineNumber).text;
  const quoteRanges = [];
  const quotePattern = /(['"])(?:(?=(\\?))\2.)*?\1/g;
  let match;

  while ((match = quotePattern.exec(line)) !== null) {
    const raw = match[0];
    const start = match.index;
    const end = start + raw.length;
    quoteRanges.push({
      range: new vscode.Range(
        lineNumber,
        start + 1,
        lineNumber,
        end - 1
      ),
      text: raw.slice(1, -1)
    });
  }

  return quoteRanges;
}

function isImportLikeLine(document, position, range) {
  const line = document.lineAt(position.line).text;
  const before = line.slice(0, range.start.character);

  return (
    /\bfrom\s*$/.test(before) ||
    /\bimport\s*\(\s*$/.test(before) ||
    /\bimport\s*$/.test(before) ||
    /\brequire\s*\(\s*$/.test(before)
  );
}

function resolveStyleModuleUri(document, quoted) {
  if (!STYLE_MODULE_PATTERN.test(quoted.text)) return null;
  if (!quoted.text.startsWith(".")) return null;
  if (!isImportLikeLine(document, quoted.range.start, quoted.range)) return null;

  const targetPath = path.resolve(
    path.dirname(document.uri.fsPath),
    quoted.text
  );

  return vscode.Uri.file(targetPath);
}

async function uriExists(uri) {
  try {
    await vscode.workspace.fs.stat(uri);

    return true;
  } catch {
    return false;
  }
}

async function provideStyleModuleDefinition(document, position) {
  const quoted = getQuotedStringRangeAtPosition(document, position);
  if (!quoted) return null;

  const targetUri = resolveStyleModuleUri(document, quoted);
  if (!targetUri) return null;
  if (!(await uriExists(targetUri))) return null;

  return new vscode.Location(targetUri, new vscode.Position(0, 0));
}

async function provideStyleModuleDocumentLinks(document) {
  const links = [];

  for (let lineNumber = 0; lineNumber < document.lineCount; lineNumber += 1) {
    const quotedRanges = getQuotedStringRanges(document, lineNumber);

    for (const quoted of quotedRanges) {
      const targetUri = resolveStyleModuleUri(document, quoted);
      if (!targetUri) continue;
      if (!(await uriExists(targetUri))) continue;

      const link = new vscode.DocumentLink(quoted.range, targetUri);
      link.tooltip = "Open style module";
      links.push(link);
    }
  }

  return links;
}

function activate(context) {
  const htmlSelector = [{ language: "html" }];
  const scriptSelector = SCRIPT_LANGUAGES.map((language) => ({ language }));

  context.subscriptions.push(
    vscode.languages.registerHoverProvider(htmlSelector, {
      provideHover
    }),
    vscode.languages.registerDefinitionProvider(scriptSelector, {
      provideDefinition: provideStyleModuleDefinition
    }),
    vscode.languages.registerDocumentLinkProvider(scriptSelector, {
      provideDocumentLinks: provideStyleModuleDocumentLinks
    })
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
