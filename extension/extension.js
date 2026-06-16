// VSCE currently resolves the entrypoint through this nested path when packaging
// this project, even though the actual implementation lives at the repo root.
// Keep this shim until we switch the extension to a more conventional bundled
// layout, at which point `package.json#main` can point directly at the built file.
module.exports = require("../extension.js");
