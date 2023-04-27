function testMe(string) {
    return string + " Tested v2.1!!!!";
}

module.exports = testMe;


// const { default: ThrowableDiagnostic } = require("@parcel/diagnostic");
// const { Transformer } = require("@parcel/plugin");
//
// module.exports = new Transformer({
//     async transform({ asset, logger, inputFs }) {
//         let {
//             jsResult,
//             wasmResult,
//             error,
//             invalidateOnFileChange,
//             invalidateOnFileCreate,
//             invalidateOnEnvChange,
//         } = await something({
//             filePath: asset.filePath,
//             inputCode: await asset.getCode(),
//             readFile: (...args) => fs.readFile(...args),
//         });
//
//         /*
//         jsResult should be something like
//         ```js
//         const wasmURL = new URL("asc-wasm-module", import.meta.url);
//         export async function instantiate(imports = {}) {
//           const { exports } = await WebAssembly.instantiateStreaming(fetch(wasmURL), imports);
//           // AssemblyScript probably has more code in here for bindings
//           return exports;
//         }
//         ```
//
//         wasmResult should be a binary buffer containing the compiled Wasm
//         */
//
//         if (error) {
//             throw new ThrowableDiagnostic({
//                 diagnostic: {
//                     message: error.message,
//                     codeFrames: [
//                         {
//                             language: "asc",
//                             filePath: error.filePath,
//                             codeHighlights: [
//                                 {
//                                     message: error.detailedMessage,
//                                     start: { line: error.start.line, column: error.start.column },
//                                     end: { line: error.end.line, column: error.end.column },
//                                 },
//                             ],
//                         },
//                     ],
//                 },
//             });
//         }
//
//         for (let file of invalidateOnFileChange) {
//             asset.invalidateOnFileChange(file);
//         }
//         for (let file of invalidateOnFileCreate) {
//             asset.invalidateOnFileCreate({ filePath: file });
//         }
//         for (let envvar of invalidateOnEnvChange) {
//             asset.invalidateOnEnvChange(envvar);
//         }
//
//         asset.type = "js";
//         asset.setCode(result);
//         return [
//             asset,
//             // uniqueKey is however the Wasm module was imported on the JS side.
//             { type: "wasm", content: wasmResult, uniqueKey: "asc-wasm-module" },
//         ];
//     },
// });