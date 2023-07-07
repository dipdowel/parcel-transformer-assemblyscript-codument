// import test from "tape";
// import { extendJsCode } from "./extend-js-code";
//
// test("extendJsCode should extend the JS glue code correctly with isNode === true", (t) => {
//   const jsCode = "existing JS code  ";
//   const isNode = true;
//   const expectedOutput = `existing JS code  let instance = null;
//       export async function initWasm() {
//         if (instance == null) {
//           let url = new URL("output.wasm", import.meta.url);
//           instance = await instantiate(
//             await WebAssembly.compile(await (await import("node:fs/promises")).readFile(url)),
//             {}
//           );
//         }
//         return instance;
//       }`;
//
//   const result = extendJsCode(jsCode, isNode);
//
//   t.equal(result, expectedOutput, "should extend the JS code correctly");
//   t.end();
// });
//
// test("extendJsCode should extend the JS glue code correctly with isNode === false", (t) => {
//   const jsCode = "existing JS code  ";
//   const isNode = false;
//   const expectedOutput = `existing JS code  let instance = null;
//       export async function initWasm() {
//         if (instance == null) {
//           let url = new URL("output.wasm", import.meta.url);
//           instance = await instantiate(
//             await WebAssembly.compileStreaming(fetch(url)),
//             {}
//           );
//         }
//         return instance;
//       }`;
//
//   const result = extendJsCode(jsCode, isNode);
//
//   t.equal(result, expectedOutput, "should extend the JS code correctly");
//   t.end();
// });
