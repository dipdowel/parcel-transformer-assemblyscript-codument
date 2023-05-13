//FIXME: come up with a fix for the `@ts-ignore` below!
// @ts-ignore
import { initWasm } from "./assembly/index.as";

(async () => {
  try {
    const wasm = await initWasm();
    const addResult = wasm.add(11, 22);
    console.log(`addResult: ${addResult}`);
  } catch (error) {
    console.error("An error occurred:", error);
  }
})();
