var parseScript = require("./dist/index.js").parseScript;
var parseModule = require("./dist/index.js").parseModule;

var script = `let b = async () => []; for (a in await b());`;

console.log(JSON.stringify(parseScript(script, {earlyErrors: false}), null, 2));
