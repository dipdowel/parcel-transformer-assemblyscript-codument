import { defaultError, ParcelError } from "../default-error";
import * as Options from "types:assemblyscript/util/options";
import * as Compiler from "types:assemblyscript/cli/index";

/** Logging prefix */
const PREF = "[ASC][LOAD]";

/** AssemblyScript Compiler type, as defined in `assemblyscript` package */
export type ASC = typeof Compiler;
/** AssemblyScript Compiler Options type, as defined in `assemblyscript` package */
export type ASCOptions = typeof Options;

export type AscLoadResult = {
  asc?: ASC;
  error?: ParcelError;
};

/** Tries to load AssemblyScript compiler that can be used programmatically */
export async function getCompiler(): Promise<AscLoadResult> {
  try {
    // AssemblyScript Compiler is an ESM, hence the trickery to load it into a CommonJS file.
    // NB: in order to make it all work  `tsconfig.json` should contain setting `"moduleResolution": "node16"`

    const asc = await import("assemblyscript/dist/asc.js");
    console.log(`${PREF} 🚀 AssemblyScript compiler loaded`);
    return { asc };
  } catch (e) {
    return {
      error: {
        ...defaultError,
        message: `${PREF} Could not load AssemblyScript compiler. Is it in NODE_MODULES? Error: ${e}`,
      },
    };
  }
}
