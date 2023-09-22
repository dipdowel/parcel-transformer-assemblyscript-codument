import type { FileCreateInvalidation, FilePath } from "@parcel/types";

import path from "path";

import { APIResult, ASC, loadCompiler } from "./compile/load-compiler";

import { read, write } from "./compile/io";
import { CompilationArtifacts } from "./helpers/compilation-artifacts";
import { dbg } from "./dbg";
import { preprocessDebugStatements } from "./compile/preprocess-debug-statements";

/** Logging prefix */
const PREF = "[ASC][COMPILE]";

/** Descriptor of the compilation result */
export type Compiled = {
  error: Error | undefined;
  invalidateOnFileChange: FilePath[];
  invalidateOnFileCreate: FileCreateInvalidation[];
  invalidateOnEnvChange: string[];
  compilationArtifacts: CompilationArtifacts;
};

// AssemblyScript Compiler suitable for programmatic usage.
// Keeping it as a global variable allows caching in order to avoid reloading the compiler on every compilation
let asc: ASC | undefined;

const line = "─".repeat(79);

/**
 * Configures and performs a call to AssemblyScript compiler
 * @param asset
 * @param isDev
 * @param dropDebugStatements -- whether to ignore debug statements in the code during compilation
 */
export async function compile(
  asset: { filePath: FilePath; inputCode: string },
  isDev: boolean,
  dropDebugStatements: boolean,
): Promise<Compiled> {
  // logger.log(`>>>>>>> Is ASC from cache? ${!!asc}`);

  dbg.log(`${PREF} is development build?: ${isDev} `);

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

      const fileContent = read(inputCode, filename, assemblyDir);

      if (dropDebugStatements) {
        // if configured so, call the preprocessor that removes all the code marked as debug
        return preprocessDebugStatements(fileContent);
      }
      // Otherwise just return the code as it is
      return fileContent;
    },

    /** @See `write()` in `./compile/io` */
    writeFile: (
      filename: string,
      contents: string | Buffer | Uint8Array,
      baseDir: string,
    ) => {
      // Handle the case of `"sourceMap": false,` and similar in `asconfig.json`
      if (!filename || filename.trim().toLowerCase() === "false") {
        return;
      }

      return write(
        compilationArtifacts as CompilationArtifacts,
        filename,
        contents,
        baseDir,
      );
    },

    // reportDiagnostic: (diagnostic: any) => {
    //   TODO: Implement a more Parcel-idiomatic handling of errors in AssemblyScript
    //   logger.log(`ASC, reportDiagnostic(): ${JSON.stringify(diagnostic)}`);
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

  if (!error) {
    dbg.log(stdout?.toString());
  }

  return {
    error: error
      ? new Error(
          `\n${line}\nAssemblyScript Compiler\n${line}\n${error}\n\n${stderr?.toString()}${line}\n`,
        )
      : undefined,
    compilationArtifacts: compilationArtifacts as CompilationArtifacts,
    invalidateOnFileChange: filesToWatch,
    invalidateOnFileCreate: [],
    invalidateOnEnvChange: [],
  };
}
