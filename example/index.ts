// @ts-ignore
import { initWasm } from "./assembly/index.as";

import { WasmModule } from "./WasmModule";

(async () => {
  try {
    const wasm: WasmModule = await initWasm();

    console.log(
      `wasm memory size: ${wasm.memory.buffer.byteLength / 1024} KiB`
    );

    const addResult = wasm.add(11, 22);
    console.log(`addResult: ${addResult}`);
  } catch (error) {
    console.error("An error occurred:", error);
  }
})();
