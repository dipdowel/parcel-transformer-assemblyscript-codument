import type { FileCreateInvalidation, FilePath } from "@parcel/types";

import path from "path";

import { APIResult, ASC, loadCompiler } from "./compile/load-compiler";

import { read, write } from "./compile/io";
import { CompilationArtifacts } from "./helpers/compilation-artifacts";

/** Logging prefix */
const PREF = "[ASC][COMPILE]";

/** Descriptor of the compilation result */
export type Compiled = {
  invalidateOnFileChange: FilePath[];
  invalidateOnFileCreate: FileCreateInvalidation[];
  invalidateOnEnvChange: string[];
  compilationArtifacts: CompilationArtifacts;
};

// AssemblyScript Compiler suitable for programmatic usage.
// Keeping it as a global variable allows caching in order to avoid reloading the compiler on every compilation
let asc: ASC | undefined;

/**
 * Configures and performs a call to AssemblyScript compiler
 * @param asset
 * @param isDev
 */
export async function compile(
  asset: { filePath: FilePath; inputCode: string },
  isDev: boolean
): Promise<Compiled> {
  // console.log(`>>>>>>> Is ASC from cache? ${!!asc}`);

  console.log(`${PREF} is development build?: ${isDev} `);

  // If ASC hasn't been cached yet, load and cache it.
  if (!asc) {
    asc = await loadCompiler();
  }

  const { filePath, inputCode /*, readFile */ } = asset;
  const absolutePath = path.basename(filePath);

  /** A collection of all the compilation artifacts that ASC produces + compilation statistics info */
  let compilationArtifacts: Partial<CompilationArtifacts> = {};

  // ===================================================================================================================
  // [AssemblyScript Compiler] starts

  // A collection of all the file names referenced in AssemblyScript code.
  // Those files need to be watched by Parcel.
  const filesToWatch: string[] = [];

  // FIXME: See whether it's better to use `asconfig.json` to define the WASM file name
  const cliArgs = [absolutePath, "--outFile", "output.wasm"]; // "--optimize", "--sourceMap", "/output.wasm.map", "--stats",

  // Build the WASM module in debug mode if Parcel is in 'development' mode
  if (isDev) {
    cliArgs.push("--debug");
    cliArgs.push("--target");
    cliArgs.push("debug");
  } else {
    cliArgs.push("--target");
    cliArgs.push("release");
  }

  /** Set up of I/O middleware functions and other compiler API options  */
  const apiOptions = {
    /** @See `read()` in `./compile/io` */
    readFile: (filename: string) => {
      const assemblyDir = "./assembly";
      const filePath = path.join(assemblyDir, filename);

      // We want to watch all the files except the configuration
      !filename.includes(`asconfig.json`) && filesToWatch.push(filePath);
      return read(inputCode, filename, assemblyDir);
    },

    /** @See `write()` in `./compile/io` */
    writeFile: (
      filename: string,
      contents: string | Buffer | Uint8Array,
      baseDir: string
    ) => {
      // Handle the case of `"sourceMap": false,` and similar in `asconfig.json`
      if (!filename || filename.trim().toLowerCase() === "false") {
        return;
      }

      return write(
        compilationArtifacts as CompilationArtifacts,
        filename,
        contents,
        baseDir
      );
    },

    // reportDiagnostic: (diagnostic: any) => {
    //   TODO: Implement a more Parcel-idiomatic handling of errors in AssemblyScript
    //   console.log(`ASC, reportDiagnostic(): ${JSON.stringify(diagnostic)}`);
    // },
  };

  const result: APIResult = await asc.main(cliArgs, apiOptions);

  const {
    error,
    stdout,
    stderr,
    /** @See type `Stats` in https://github.com/AssemblyScript/assemblyscript/blob/main/cli/index.d.ts */
    stats,
  } = result;

  // [AssemblyScript Compiler] ends
  // ===================================================================================================================

  // Store the log-friendly string representation of the compilation statistics
  compilationArtifacts.stats = stats?.toString();

  if (error) {
    // Some formatting for the errors in AssemblyScript code
    const line = "─".repeat(79);
    throw new Error(
      `\n${line}\nAssemblyScript Compiler\n${line}\n${error}\n\n${stderr?.toString()}${line}\n`
    );
  } else {
    console.log(stdout?.toString());
  }

  return {
    compilationArtifacts: compilationArtifacts as CompilationArtifacts,
    invalidateOnFileChange: filesToWatch,
    invalidateOnFileCreate: [],
    invalidateOnEnvChange: [],
  };
}
