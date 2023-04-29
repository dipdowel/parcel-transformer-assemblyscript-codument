// import wasmString from "bundle-text:./test.wat";
import wasmString from "./index.as";
import ddd from "./assembly/index";

var wasmBytes = new TextEncoder().encode(wasmString);

(async () => {
	const {
		instance: {
			exports: { add },
		},
	} = await WebAssembly.instantiate(wasmBytes);

	console.log(add(1, 2));
})();
