import * as Options from "types:assemblyscript/util/options";
import * as Compiler from "types:assemblyscript/cli/index";

/** Logging prefix */
const PREF = "[ASC][LOAD]";

/** AssemblyScript Compiler type, as defined in `assemblyscript` package */
export type ASC = typeof Compiler;
/** AssemblyScript Compiler Options type, as defined in `assemblyscript` package */
export type ASCOptions = typeof Options;

/** What the AS compiler returns */
export type APIResult = Compiler.APIResult;

/** Tries to load AssemblyScript compiler that can be used programmatically */
export async function loadCompiler(): Promise<ASC> {
  // throw new Error("Failed to load the compiler :(");

  // AssemblyScript Compiler is an ESM, hence the trickery to load it into a CommonJS file.
  // NB: in order to make it all work  `tsconfig.json` should contain setting `"moduleResolution": "node16"`
  const asc = await import("assemblyscript/dist/asc.js");
  console.log(`${PREF} 🚀 AssemblyScript compiler loaded`);
  return asc;
}
