import * as fs from "fs";

const PREF = "[ASC][WDF]";

/**
 * Write types for the WASM module to the disk.
 * The `.d.ts` file should contain all the signatures of callable function and accessible properties of the WASM module.
 * @param content
 */
export function writeDeclarationFile(content: string) {
  if (!content) {
    console.error(`${PREF} '.d.ts' has no content!`);
    return;
  }
  const fileName = `./assembly/../WasmModule.d.ts`;

  content += `\n\n/** Shape of the WASM module compiled from AssemblyScript */\nexport type WasmModule = typeof __AdaptedExports;`;

  try {
    fs.writeFileSync(fileName, content);
    console.log(`${PREF} '.d.ts' file written successfully!`);
  } catch (error) {
    console.error(`${PREF} Error writing to file: ${error}`);
  }
}