// import wasmString from "bundle-text:./test.wat";
// import wasmString from "./index.as";
import * as wasmString from "./assembly/index.as.ts";

var wasmBytes = new TextEncoder().encode(wasmString);

(async () => {
	const {
		instance: {
			exports: { add },
		},
	} = await WebAssembly.instantiate(wasmBytes);

	console.log(add(1, 2));
})();
