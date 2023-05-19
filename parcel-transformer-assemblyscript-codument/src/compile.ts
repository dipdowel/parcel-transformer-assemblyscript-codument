import type { FileCreateInvalidation, FilePath } from "@parcel/types";

import path from "path";

import { APIResult, loadCompiler } from "./compile/load-compiler";

import { read, write } from "./compile/io";
import { CompilationArtifacts } from "./helpers/compilation-artifacts";

/**
 * Logging prefix
 * @type {string}
 */
const PREF = "[ASC][COMPILE]";

/** TODO: Write JSDoc */
export type Compiled = {
  invalidateOnFileChange: FilePath[];
  invalidateOnFileCreate: FileCreateInvalidation[];
  invalidateOnEnvChange: string[];
  compiledResult: CompilationArtifacts;
};

/**
 *
 * @param asset
 * @return {Promise<{wasmResult: string, invalidateOnFileChange: *[], invalidateOnEnvChange: *[], error: *, jsResult: string, invalidateOnFileCreate: *[]}>}
 */
/**
 * TODO: Write JSDoc!
 * @param asset
 */
export async function compile(asset: {
  filePath: FilePath;
  inputCode: string;
}): Promise<Compiled> {
  //FIXME: #############################################################################################################
  //FIXME: 1. Load just once and then mem-cache
  //FIXME: 2. Print a log on every usage to see whether the caching actually makes sense here

  //  Load  AssemblyScript Compiler suitable for programmatic usage.
  const asc = await loadCompiler();
  //FIXME: #############################################################################################################

  const { filePath, inputCode /*, readFile */ } = asset;
  // console.log(`>>> compileAssemblyScript(), filePath: ${filePath}`);
  // console.log(`>>> compileAssemblyScript(), inputCode: ${inputCode}`);

  const absolutePath = path.basename(filePath);

  console.log(
    `${PREF} compileAssemblyScript(), absolutePath: ${absolutePath} `
  );

  /** A collection of all the compilation artifacts that ASC produces + compilation statistics info */
  let compilationArtifacts: Partial<CompilationArtifacts> = {};

  // -------------------------------------------------------------------------------------------------------------------
  // [AssemblyScript Compiler] starts
  const result: APIResult = await asc.main(
    [
      /* Command line options */
      absolutePath,
      "--outFile",
      "output.wasm", // FIXME: See whether it's better to use `asconfig.json` to define the WASM file name
      "--debug", // FIXME: enable/disable debug mode depending on the Parcel mode: "development" or "production".
      // "--optimize",
      // "--sourceMap",
      // "/output.wasm.map",
      // "--stats",
    ],
    {
      /* Additional API options */
      // stdout: io.stdout,
      // stderr: (e, e2) => console.log(new Error(e + " :: " + e2)),

      /**
       * Here we hook into how ASC reads files from the file system,
       * and execute our custom file reading logic
       * @See `ascIO.read()`
       */
      readFile: (absolutePath: string, baseDir: string = "./assembly/") =>
        read(inputCode, absolutePath, baseDir),

      /**
       * Here we hook into how ASC writes files to the file system,
       * and execute our custom logic of writing to a file.
       * @See `ascIO.write()`
       */
      writeFile: (
        filename: string,
        contents: string | Buffer | Uint8Array /*Uint8Array*/,
        baseDir: string
      ) =>
        write(
          compilationArtifacts as CompilationArtifacts,
          filename,
          contents,
          baseDir
        ),
    }
  );

  const {
    error,
    stdout,
    stderr,
    /** @See type `Stats` in https://github.com/AssemblyScript/assemblyscript/blob/main/cli/index.d.ts */
    stats,
  } = result;

  // [AssemblyScript Compiler] ends
  // -------------------------------------------------------------------------------------------------------------------

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

  // #####################################################################################################################

  return {
    // FIXME: rename `compiledResult` -> `compilationArtifacts`
    compiledResult: compilationArtifacts as CompilationArtifacts,
    // @ts-ignore
    invalidateOnFileChange: [], // FIXME: Fill in with the filenames ASC tries to read
    // @ts-ignore
    invalidateOnFileCreate: [], // FIXME: Fill in with the filenames created before that ASC sees for the second or a later time (Is it really so?)
    // @ts-ignore
    invalidateOnEnvChange: [], // FIXME: How do I fill in this one?
  };
}
