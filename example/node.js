// import wasmString from "bundle-text:./test.wat";
// import wasmString from "./index.as";
import * as wasmBytes from "./assembly/index.as.ts";

console.log(`>>> wasmBytes: ${wasmBytes}`);

//
// var wasmBytes = new TextEncoder().encode(wasmString);
//
// (async () => {
// 	const {
// 		instance: {
// 			exports: { add },
// 		},
// 	} = await WebAssembly.instantiate(wasmBytes);
//
// 	console.log(add(1, 2));
// })();
