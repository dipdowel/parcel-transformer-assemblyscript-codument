// const anotherFile = require("./dist/index");
// anotherFile();
require = require("esm")(module);
const content = require("./esm/index");
module.exports = content;
